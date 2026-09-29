import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Cpu,
  Wrench,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  Layers,
  Code2,
  Sparkles,
  Database,
  GitBranch,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';

interface GraphNode {
  id: string;
  name: string;
  description: string;
  type: 'start' | 'llm' | 'tool_executor' | 'condition' | 'terminal';
  inputs: string[];
  outputs: string[];
  tools?: { name: string; description: string }[];
  model_cascade?: string[];
}

export const LangGraphView: React.FC = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('call_llm');
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/agent/graph')
      .then((r) => r.json())
      .then((data) => setGraphData(data))
      .catch((err) => console.warn('Could not fetch live graph metadata:', err));
  }, []);

  const simulationSteps = [
    {
      id: '__start__',
      title: isEs ? '1. Entrada de Usuario & Contexto' : '1. User Input & Context',
      desc: isEs
        ? 'El usuario formula una pregunta. Se inyectan el distrito activo (ej. ke-garissa) y el escenario actual.'
        : 'User submits query. Injects active district (e.g. ke-garissa) and current scenario context.',
      activeNode: '__start__',
    },
    {
      id: 'call_llm',
      title: isEs ? '2. Razonamiento ReAct (call_llm)' : '2. ReAct Reasoning (call_llm)',
      desc: isEs
        ? 'El LLM (Gemini 2.5 Flash) evalúa el contexto, identifica vacíos de datos y decide invocar herramientas epidemiológicas.'
        : 'LLM evaluates context, identifies missing data, and generates structured tool calls.',
      activeNode: 'call_llm',
    },
    {
      id: 'condition',
      title: isEs ? '3. Bifurcación Condicional (should_use_tools)' : '3. Conditional Routing (should_use_tools)',
      desc: isEs
        ? '¿El mensaje contiene llamadas a herramientas? Sí -> Enrutar a execute_tools.'
        : 'Does message contain tool calls? Yes -> Route to execute_tools.',
      activeNode: 'should_use_tools',
    },
    {
      id: 'execute_tools',
      title: isEs ? '4. Ejecución ODE & BD (execute_tools)' : '4. ODE & DB Execution (execute_tools)',
      desc: isEs
        ? 'Se ejecutan las herramientas (ej. compare_scenarios con motor RK4). Se devuelven los resultados al estado del grafo.'
        : 'Tools execute (e.g. compare_scenarios with RK4 engine). Telemetry appended to graph state.',
      activeNode: 'execute_tools',
    },
    {
      id: 'call_llm_synth',
      title: isEs ? '5. Síntesis Epidemiológica (call_llm)' : '5. Synthesis (call_llm)',
      desc: isEs
        ? 'El LLM recibe los datos simulados reales y sintetiza la recomendación final con el marco de Tres Demoras.'
        : 'LLM receives real simulated data and synthesizes final recommendation with Three-Delays framework.',
      activeNode: 'call_llm',
    },
    {
      id: 'end',
      title: isEs ? '6. Entrega Final (__end__)' : '6. Delivery (__end__)',
      desc: isEs
        ? 'Entrega de la respuesta final estructurada en Markdown con números de máx 4 decimales y sugerencias.'
        : 'Final markdown output returned with max 4 decimal metrics and follow-up suggestions.',
      activeNode: 'end',
    },
  ];

  // Simulation timer
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= simulationSteps.length - 1) {
          setIsSimulating(false);
          return 0;
        }
        return prev + 1;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [isSimulating, simulationSteps.length]);

  const activeSimNode = isSimulating ? simulationSteps[simStep]?.activeNode : null;

  const nodes: GraphNode[] = [
    {
      id: '__start__',
      name: isEs ? 'Entrada del Usuario' : 'User Entrypoint',
      description: isEs
        ? 'Punto de partida del grafo. Carga historial de conversación, distrito activo y escenario.'
        : 'Graph entrypoint. Ingests conversation history, active district, and current scenario.',
      type: 'start',
      inputs: ['User Prompt', 'district_id', 'scenario_id'],
      outputs: ['HumanMessage', 'SystemMessage (Context)'],
    },
    {
      id: 'call_llm',
      name: isEs ? 'Razonamiento ReAct & Planificación' : 'ReAct Reasoning & Planning',
      description: isEs
        ? 'Nodo principal de inteligencia. Evalúa si responder directamente o solicitar ejecución de herramientas del gemelo digital.'
        : 'Primary intelligence node. Decides whether to answer directly or request digital twin simulation tools.',
      type: 'llm',
      inputs: ['messages', 'context_district', 'context_scenario'],
      outputs: ['AIMessage (con texto final o lista de tool_calls)'],
      model_cascade: [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'groq/llama-3.3-70b-versatile',
        'Modo Heurístico Local (Offline Fallback)',
      ],
    },
    {
      id: 'execute_tools',
      name: isEs ? 'Ejecutor de Herramientas ODE & BD' : 'ODE & DB Tool Executor',
      description: isEs
        ? 'Ejecuta simulaciones deterministas de Dinámica de Sistemas (RK4) y consultas a PostgreSQL/CSV.'
        : 'Executes deterministic System Dynamics simulations (RK4) and PostgreSQL/CSV queries.',
      type: 'tool_executor',
      inputs: ['tool_calls'],
      outputs: ['ToolMessage (telemetría y resultados)', 'tool_executions'],
      tools: [
        {
          name: 'run_simulation',
          description: isEs
            ? 'Simula el modelo ODE de 5 stocks con RK4 (Δt = 0.05 meses) para un escenario específico.'
            : 'Simulates 5-stock ODE with RK4 (Δt = 0.05 months) for a given scenario.',
        },
        {
          name: 'compare_scenarios',
          description: isEs
            ? 'Ejecuta en paralelo los escenarios Baseline, A, B, C y D, calculando reducción de MMR e ICER.'
            : 'Runs baseline, A, B, C, D scenarios, computing MMR reduction and ICER.',
        },
        {
          name: 'get_district_info',
          description: isEs
            ? 'Recupera el perfil demográfico, de acceso y capacidad clínica de los 25 distritos.'
            : 'Retrieves demographics, access, and capacity profile for 25 districts.',
        },
        {
          name: 'get_model_parameters',
          description: isEs
            ? 'Devuelve los parámetros calibrados del distrito (carreteras, tarifas, confianza, etc.).'
            : 'Returns calibrated district parameters (roads, fees, trust, etc.).',
        },
        {
          name: 'list_districts',
          description: isEs
            ? 'Lista distritos disponibles filtrados por país.'
            : 'Lists available districts filtered by country.',
        },
      ],
    },
    {
      id: 'end',
      name: isEs ? 'Síntesis y Entrega Final' : 'Synthesis & Final Delivery',
      description: isEs
        ? 'Formatea la respuesta final con rigor científico, números con máx 4 decimales y marco de Tres Demoras.'
        : 'Formats final response with scientific rigor, max 4 decimal metrics, and Three-Delays framework.',
      type: 'terminal',
      inputs: ['AIMessage conclusivo'],
      outputs: ['Respuesta Markdown', 'Sugerencias interactivas'],
    },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              LangGraph StateGraph Engine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                v2.4.0 (ReAct Cíclico)
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {isEs
                ? 'Arquitectura de agentes orquestada con LangGraph: LLM ⇄ Herramientas ODE'
                : 'Agent architecture orchestrated with LangGraph: LLM ⇄ ODE Tools'}
            </p>
          </div>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSimulating(!isSimulating);
              if (!isSimulating) setSimStep(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating
              ? isEs
                ? 'Pausar Simulación'
                : 'Pause Walkthrough'
              : isEs
              ? 'Simular Flujo en Vivo'
              : 'Simulate Live Flow'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Visual Graph Canvas */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin flex flex-col items-center justify-center space-y-4 relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Flow Stepper Box if Simulating */}
          {isSimulating && (
            <div className="w-full max-w-xl bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 mb-2 animate-fade-in z-10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  {simulationSteps[simStep]?.title}
                </span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {simStep + 1} / {simulationSteps.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {simulationSteps[simStep]?.desc}
              </p>
            </div>
          )}

          {/* Node 1: Start */}
          <div
            onClick={() => setSelectedNodeId('__start__')}
            className={`w-full max-w-md p-3.5 rounded-xl border transition-all cursor-pointer z-10 ${
              activeSimNode === '__start__'
                ? 'bg-sky-500/20 border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400'
                : selectedNodeId === '__start__'
                ? 'bg-slate-900 border-sky-500 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">
                  S
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    __start__
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                      Entrypoint
                    </span>
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    {isEs ? 'Entrada del Usuario y Contexto' : 'User Query & Context'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Input Ready
              </span>
            </div>
          </div>

          {/* Connector Down */}
          <div className="flex flex-col items-center">
            <div className={`w-0.5 h-6 transition-colors ${activeSimNode === '__start__' ? 'bg-sky-400 animate-pulse' : 'bg-slate-700'}`} />
            <ArrowRight className="w-3.5 h-3.5 rotate-90 text-slate-600 -my-1" />
          </div>

          {/* Node 2: call_llm */}
          <div
            onClick={() => setSelectedNodeId('call_llm')}
            className={`w-full max-w-md p-4 rounded-xl border transition-all cursor-pointer z-10 ${
              activeSimNode === 'call_llm'
                ? 'bg-sky-500/20 border-sky-400 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400'
                : selectedNodeId === 'call_llm'
                ? 'bg-slate-900 border-sky-500 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-bold text-white">call_llm</h5>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30">
                      ReAct Core
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isEs
                      ? 'Razonamiento ReAct & Planificación de Herramientas'
                      : 'ReAct Reasoning & Tool Orchestration'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[9px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      gemini-2.5-flash
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      groq/llama-3.3
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      {isEs ? 'Fallback Local' : 'Local Fallback'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Branching Box */}
          <div className="flex flex-col items-center">
            <div className={`w-0.5 h-5 transition-colors ${activeSimNode === 'should_use_tools' ? 'bg-sky-400 animate-pulse' : 'bg-slate-700'}`} />
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-all ${
                activeSimNode === 'should_use_tools'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              should_use_tools ?
            </div>
            <div className="w-0.5 h-5 bg-slate-700" />
          </div>

          {/* Parallel Nodes Container: execute_tools loop & end */}
          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 z-10">
            {/* Node 3: execute_tools */}
            <div
              onClick={() => setSelectedNodeId('execute_tools')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeSimNode === 'execute_tools'
                  ? 'bg-purple-500/20 border-purple-400 shadow-xl shadow-purple-500/20 ring-2 ring-purple-400'
                  : selectedNodeId === 'execute_tools'
                  ? 'bg-slate-900 border-purple-500 shadow-md'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-xs font-bold text-white">execute_tools</h5>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {isEs
                    ? 'Simulador ODE RK4 y Consultas de Datos'
                    : 'ODE RK4 Simulations & Data Queries'}
                </p>
                <div className="mt-2 text-[9px] text-purple-300 font-mono space-y-0.5">
                  <div>• run_simulation</div>
                  <div>• compare_scenarios</div>
                  <div>• get_district_info</div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[9px] text-purple-400 flex items-center gap-1 font-semibold">
                <RefreshCw className="w-2.5 h-2.5" />
                {isEs ? 'Retroalimenta a call_llm' : 'Loops back to call_llm'}
              </div>
            </div>

            {/* Node 4: end */}
            <div
              onClick={() => setSelectedNodeId('end')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeSimNode === 'end'
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400'
                  : selectedNodeId === 'end'
                  ? 'bg-slate-900 border-emerald-500 shadow-md'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h5 className="text-xs font-bold text-white">__end__</h5>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {isEs
                    ? 'Síntesis Final y Recomendación Política'
                    : 'Final Synthesis & Policy Advice'}
                </p>
                <div className="mt-2 text-[9px] text-emerald-300 font-mono space-y-0.5">
                  <div>• {isEs ? 'Marco 3 Demoras' : '3-Delays'}</div>
                  <div>• {isEs ? 'Máx 4 Decimales' : 'Max 4 Decimals'}</div>
                  <div>• {isEs ? 'Sugerencias' : 'Suggestions'}</div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[9px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-2.5 h-2.5" />
                {isEs ? 'Estado Terminal' : 'Terminal Output'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Node Inspector Panel */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/70 p-4 overflow-y-auto scrollbar-thin flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
            <Layers className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {isEs ? 'Inspector de Nodo' : 'Node Inspector'}
            </h4>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                ID: {selectedNode.id}
              </span>
              <h5 className="text-sm font-bold text-white mt-0.5">{selectedNode.name}</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            {/* Inputs & Outputs */}
            <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isEs ? 'Entradas (Inputs)' : 'Inputs'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.inputs.map((inp, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-700"
                    >
                      {inp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isEs ? 'Salidas (Outputs)' : 'Outputs'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.outputs.map((out, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 text-[10px] font-mono border border-slate-700"
                    >
                      {out}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* If node has model cascade */}
            {selectedNode.model_cascade && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {isEs ? 'Cascada de Modelos Resiliente' : 'Resilient Model Cascade'}
                </span>
                <ul className="space-y-1 text-xs">
                  {selectedNode.model_cascade.map((m, i) => (
                    <li
                      key={i}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950/60 border border-slate-800 text-slate-300 flex items-center justify-between"
                    >
                      <span>{m}</span>
                      <span className="text-[9px] text-slate-500">#{i + 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If node has tools */}
            {selectedNode.tools && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-purple-400" />
                  {isEs ? 'Herramientas Conectadas' : 'Connected Tools'}
                </span>
                <div className="space-y-1.5">
                  {selectedNode.tools.map((tool, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="font-mono font-bold text-purple-300 text-[11px]">
                        {tool.name}()
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {tool.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Runtime Specifications */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>{isEs ? 'Límite de Recursión:' : 'Recursion Limit:'}</span>
                <span className="font-mono text-white">16</span>
              </div>
              <div className="flex justify-between">
                <span>{isEs ? 'Presupuesto de Tiempo:' : 'Time Budget:'}</span>
                <span className="font-mono text-white">75s</span>
              </div>
              <div className="flex justify-between">
                <span>{isEs ? 'Motor Numérico:' : 'ODE Solver:'}</span>
                <span className="font-mono text-white">RK4 (Δt = 0.05m)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
