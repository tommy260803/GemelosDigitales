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
    try {
      const available = await ApiClient.checkApiAvailability();
      setApiAvailable(available);
      if (!available) {
        setApiResults({});
        throw new Error('Backend unavailable; no client-side simulation is available.');
      }
      const results: Record<string, SimulationResult> = {};
      for (const scenario of await ApiClient.fetchScenarios()) {
        results[scenario.id] = await ApiClient.runSimulation(district.id, scenario.id, 36);
      }
      setApiResults(results);
    } catch (error: unknown) {
      setApiResults({});
      setApiError(error instanceof Error ? error.message : 'Failed to fetch backend simulation results');
      setApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return <ApiContext.Provider value={{ apiAvailable, isLoading, apiResults, apiValidation: null, apiError, refreshApiData }}>{children}</ApiContext.Provider>;
};
