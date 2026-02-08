import { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '@/lib/api-config';

export interface RealtimeVehicleStatus {
  timestamp: number;
  battery_level: number | null;
  charging_state: string;
  location: {
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speed: number | null;
  };
  odometer: number | null;
  locked: boolean | null;
  climate_on: boolean;
  inside_temp: number | null;
  outside_temp: number | null;
  vehicle_name: string;
  state: string;
  cached?: boolean;
  cacheAge?: number;
  lastUpdated?: string;
}

interface UseRealtimeStatusOptions {
  /** How often to poll for updates in milliseconds (default: 30 seconds) */
  pollInterval?: number;
  /** Whether to automatically start polling on mount (default: true) */
  autoStart?: boolean;
  /** Whether to pause polling when window is not visible (default: true) */
  pauseWhenHidden?: boolean;
}

export function useRealtimeStatus(options: UseRealtimeStatusOptions = {}) {
  const {
    pollInterval = 30000, // 30 seconds - respects the 2-minute cache
    autoStart = true,
    pauseWhenHidden = true
  } = options;

  const [status, setStatus] = useState<RealtimeVehicleStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIVE_STATUS}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Realtime status fetch error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      if (!pauseWhenHidden || isVisibleRef.current) {
        fetchStatus();
      }
    }, pollInterval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const refresh = () => {
    return fetchStatus();
  };

  // Handle visibility change
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isPolling) {
        if (document.hidden) {
          // Page is hidden, we can rely on cache when it becomes visible
        } else {
          // Page is visible again, fetch fresh data
          fetchStatus();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPolling, pauseWhenHidden]);

  // Auto start polling
  useEffect(() => {
    if (autoStart) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, pollInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isLoading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refresh
  };
}

export default useRealtimeStatus;
