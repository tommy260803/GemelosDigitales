import React from 'react'; import { DistrictData } from '../types';
export const DigitalTwinProjectionCard:React.FC<{district:DistrictData; scenarioId?:string}>=({district})=><div className="p-3 rounded border border-slate-800 text-xs text-slate-400">Scenario projection for {district.name} is supplied by the Python RK4 API. No client-side simulation fallback is available.</div>;
