import { useState, useEffect, useCallback } from 'react';

interface TeslaDriveData {
  id: number;
  date: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  energyUsed: number;
}

interface TeslaChargeData {
  id: number;
  date: string;
  location: string;
  energyAdded: number;
  duration: number;
}

interface TessieVehicleState {
  charge_state?: {
    battery_level?: number;
    battery_range?: number;
    charging_state?: string;
  };
  climate_state?: {
    inside_temp?: number;
    outside_temp?: number;
  };
  drive_state?: {
    latitude?: number;
    longitude?: number;
    heading?: number;
    speed?: number;
  };
  vehicle_state?: {
    odometer?: number;
  };
}

export interface UnifiedApiData {
  overview: {
    tripName: string;
    vehicle: string;
    startDate: string;
    daysElapsed: number;
    totalMiles: number;
    statesVisited: number;
    totalStates: number;
  };
  currentStatus: {
    battery: {
      level: number;
      range: number;
      charging: string;
    };
    location: {
      coordinates: { lat: number; lng: number };
      city: string;
      state: string;
      lastUpdate: string;
    };
    vehicle: {
      odometer: number;
      speed: number;
      heading: number;
      temperature: {
        inside?: number;
        outside?: number;
      };
    };
  };
  timeline: {
    drives: Array<{
      id: number;
      date: string;
      startLocation: string;
      endLocation: string;
      distance: number;
      duration: number;
      energyUsed: number;
    }>;
    charges: Array<{
      id: number;
      date: string;
      location: string;
      energyAdded: number;
      duration: number;
    }>;
  };
  liveData: {
    timestamp: number;
    vehicleState: TessieVehicleState;
    recentActivity: {
      lastDrive?: TeslaDriveData;
      lastCharge?: TeslaChargeData;
    };
  };
  tessieStatus: {
    connected: boolean;
    lastUpdate: string;
    dataFreshness: 'live' | 'cached';
    error?: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';

export const useUnifiedApiData = (pollInterval: number = 30000) => {
  const [data, setData] = useState<UnifiedApiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching unified data from worker API...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/unified-data`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const unifiedData = await response.json();
      console.log('✅ Unified data received:', {
        connected: unifiedData.tessieStatus?.connected,
        statesVisited: unifiedData.overview?.statesVisited,
        totalMiles: unifiedData.overview?.totalMiles,
        batteryLevel: unifiedData.currentStatus?.battery?.level,
        freshness: unifiedData.tessieStatus?.dataFreshness
      });

      setData(unifiedData);
      setError(null);
      setLastUpdate(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unified data';
      console.error('❌ Error fetching unified data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling interval
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch,
    isConnected: data?.tessieStatus?.connected ?? false,
    dataFreshness: data?.tessieStatus?.dataFreshness ?? 'cached' as const
  };
};
