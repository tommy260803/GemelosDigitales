"""LangGraph-based analyst agent for the maternal-health digital twin.

The agent uses a ReAct-style graph:
  call_llm ⇄ execute_tools  (loops until the LLM answers without tool calls)

It can call simulation tools, query district data, and produce
evidence-based epidemiological analysis grounded in real model outputs.
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Annotated, Any, Dict, List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages

try:
    from langchain_groq import ChatGroq
except ImportError:  # optional provider — chain simply skips groq/* models
    ChatGroq = None  # type: ignore[assignment]

from services.agent_tools import ANALYSIS_TOOLS

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a Senior Public Health Epidemiologist and System Dynamics Modeler
specialized in Maternal and Child Health in Sub-Saharan Africa
(Kenya, Tanzania, Uganda, Ghana, Ethiopia).

You have access to tools that can:
- Retrieve epidemiological profiles of 25 health districts
- Run system-dynamics simulations (5-stock ODE, RK4 integrator)
- Compare intervention scenarios (baseline, A/B/C/D)
- Inspect model parameters

When answering:
1. Use tools to fetch REAL data before making claims. Never fabricate numbers.
2. Ground every recommendation in actual simulation outputs or district data.
3. Reference the Three-Delays Model and SD feedback loops when relevant.
4. Be concise, professional, and policy-actionable.
5. If a district ID is ambiguous, use list_districts to resolve it.
6. When comparing scenarios, always run compare_scenarios or multiple
   run_simulation calls to get actual figures.
7. Clearly state that outputs are simulated, not empirical observations.
8. Request ALL needed tools in parallel within a single step whenever
   possible; never repeat a tool call with identical arguments.
9. Reach a definitive answer within at most 2 tool rounds. After the data
   is in hand, answer immediately without requesting more tools.

District ID format: "{country_code}-{region}" e.g. "ke-garissa", "tz-arusha".
Scenario IDs: baseline, scenario_a (access/transport), scenario_b (financial),
scenario_c (community/TBA), scenario_d (combined A+B+C+clinical).
"""

# ---------------------------------------------------------------------------
# Tool registry (name → callable)
# ---------------------------------------------------------------------------

_TOOL_MAP = {t.name: t for t in ANALYSIS_TOOLS}

_logger = logging.getLogger(__name__)


def _content_to_text(content: Any) -> str:
    """Normalize AIMessage.content (str or content blocks) to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text") or ""))
            else:
                parts.append(str(getattr(block, "text", "") or ""))
        return "\n".join(p for p in parts if p)
    return str(content or "")


def _execute_tool(tool_call: Dict[str, Any]) -> str:
    """Execute a single tool call and return the result as a string."""
    name = tool_call["name"]
    args = tool_call.get("args", {})
    tool = _TOOL_MAP.get(name)
    if not tool:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        return tool.invoke(args)
    except Exception as e:
        return json.dumps({"error": f"Tool '{name}' failed: {str(e)}"})


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

def _append_tools(old: Optional[List[str]], new: Optional[List[str]]) -> List[str]:
    return list(old or []) + list(new or [])


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    tools_used: Annotated[List[str], _append_tools]
    context_district: Optional[str]
    context_scenario: Optional[str]


# ---------------------------------------------------------------------------
# LLM instances — one per model, plus a quota circuit-breaker
# ---------------------------------------------------------------------------

_DEFAULT_MODELS = (
    "gemini-3.5-flash,gemini-3.6-flash,gemini-2.5-flash,"
    "groq/openai/gpt-oss-120b"
)
_CIRCUIT_TTL_SECONDS = 3600.0

_llm_cache: Dict[str, Any] = {}
_plain_llm_cache: Dict[str, Any] = {}
_circuit_open_until: Dict[str, float] = {}


def _candidate_models() -> List[str]:
    raw = os.environ.get("GEMINI_MODELS") or os.environ.get("GEMINI_MODEL") or _DEFAULT_MODELS
    return [m.strip() for m in raw.split(",") if m.strip()]


def _is_quota_error(exc: Any) -> bool:
    text = str(exc).lower()
    return (
        "429" in text
        or "resource_exhausted" in text
        or "resource exhausted" in text
        or "quota" in text
        or "rate limit" in text
        or "ratelimit" in text
    )


def _open_circuit(model: str, exc: Any) -> None:
    _circuit_open_until[model] = time.time() + _CIRCUIT_TTL_SECONDS
    _logger.warning(
        "Gemini model %s hit quota (%s); backing off for %ss",
        model,
        str(exc)[:200],
        int(_CIRCUIT_TTL_SECONDS),
    )


def _is_circuit_open(model: str) -> bool:
    return _circuit_open_until.get(model, 0.0) > time.time()


def _build_chat_model(model: str, bind_tools: bool) -> Any:
    """Construct a chat model for a provider-prefixed model id ('groq/…' → ChatGroq)."""
    if model.startswith("groq/"):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key or ChatGroq is None:
            return None
        llm = ChatGroq(
            model=model.split("/", 1)[1],
            groq_api_key=api_key,
            temperature=0.7,
            max_tokens=2048,
        )
    else:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.7,
            max_tokens=2048,
        )
    return llm.bind_tools(ANALYSIS_TOOLS) if bind_tools else llm


def _get_llm(model: str):
    """Return the cached tool-bound LLM for a model (or None if unconfigured)."""
    if model not in _llm_cache:
        built = _build_chat_model(model, bind_tools=True)
        if built is None:
            return None
        _llm_cache[model] = built
    return _llm_cache[model]


def _get_plain_llm(model: str):
    """LLM without tools — used for the final forced synthesis."""
    if model not in _plain_llm_cache:
        built = _build_chat_model(model, bind_tools=False)
        if built is None:
            return None
        _plain_llm_cache[model] = built
    return _plain_llm_cache[model]


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------


def call_llm(state: AgentState) -> Dict[str, Any]:
    """Invoke the LLM: initial classification, then synthesis after tools.

    Tries candidate models in order; models whose daily quota is exhausted
    are backed off for an hour and the next candidate takes over.
    """
    messages = [SystemMessage(content=_SYSTEM_PROMPT)] + state["messages"]
    last_error: Optional[Exception] = None
    tried_any = False

    for model in _candidate_models():
        if _is_circuit_open(model):
            continue
        llm = _get_llm(model)
        if llm is None:
            continue
        tried_any = True
        try:
            response = llm.invoke(messages)
            return {"messages": [response]}
        except Exception as exc:
            last_error = exc
            if _is_quota_error(exc):
                _open_circuit(model, exc)
                continue
            raise

    if last_error is not None:
        raise last_error
    if not tried_any and (
        os.environ.get("GEMINI_API_KEY") or os.environ.get("GROQ_API_KEY")
    ):
        raise RuntimeError(
            "All AI models are temporarily rate-limited (daily quota exhausted)."
        )

    fallback = AIMessage(content=_fallback_synthesis(state))
    return {"messages": [fallback]}


def _force_final_answer(state: Dict[str, Any]) -> str:
    """One last no-tools LLM call to synthesize from data already gathered."""
    msgs = list(state.get("messages") or [])
    if not msgs:
        return ""
    prompt = [
        SystemMessage(
            content=_SYSTEM_PROMPT
            + "\nIMPORTANT: Produce the final answer NOW using only the data "
            "already present in the conversation. Do NOT request more tools."
        )
    ] + msgs[-16:]

    for model in _candidate_models():
        if _is_circuit_open(model):
            continue
        llm = _get_plain_llm(model)
        if llm is None:
            continue
        try:
            resp = llm.invoke(prompt)
            text = _content_to_text(getattr(resp, "content", resp))
            if text.strip():
                return text
        except Exception as exc:
            if _is_quota_error(exc):
                _open_circuit(model, exc)
                continue
            _logger.warning(
                "Forced synthesis failed on %s: %s", model, str(exc)[:200]
            )
    return ""


def execute_tools(state: AgentState) -> Dict[str, Any]:
    """Execute all tool calls from the last AI message and return ToolMessages."""
    last_msg = state["messages"][-1]
    if not isinstance(last_msg, AIMessage) or not last_msg.tool_calls:
        return {"messages": [], "tools_used": []}

    tool_messages = []
    tool_names = []
    for tc in last_msg.tool_calls:
        result = _execute_tool(tc)
        tool_messages.append(
            ToolMessage(content=result, tool_call_id=tc["id"])
        )
        tool_names.append(tc["name"])

    return {"messages": tool_messages, "tools_used": tool_names}


# ---------------------------------------------------------------------------
# Routing logic
# ---------------------------------------------------------------------------

def should_use_tools(state: AgentState) -> str:
    """Route to execute_tools while the LLM keeps requesting tool calls."""
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "execute_tools"
    return "end"


# ---------------------------------------------------------------------------
# Fallback (when no Gemini key)
# ---------------------------------------------------------------------------

def _fallback_synthesis(state: AgentState) -> str:
    """Generate a static epidemiological response when Gemini is unavailable."""
    msg = state["messages"][-1].content if state["messages"] else ""
    return (
        "*(Advisor Notice: AI model temporarily unavailable. "
        "Operating in Local Epidemiological Heuristic Mode.)*\n\n"
        "I can still run simulations and retrieve data using the available tools, "
        "but natural-language synthesis is in offline mode.\n\n"
        f"Your query was: {_content_to_text(msg)[:200]}"
    )


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_agent_graph():
    """Build and return the LangGraph analyst agent."""
    graph = StateGraph(AgentState)

    graph.add_node("call_llm", call_llm)
    graph.add_node("execute_tools", execute_tools)

    graph.set_entry_point("call_llm")

    graph.add_conditional_edges(
        "call_llm",
        should_use_tools,
        {
            "execute_tools": "execute_tools",
            "end": END,
        },
    )

    graph.add_edge("execute_tools", "call_llm")

    return graph.compile()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_agent_graph = None


def get_agent_graph():
    """Singleton accessor for the compiled agent graph."""
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
    return _agent_graph


def run_agent(
    user_message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    district_id: Optional[str] = None,
    scenario_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Run the agent with a user message and return the response.

    Parameters
    ----------
    user_message : str
        The user's question or request.
    conversation_history : list, optional
        Prior messages as [{"role": "user"|"assistant", "content": "..."}].
    district_id : str, optional
        Pre-selected district context.
    scenario_id : str, optional
        Pre-selected scenario context.

    Returns
    -------
    dict with keys: reply, tools_used, messages (full trajectory).
    """
    messages: List[BaseMessage] = []

    # Inject district/scenario context as a system note if provided
    context_note = ""
    if district_id:
        context_note += f"Selected district: {district_id}. "
    if scenario_id:
        context_note += f"Active scenario: {scenario_id}. "
    if context_note:
        messages.append(SystemMessage(content=context_note.strip()))

    # Load conversation history (last 10 messages, each truncated to keep
    # prefill latency bounded)
    if conversation_history:
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        for msg in recent_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if not isinstance(content, str):
                content = str(content)
            if len(content) > 1200:
                content = content[:1200] + " …"
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    # Add the current user message
    messages.append(HumanMessage(content=user_message))

    initial_state: AgentState = {
        "messages": messages,
        "tools_used": [],
        "context_district": district_id,
        "context_scenario": scenario_id,
    }

    start = time.monotonic()
    try:
        budget = float(os.environ.get("AGENT_TIME_BUDGET_SECONDS") or 75)
    except ValueError:
        budget = 75.0

    result: Dict[str, Any] = initial_state
    timed_out = False

    try:
        graph = get_agent_graph()
        for snapshot in graph.stream(
            initial_state,
            config={"recursion_limit": 16},
            stream_mode="values",
        ):
            result = snapshot
            if time.monotonic() - start > budget:
                timed_out = True
                _logger.warning(
                    "Agent exceeded %.0fs budget; stopping graph and forcing synthesis",
                    budget,
                )
                break
    except Exception as exc:
        _logger.exception("LangGraph agent failed: %s", exc)
        if _is_quota_error(exc):
            reply = (
                "*(Advisor Notice: The AI model's daily free-tier quota has "
                "been exhausted. Full synthesis will resume after the quota "
                "resets or when the Gemini API plan is upgraded. Simulations "
                "and district data remain available through the dashboard.)*"
            )
        else:
            reply = (
                "*(Advisor Notice: The AI language model is temporarily "
                "unavailable, so I cannot synthesize a full analysis right now. "
                "Please try again in a moment. Simulations and district data "
                "remain available through the dashboard.)*"
            )
        return {
            "reply": reply,
            "tools_used": [],
            "message_count": len(messages),
            "error": str(exc),
        }

    last_human = 0
    for i, msg in enumerate(result["messages"]):
        if isinstance(msg, HumanMessage):
            last_human = i

    candidates = [
        msg
        for msg in result["messages"][last_human + 1 :]
        if isinstance(msg, AIMessage)
    ]

    final_reply = ""
    for require_plain in (True, False):
        for msg in reversed(candidates):
            if require_plain and msg.tool_calls:
                continue
            text = _content_to_text(msg.content)
            if text.strip():
                final_reply = text
                break
        if final_reply:
            break

    if not final_reply:
        final_reply = _force_final_answer(result)

    if not final_reply:
        if timed_out:
            final_reply = (
                f"*(Advisor Notice: The analysis exceeded the {int(budget)}s "
                "time budget. Please try a narrower question — for example, "
                "ask about one scenario or one indicator at a time. "
                "Simulations and district data remain available through "
                "the dashboard.)*"
            )
        else:
            final_reply = (
                "I ran the requested tools but could not produce a final text "
                "answer. Please try rephrasing your question."
            )

    return {
        "reply": final_reply,
        "tools_used": result.get("tools_used", []),
        "message_count": len(result.get("messages", messages)),
        "timed_out": timed_out,
    }
