import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-config';

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
  // Add more fields as needed based on your API response
  timestamp?: number;
  shiftState?: string;
  power?: number;
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
    drives: TeslaDriveData[];
    charges: TeslaChargeData[];
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
    dataFreshness: 'live' | 'cached' | 'unknown';
    error?: string;
  };
}

export const useUnifiedApiData = (pollInterval: number = 30000) => {
  const [data, setData] = useState<UnifiedApiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      console.warn('🔄 Fetching unified data from worker API...');
      
      const unifiedData = await api.getUnifiedData() as UnifiedApiData;
      console.warn('✅ Unified data received:', {
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
    dataFreshness: data?.tessieStatus?.dataFreshness ?? 'unknown'
  };
};
