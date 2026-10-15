import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DistrictData, SimulationResult, ValidationMetrics } from '../types';
import * as ApiClient from '../services/api';

interface ApiContextType {
  apiAvailable: boolean | null;
  isLoading: boolean;
  apiResults: Record<string, SimulationResult>;
  apiValidation: ValidationMetrics | null;
  apiError: string | null;
  refreshApiData: (district: DistrictData) => Promise<void>;
}

const ApiContext = createContext<ApiContextType>({
  apiAvailable: null, isLoading: false, apiResults: {}, apiValidation: null,
  apiError: null, refreshApiData: async () => {},
});

export const useApi = () => useContext(ApiContext);

/** The browser only renders FastAPI/RK4 results; it never simulates locally. */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<Record<string, SimulationResult>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => { ApiClient.checkApiAvailability().then(setApiAvailable); }, []);

  const refreshApiData = useCallback(async (district: DistrictData) => {
    setIsLoading(true);
    setApiError(null);
    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        const scenarios = await ApiClient.fetchScenarios();
        const simPromises = scenarios.map(async (scenario) => {
          const res = await ApiClient.runSimulation(district.id, scenario.id, 36);
          return { id: scenario.id, res };
        });
        const resolved = await Promise.all(simPromises);
        const results: Record<string, SimulationResult> = {};
        resolved.forEach(({ id, res }) => {
          results[id] = res;
        });
        setApiResults(results);
        setApiAvailable(true);
        setIsLoading(false);
        return;
      } catch (error: unknown) {
        if (attempts < 2) {
          console.warn('Simulation attempt 1 encountered issue (backend might be waking up). Retrying in 2.5s...', error);
          await new Promise((r) => setTimeout(r, 2500));
        } else {
          setApiResults({});
          setApiError(error instanceof Error ? error.message : 'Failed to fetch backend simulation results');
          setApiAvailable(false);
          setIsLoading(false);
        }
      }
    }
  }, []);

  return <ApiContext.Provider value={{ apiAvailable, isLoading, apiResults, apiValidation: null, apiError, refreshApiData }}>{children}</ApiContext.Provider>;
};
