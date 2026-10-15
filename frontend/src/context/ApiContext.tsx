import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DistrictData, SimulationResult, ValidationMetrics } from '../types';
import * as ApiClient from '../services/api';

interface ApiContextType {
  apiAvailable: boolean | null;
  isLoading: boolean;
  apiResults: Record<string, SimulationResult>;
  apiValidation: ValidationMetrics | null;
  apiError: string | null;
  refreshApiData: (district: DistrictData) => Promise<void>;
  retryConnection: () => Promise<void>;
}

const ApiContext = createContext<ApiContextType>({
  apiAvailable: null,
  isLoading: false,
  apiResults: {},
  apiValidation: null,
  apiError: null,
  refreshApiData: async () => {},
  retryConnection: async () => {},
});

export const useApi = () => useContext(ApiContext);

/** The browser only renders FastAPI/RK4 results; it never simulates locally. */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<Record<string, SimulationResult>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const currentDistrictRef = useRef<DistrictData | null>(null);

  // Initial availability check with cold-start tolerance
  useEffect(() => {
    let isMounted = true;
    ApiClient.checkApiAvailability(20000).then((healthy) => {
      if (isMounted) setApiAvailable(healthy);
    });

    // Heartbeat: ping /backend-health every 10 minutes to prevent Render Free spin-down while user is active
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        ApiClient.checkApiAvailability(15000).catch(() => {});
      }
    }, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(heartbeat);
    };
  }, []);

  const refreshApiData = useCallback(async (district: DistrictData) => {
    currentDistrictRef.current = district;
    setIsLoading(true);
    setApiError(null);

    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const scenarios = await ApiClient.fetchScenarios().catch(() => [
          { id: 'baseline' },
          { id: 'scenario_a' },
          { id: 'scenario_b' },
          { id: 'scenario_c' },
          { id: 'scenario_d' },
        ]);

        const simPromises = scenarios.map(async (scenario: { id: string }) => {
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
        setApiError(null);
        return;
      } catch (error: unknown) {
        console.warn(`Simulation attempt ${attempt}/${maxAttempts} encountered issue (backend might be waking up):`, error);
        if (attempt < maxAttempts) {
          // Wait progressively: 3s on first retry, 6s on second
          await new Promise((r) => setTimeout(r, attempt * 3000));
        } else {
          setApiResults({});
          setApiError(error instanceof Error ? error.message : 'Failed to fetch backend simulation results');
          setApiAvailable(false);
          setIsLoading(false);
        }
      }
    }
  }, []);

  const retryConnection = useCallback(async () => {
    if (currentDistrictRef.current) {
      await refreshApiData(currentDistrictRef.current);
    } else {
      const isHealthy = await ApiClient.checkApiAvailability(25000);
      setApiAvailable(isHealthy);
    }
  }, [refreshApiData]);

  return (
    <ApiContext.Provider
      value={{
        apiAvailable,
        isLoading,
        apiResults,
        apiValidation: null,
        apiError,
        refreshApiData,
        retryConnection,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
