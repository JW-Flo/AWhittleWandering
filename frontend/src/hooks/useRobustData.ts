import { useState, useEffect, useCallback } from 'react';
import { useUnifiedTessieApi } from './useUnifiedTessieApi';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  battery_level: number;
  battery_range: number;
  charging_state: string;
  speed?: number;
  timestamp: string;
}

export interface Drive {
  id: string;
  start_date: string;
  end_date: string;
  start_location?: {
    address: string;
  };
  end_location?: {
    address: string;
  };
  distance_miles: number;
  duration_minutes: number;
}

export interface Charge {
  id: string;
  start_date: string;
  end_date: string;
  location?: {
    address: string;
  };
  energy_added: number;
  start_battery_level: number;
  end_battery_level: number;
}

export interface JourneyInsights {
  totalMiles: number;
  statesVisited: string[];
  daysElapsed: number;
  currentState?: string;
  currentProgress?: number;
}

/**
 * useRobustData - A simplified hook that provides consistent data interface
 * Falls back to static data when API is not available
 */
export function useRobustData() {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to use real API data
  const tessieApiKey = import.meta.env.VITE_TESSIE_API_KEY;
  const {
    vehicles,
    vehicleData,
    historicalDrives,
    historicalCharges,
    isLoading: apiLoading,
    error: apiError
  } = useUnifiedTessieApi(tessieApiKey);

  // Transform data to match expected interface
  const currentLocation: CurrentLocation | null = vehicleData ? {
    latitude: vehicleData.latitude,
    longitude: vehicleData.longitude,
    battery_level: vehicleData.battery_level,
    battery_range: vehicleData.battery_range,
    charging_state: vehicleData.charging_state,
    speed: vehicleData.speed,
    timestamp: new Date(vehicleData.timestamp).toISOString()
  } : null;

  const drives: Drive[] = historicalDrives.map(drive => ({
    id: drive.id,
    start_date: drive.start_time,
    end_date: drive.end_time,
    start_location: { address: drive.start_address },
    end_location: { address: drive.end_address },
    distance_miles: drive.distance_miles,
    duration_minutes: drive.duration_hours * 60
  }));

  const charges: Charge[] = historicalCharges.map(charge => ({
    id: charge.id,
    start_date: charge.start_time,
    end_date: charge.end_time,
    location: { address: charge.location },
    energy_added: charge.energy_added_kwh,
    start_battery_level: charge.start_battery_level,
    end_battery_level: charge.end_battery_level
  }));

  // Calculate journey insights
  const journeyInsights: JourneyInsights = {
    totalMiles: drives.reduce((sum, drive) => sum + drive.distance_miles, 0),
    statesVisited: [], // TODO: Extract from addresses
    daysElapsed: 0, // TODO: Calculate from start date
    currentState: 'California',
    currentProgress: 0
  };

  // Fallback to static data if API fails
  useEffect(() => {
    setLoading(apiLoading);
    
    if (apiError) {
      setError(apiError);
      setIsLive(false);
      // Load static fallback data
      loadStaticData();
    } else if (vehicles.length > 0) {
      setError(null);
      setIsLive(true);
    } else {
      setIsLive(false);
      // Load static fallback data
      loadStaticData();
    }
  }, [apiLoading, apiError, vehicles]);

  const [staticData, setStaticData] = useState<{
    drives: Drive[];
    charges: Charge[];
    currentLocation: CurrentLocation | null;
    journeyInsights: JourneyInsights;
  } | null>(null);

  const loadStaticData = useCallback(async () => {
    try {
      // Try to load from static files
      const response = await fetch('/data/processed_telemetry.json');
      if (response.ok) {
        const data = await response.json();
        setStaticData({
          drives: data.drives || [],
          charges: data.charges || [],
          currentLocation: data.currentLocation || null,
          journeyInsights: data.journeyInsights || {
            totalMiles: 0,
            statesVisited: [],
            daysElapsed: 0
          }
        });
        setError(null);
      } else {
        throw new Error('Static data not available');
      }
    } catch (err) {
      console.warn('Could not load static data, using minimal fallback');
      setStaticData({
        drives: [],
        charges: [],
        currentLocation: null,
        journeyInsights: {
          totalMiles: 0,
          statesVisited: [],
          daysElapsed: 0
        }
      });
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    if (isLive) {
      // Refresh API data
      window.location.reload();
    } else {
      // Reload static data
      loadStaticData();
    }
  }, [isLive, loadStaticData]);

  // Return live data if available, otherwise static data
  return {
    drives: isLive ? drives : (staticData?.drives || []),
    charges: isLive ? charges : (staticData?.charges || []),
    currentLocation: isLive ? currentLocation : staticData?.currentLocation || null,
    journeyInsights: isLive ? journeyInsights : (staticData?.journeyInsights || {
      totalMiles: 0,
      statesVisited: [],
      daysElapsed: 0
    }),
    loading,
    error,
    isLive,
    refresh
  };
}
