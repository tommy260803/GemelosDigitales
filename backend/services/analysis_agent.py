"""LangGraph-based analyst agent for the maternal-health digital twin.

The agent uses a 3-node graph:
  classify_intent → execute_tools → synthesize

It can call simulation tools, query district data, and produce
evidence-based epidemiological analysis grounded in real model outputs.
"""
from __future__ import annotations

import json
import os
from typing import Annotated, Any, Dict, List, Optional, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages

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

District ID format: "{country_code}-{region}" e.g. "ke-garissa", "tz-arusha".
Scenario IDs: baseline, scenario_a (access/transport), scenario_b (financial),
scenario_c (community/TBA), scenario_d (combined A+B+C+clinical).
"""

# ---------------------------------------------------------------------------
# Tool registry (name → callable)
# ---------------------------------------------------------------------------

_TOOL_MAP = {t.name: t for t in ANALYSIS_TOOLS}


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

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    tools_used: List[str]
    context_district: Optional[str]
    context_scenario: Optional[str]


# ---------------------------------------------------------------------------
# LLM singleton — built once, reused across all graph nodes
# ---------------------------------------------------------------------------

_llm_instance = None


def _get_llm():
    """Return the cached LLM instance (or None if GEMINI_API_KEY is not set)."""
    global _llm_instance
    if _llm_instance is not None:
        return _llm_instance
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    _llm_instance = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.7,
        max_tokens=2048,
    ).bind_tools(ANALYSIS_TOOLS)
    return _llm_instance


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------


def classify_intent(state: AgentState) -> Dict[str, Any]:
    """Call the LLM to decide which tools (if any) to invoke."""
    llm = _get_llm()
    if llm is None:
        fallback = AIMessage(content=_fallback_synthesis(state))
        return {"messages": [fallback], "tools_used": []}

    messages = [SystemMessage(content=_SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response], "tools_used": []}


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


def synthesize(state: AgentState) -> Dict[str, Any]:
    """After tools have run, call the LLM again to synthesize a final answer."""
    llm = _get_llm()
    if llm is None:
        fallback = AIMessage(content=_fallback_synthesis(state))
        return {"messages": [fallback]}

    messages = [SystemMessage(content=_SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


# ---------------------------------------------------------------------------
# Routing logic
# ---------------------------------------------------------------------------

def should_use_tools(state: AgentState) -> str:
    """Decide whether to run tools or go straight to synthesis."""
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "execute_tools"
    return "synthesize"


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
        f"Your query was: {msg[:200]}"
    )


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_agent_graph():
    """Build and return the LangGraph analyst agent."""
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("execute_tools", execute_tools)
    graph.add_node("synthesize", synthesize)

    # Entry point
    graph.set_entry_point("classify_intent")

    # classify_intent → either execute_tools or synthesize
    graph.add_conditional_edges(
        "classify_intent",
        should_use_tools,
        {
            "execute_tools": "execute_tools",
            "synthesize": "synthesize",
        },
    )

    # execute_tools → synthesize
    graph.add_edge("execute_tools", "synthesize")

    # synthesize → end
    graph.add_edge("synthesize", END)

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

    # Load conversation history (trim to last 10 messages to keep context window fresh and bounded)
    if conversation_history:
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        for msg in recent_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
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

    try:
        graph = get_agent_graph()
        result = graph.invoke(initial_state)
    except Exception as exc:
        return {
            "reply": f"*(Advisor Notice: AI model temporarily unavailable. Local mode active.)*\n\n{_fallback_synthesis(initial_state)}",
            "tools_used": [],
            "message_count": len(messages),
            "error": str(exc),
        }

    # Extract the final AI reply
    final_reply = ""
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage) and msg.content:
            final_reply = msg.content
            break

    return {
        "reply": final_reply,
        "tools_used": result.get("tools_used", []),
        "message_count": len(result["messages"]),
    }
