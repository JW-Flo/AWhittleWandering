// Unified Journey Data Hook - Combines timeline, live status, and Tessie API data
// Provides a single interface for all journey-related data across the application

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-config';

// Drive entry from backend
interface DriveEntry {
  id: string | number;
  date: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  energyUsed: number;
}

// Charge entry from backend
interface ChargeEntry {
  id: string | number;
  date: string;
  location: string;
  energyAdded: number;
  duration: number;
}

// Timeline structure from backend
interface Timeline {
  drives: DriveEntry[];
  charges: ChargeEntry[];
}

// Live data from Tessie API (via backend)
interface LiveData {
  timestamp: number;
  vehicleState: {
    charge_state?: {
      battery_level: number;
      battery_range: number;
      charging_state: string;
    };
    drive_state?: {
      latitude: number;
      longitude: number;
      heading: number;
      speed: number;
    };
    climate_state?: {
      inside_temp?: number;
      outside_temp?: number;
    };
    vehicle_state?: {
      odometer: number;
    };
  };
  recentActivity: {
    lastDrive?: DriveEntry;
    lastCharge?: ChargeEntry;
  };
}

// Overview structure from backend
interface JourneyOverview {
  tripName: string;
  vehicle: string;
  startDate: string;
  daysElapsed: number;
  totalMiles: number;
  currentOdometer: number;
  statesVisited: number;
  totalStates: number;
}

// Current status from backend
interface CurrentStatus {
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
}

// Tessie status from backend
interface TessieStatus {
  connected: boolean;
  lastUpdate: string;
  dataFreshness: 'live' | 'cached' | 'unknown';
  error?: string;
}

// Backend response structure (matches unifiedData.ts skeleton)
interface BackendUnifiedData {
  overview: JourneyOverview;
  currentStatus: CurrentStatus;
  timeline: Timeline;
  liveData: LiveData;
  tessieStatus: TessieStatus;
}

// Normalized data structure for frontend consumption
interface UnifiedJourneyData {
  journey: {
    overview: JourneyOverview;
    currentStatus: CurrentStatus;
    timeline: Timeline;
    liveData: LiveData;
    tessieStatus: TessieStatus;
  };
}

export const useUnifiedJourneyData = () => {
  const [data, setData] = useState<UnifiedJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnifiedData = useCallback(async () => {
    try {
      setError(null);
      const backendData = await apiRequest<BackendUnifiedData>('/api/v1/unified-data');
      
      // Normalize backend response to expected frontend structure
      const normalizedData: UnifiedJourneyData = {
        journey: {
          overview: backendData.overview,
          currentStatus: backendData.currentStatus,
          timeline: backendData.timeline || { drives: [], charges: [] },
          liveData: backendData.liveData,
          tessieStatus: backendData.tessieStatus
        }
      };
      
      setData(normalizedData);
    } catch (err) {
      console.error('Failed to fetch unified journey data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch journey data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUnifiedData();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUnifiedData, 30000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchUnifiedData]);

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
    
    // Refetch function for manual refresh
    refetch: fetchUnifiedData,
    
    // Convenience accessors
    isConnected: tessieStatus?.connected || false,
    lastUpdate: currentStatus?.location?.lastUpdate || null,
    progressPercentage: overview ? Math.round((overview.statesVisited / overview.totalStates) * 100) : 0,
    statesVisited: overview?.statesVisited || 0,
    currentLocation: currentStatus?.location || null,
    vehicleStatus: currentStatus?.vehicle || null
  };
};

export default useUnifiedJourneyData;
