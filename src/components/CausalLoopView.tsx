import React, { useState } from 'react';
import { 
  GitMerge, 
  Layers, 
  RotateCw, 
  ArrowRight, 
  Info, 
  Zap, 
  Activity, 
  ShieldAlert,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { DistrictData } from '../types';

interface CausalLoopViewProps {
  district: DistrictData;
}

export const CausalLoopView: React.FC<CausalLoopViewProps> = ({ district }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>('S1');
  const [activeTab, setActiveTab] = useState<'stock_flow' | 'causal_loops' | 'equations'>('stock_flow');

  const stockDetails: Record<string, { title: string; type: string; formula: string; description: string; currentVal: string }> = {
    S1: {
      title: 'Stock S1: Pregnant Women (W)',
      type: 'Primary Population Stock',
      formula: 'dW/dt = Inflow_preg - Flow_ANC - Flow_HomeDel - Flow_Preterm',
      description: 'Accumulates newly pregnant women across the district based on General Fertility Rate and annual live births.',
      currentVal: `${Math.round((district.annualBirths / 12) * 7.5).toLocaleString()} active individuals`,
    },
    S2: {
      title: 'Stock S2: In Antenatal Care (A)',
      type: 'Continuum Clinical Stock',
      formula: 'dA/dt = Flow_ANC - Flow_ANC_to_Delivery - Flow_ANC_to_Complications',
      description: 'Women actively receiving ≥1 to ≥4 Antenatal Care visits. Modulated by community trust and clinic distance.',
      currentVal: `${Math.round((district.annualBirths / 12) * (district.anc4Coverage / 100) * 3.5).toLocaleString()} active individuals`,
    },
    S3: {
      title: 'Stock S3: In Facility Delivery (D)',
      type: 'Acute Delivery Stock',
      formula: 'dD/dt = Flow_ANC_to_Del + Flow_Direct_to_Del + Flow_Referral - Flow_Del_to_Postpartum',
      description: 'Deliveries managed by Skilled Birth Attendants (SBAs) in Primary Health Centers (PHCs) or C-EmONC hospitals.',
      currentVal: `${Math.round((district.annualBirths / 12) * (district.institutionalDeliveryRate / 100) * 0.08).toLocaleString()} at any given hour`,
    },
    S4: {
      title: 'Stock S4: In Postpartum Care (P)',
      type: 'Postpartum Follow-up Stock',
      formula: 'dP/dt = Flow_Del_to_Postpartum + Flow_Home_to_Postpartum - Flow_Exit',
      description: 'Mother and newborn health monitoring for 42 days following delivery for late sepsis, PPH, or depression.',
      currentVal: `${Math.round((district.annualBirths / 12) * 1.4).toLocaleString()} active individuals`,
    },
    S5: {
      title: 'Stock S5: With Obstetric Complications (C)',
      type: 'High-Risk Critical Stock',
      formula: 'dC/dt = Flow_Complications - Flow_Emergency_Referral - Flow_Fatalities - Flow_Recovery',
      description: 'Mothers experiencing severe life-threatening conditions: Postpartum Hemorrhage (PPH), Eclampsia, Sepsis, Obstructed Labor, or Ruptured Uterus.',
      currentVal: `${Math.round((district.annualBirths / 12) * 0.15 * 0.1).toLocaleString()} critical episodes`,
    },
  };

  const feedbackLoops = [
    {
      id: 'R1',
      name: 'R1: Community Trust & Utilization Reinforcing Loop',
      type: 'Reinforcing (+)',
      color: 'teal',
      steps: [
        'Higher institutional survival & lower MMR',
        'Increased community confidence & trust in public health system',
        'Higher demand for ANC & institutional delivery',
        'Fewer unassisted home deliveries with unmanaged hemorrhage',
        'Further reduction in district MMR',
      ],
      interventions: 'Scenario (b) User Fee Elimination + Scenario (c) TBA Certification',
    },
    {
      id: 'B1',
      name: 'B1: Facility Capacity & Workload Balancing Loop',
      type: 'Balancing (-)',
      color: 'amber',
      steps: [
        'Surge in facility delivery volume',
        'Midwife and doctor workload exceeds 1:15 safe ratio threshold',
        'Emergency response speed declines & medicine stockouts occur',
        'Case Fatality Rate (CFR) for complications increases',
        'Negative feedback dampens community preference for facilities',
      ],
      interventions: 'Health system workforce expansion + Essential oxytocin buffer stocks',
    },
    {
      id: 'B2',
      name: 'B2: Phase 2 Geographic Referral Delay Balancing Loop',
      type: 'Balancing (-)',
      color: 'rose',
      steps: [
        'Onset of severe complication in remote primary health center',
        'Road friction and lack of emergency transport create 3–5 hour transit delay',
        'Irreversible hemorrhagic shock or eclamptic seizure occurs before reaching C-EmONC',
        'Elevated facility admission mortality',
      ],
      interventions: 'Scenario (a) 4x4 Motorcycle Ambulance Fleet with GPS dispatch',
    },
  ];

  return (
    <div className="space-y-4">
      
      {/* Navigation and Concept Header */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>SYSTEM DYNAMICS CONTINUUM TOPOLOGY &amp; FEEDBACK LOOPS</span>
              </h2>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              5-Stock Non-linear Differential Equation Model with Endogenous Feedback Loops (R1, B1, B2)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#0c0e12] p-1 rounded border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('stock_flow')}
              className={`px-2 sm:px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'stock_flow' ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stock &amp; Flow
            </button>
            <button
              onClick={() => setActiveTab('causal_loops')}
              className={`px-2 sm:px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'causal_loops' ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Feedback Loops
            </button>
            <button
              onClick={() => setActiveTab('equations')}
              className={`px-2 sm:px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'equations' ? 'bg-sky-600 text-white shadow-md shadow-sky-900/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              ODEs
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: STOCK AND FLOW TOPOLOGY */}
      {activeTab === 'stock_flow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Interactive Visual Canvas (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase">INTERACTIVE CONTINUOUS FLOW MAP</span>
              <span className="text-slate-500 text-[11px]">Click any compartment to inspect ODE parameters</span>
            </div>

            {/* SVG Diagram Canvas */}
            <div className="relative w-full bg-[#131a26] rounded-lg border border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
              
              {/* Inflow Label */}
              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono mb-2">
                <span className="animate-pulse w-2 h-2 rounded-full bg-sky-400" />
                <span>FERTILITY &amp; PREGNANCIES INFLOW</span>
              </div>

              {/* Five Stock Boxes Row */}
              <div className="w-full overflow-x-auto py-2 scrollbar-none">
                <div className="grid grid-cols-5 gap-2 my-auto z-10 font-mono min-w-[480px]">
                  {[
                    { id: 'S1', name: 'S1: Pregnant', color: 'border-sky-500/80 bg-sky-950/40 text-sky-300' },
                    { id: 'S2', name: 'S2: In ANC', color: 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300' },
                    { id: 'S3', name: 'S3: Facility Del.', color: 'border-indigo-500/80 bg-indigo-950/40 text-indigo-300' },
                    { id: 'S4', name: 'S4: Postpartum', color: 'border-amber-500/80 bg-amber-950/40 text-amber-300' },
                    { id: 'S5', name: 'S5: Complications', color: 'border-rose-500/80 bg-rose-950/40 text-rose-300' },
                  ].map((s) => {
                    const isSelected = selectedElement === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedElement(s.id)}
                        className={`p-2 sm:p-2.5 rounded border text-center transition cursor-pointer flex flex-col items-center justify-between h-24 sm:h-28 ${s.color} ${
                          isSelected ? 'ring-2 ring-sky-400 scale-105 shadow-lg shadow-sky-900/40' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span className="text-xs font-bold">{s.id}</span>
                        <span className="text-[10px] font-bold leading-tight">{s.name.split(':')[1]}</span>
                        <span className="text-[8px] px-1 py-0.5 rounded bg-[#0c0e12] text-slate-300 font-mono">
                          ACTIVE STOCK
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Loop Connectors Banner */}
              <div className="bg-[#0c0e12]/90 border border-slate-800 rounded p-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-300 z-10 mt-2">
                <div className="flex items-center space-x-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                  <span><strong>R1:</strong> Trust Loop</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong>B1:</strong> Workload Balancing</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>B2:</strong> Phase 2 Transport Delay</span>
                </div>
              </div>

            </div>

            <div className="text-[10px] text-slate-400 bg-[#0c0e12] p-2.5 rounded border border-slate-800 font-mono">
              💡 <strong>System Dynamics Rule:</strong> Stock variables accumulate individuals over time, while flow rates (valves) represent rates of transfer determined by maternal education, distance, clinic fees, and SBA capacity.
            </div>
          </div>

          {/* Element Inspector Drawer (1 Col) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            {selectedElement && stockDetails[selectedElement] ? (
              <div className="space-y-3 font-mono">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase border border-sky-500/30">
                    {stockDetails[selectedElement].type}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {stockDetails[selectedElement].title}
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Differential Equation (ODE):</label>
                    <div className="p-2 rounded bg-[#0c0e12] font-mono text-sky-300 text-[10px] border border-slate-800">
                      {stockDetails[selectedElement].formula}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">District Magnitude:</label>
                    <div className="text-xs font-bold text-slate-100">
                      {stockDetails[selectedElement].currentVal}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Behavioral Role:</label>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      {stockDetails[selectedElement].description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-sky-950/30 border border-sky-500/30 text-sky-200 text-xs">
                    <span className="font-bold block mb-0.5 text-[10px] uppercase">Calibration Driver:</span>
                    <span>Modulated by {district.name}'s baseline SBA ratio ({district.skilledStaffRatio}/1k) &amp; ANC4 coverage ({district.anc4Coverage}%).</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Select a stock component to view mathematical formulation
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW TAB 2: CAUSAL FEEDBACK LOOPS */}
      {activeTab === 'causal_loops' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feedbackLoops.map((loop) => (
            <div 
              key={loop.id}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    loop.type.includes('Reinforcing') 
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {loop.type}
                  </span>
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase">{loop.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs">
                  {loop.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-slate-300">
                      <span className="w-3.5 h-3.5 rounded bg-slate-800 text-sky-400 flex items-center justify-center shrink-0 text-[9px] font-mono font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-[11px]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800 text-xs font-mono">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Mitigating Scenario:</span>
                <span className="font-bold text-sky-400 text-[11px]">{loop.interventions}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW TAB 3: MATHEMATICAL ODES */}
      {activeTab === 'equations' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Full Non-Linear Differential Equation System</h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Solved using Runge-Kutta 4th Order (RK4) numerical integration with time-step &Delta;t = 0.1 months:
          </p>

          <div className="space-y-2 font-mono text-[11px] text-sky-300 bg-[#0c0e12] p-4 rounded border border-slate-800 overflow-x-auto">
            <div className="p-1.5 border-b border-slate-900">
              <span className="text-slate-500 block text-[10px]">// 1. Pregnant Women Stock (S1)</span>
              <div>dW/dt = Inflow_Pregnancies - Flow_ANC(W, Trust, Distance) - Flow_Direct_Home(W) - Flow_Direct_Del(W)</div>
            </div>
            <div className="p-1.5 border-b border-slate-900">
              <span className="text-slate-500 block text-[10px]">// 2. Antenatal Care Stock (S2)</span>
              <div>dA/dt = Flow_ANC(W) - Flow_ANC_to_Facility(A, Fees, Quality) - Flow_ANC_to_Home(A)</div>
            </div>
            <div className="p-1.5 border-b border-slate-900">
              <span className="text-slate-500 block text-[10px]">// 3. Facility Delivery Stock (S3)</span>
              <div>dD/dt = Flow_ANC_to_Facility + Flow_Direct_Del + Flow_Emergency_Referral(C, MotoAmbulance) - (D / &tau;_delivery)</div>
            </div>
            <div className="p-1.5 border-b border-slate-900">
              <span className="text-slate-500 block text-[10px]">// 4. Obstetric Complications Stock (S5)</span>
              <div>dC/dt = Flow_Onset_Complications(Deliveries, Pre-eclampsia) - Flow_Emergency_Referral - Flow_Fatalities(C, Delay)</div>
            </div>
            <div className="p-1.5">
              <span className="text-slate-500 block text-[10px]">// 5. Postpartum Monitoring Stock (S4)</span>
              <div>dP/dt = Flow_Recovered_Facility + Flow_Recovered_Complications + Flow_Recovered_Home - (P / &tau;_postpartum)</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
