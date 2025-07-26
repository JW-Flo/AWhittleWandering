import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev';
const LIVE_DATA_REFRESH_INTERVAL = 30000; // 30 seconds

interface UnifiedJourneyData {
  journey: {
    overview: {
      name: string;
      startDate: string;
      currentDate: string;
      daysElapsed: number;
      statesVisited: number;
      statesRemaining: number;
      progressPercentage: number;
      totalMiles: number;
      averageMilesPerDay: number;
    };
    currentStatus: {
      location: {
        state: string;
        city: string;
        coordinates: {
          lat: number;
          lng: number;
        };
      };
      vehicle: {
        batteryLevel: number;
        batteryRange: number;
        chargingState: string;
        odometer: number;
        speed: number;
        outsideTemp: number;
      };
      lastUpdate: string;
    };
    timeline: any;
    liveData: any;
    tessieStatus: {
      connected: boolean;
      lastSync: string;
      refreshInterval: number;
    };
  };
}

export const useUnifiedJourneyData = () => {
  const [data, setData] = useState<UnifiedJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchUnifiedData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/unified-data`);
      if (!response.ok) {
        throw new Error(`Failed to fetch unified data: ${response.status}`);
      }
      
      const unifiedData = await response.json();
      setData(unifiedData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching unified data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load journey data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnifiedData();
    
    // Set up auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchUnifiedData, LIVE_DATA_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const refresh = () => {
    setLoading(true);
    fetchUnifiedData();
  };

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    // Convenience accessors for common data
    overview: data?.journey?.overview,
    currentStatus: data?.journey?.currentStatus,
    timeline: data?.journey?.timeline,
    tessieStatus: data?.journey?.tessieStatus,
  };
};
