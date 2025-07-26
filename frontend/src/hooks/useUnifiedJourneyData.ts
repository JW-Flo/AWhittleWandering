// Unified Journey Data Hook - Combines timeline, live status, and Tessie API data
// Provides a single interface for all journey-related data across the application

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-config';

interface JourneyOverview {
  name: string;
  startDate: string;
  currentDate: string;
  daysElapsed: number;
  statesVisited: number;
  statesRemaining: number;
  progressPercentage: number;
  totalMiles: number;
  averageMilesPerDay: number;
}

interface CurrentStatus {
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
}

interface UnifiedJourneyData {
  journey: {
    overview: JourneyOverview;
    currentStatus: CurrentStatus;
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchUnifiedData = async () => {
      try {
        setError(null);
        const unifiedData = await apiRequest<UnifiedJourneyData>('/api/v1/unified-data');
        setData(unifiedData);
      } catch (err) {
        console.error('Failed to fetch unified journey data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch journey data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUnifiedData();

    // Set up polling for real-time updates (every 30 seconds)
    interval = setInterval(fetchUnifiedData, 30000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Helper accessors for common data
  const overview = data?.journey?.overview || null;
  const currentStatus = data?.journey?.currentStatus || null;
  const timeline = data?.journey?.timeline || null;
  const liveData = data?.journey?.liveData || null;
  const tessieStatus = data?.journey?.tessieStatus || null;

  return {
    // Core data
    data,
    overview,
    currentStatus,
    timeline,
    liveData,
    tessieStatus,
    
    // State management
    loading,
    error,
    
    // Convenience accessors
    isConnected: tessieStatus?.connected || false,
    lastUpdate: currentStatus?.lastUpdate || null,
    progressPercentage: overview?.progressPercentage || 0,
    statesVisited: overview?.statesVisited || 0,
    currentLocation: currentStatus?.location || null,
    vehicleStatus: currentStatus?.vehicle || null
  };
};

export default useUnifiedJourneyData;
