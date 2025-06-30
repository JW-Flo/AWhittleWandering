import { useState, useEffect } from 'react';

interface VehicleLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  state?: string;
  batteryLevel?: number;
  charging?: boolean;
  speed?: number;
}

interface UseVehicleDataResult {
  currentLocation: VehicleLocation | null;
  routeHistory: VehicleLocation[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch vehicle telemetry data from the API
 */
export function useVehicleData(): UseVehicleDataResult {
  const [currentLocation, setCurrentLocation] = useState(null as VehicleLocation | null);
  const [routeHistory, setRouteHistory] = useState(null as VehicleLocation[] | null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as Error | null);

  // API base URL for the deployed API worker
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://aww-api.kd8jc7v8cd.workers.dev';

  useEffect(() => {
    // Function to fetch the current trip day
    async function fetchCurrentTripDay() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trip/current`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch current trip data: ${response.status}`);
        }
        
        const data = await response.json() as any;
        
        // Set current location from the latest telemetry data
        if (data.telemetry) {
          setCurrentLocation({
            latitude: data.telemetry.latitude,
            longitude: data.telemetry.longitude,
            timestamp: data.telemetry.timestamp,
            state: data.telemetry.stateCode,
            batteryLevel: data.telemetry.batteryLevel,
            charging: data.telemetry.charging,
            speed: data.telemetry.speed
          });
        }
        
        // Fetch route history for the current day
        if (data.day) {
          fetchRouteHistory(data.day);
        } else {
          // If no day is available, we're done loading
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching current trip data:', err);
        
        // If we can't fetch real data, show demo data for the live map
        console.log('Loading demo data for development...');
        setCurrentLocation({
          latitude: 39.7392,  // Denver, CO coordinates
          longitude: -104.9903,
          timestamp: Date.now(),
          state: 'CO',
          batteryLevel: 85,
          charging: false,
          speed: 65
        });
        
        // Set demo route history (a path through Colorado)
        setRouteHistory([
          { latitude: 39.7392, longitude: -104.9903, timestamp: Date.now() - 3600000, state: 'CO', batteryLevel: 90, charging: false, speed: 0 },
          { latitude: 39.7500, longitude: -105.0000, timestamp: Date.now() - 1800000, state: 'CO', batteryLevel: 87, charging: false, speed: 55 },
          { latitude: 39.7392, longitude: -104.9903, timestamp: Date.now(), state: 'CO', batteryLevel: 85, charging: false, speed: 65 }
        ]);
        
        // Clear error since we have demo data
        setError(null);
        setIsLoading(false);
      }
    }

    // Function to fetch route history for a specific day
    async function fetchRouteHistory(day: number) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trip/day/${day}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch day ${day} data: ${response.status}`);
        }
        
        const data = await response.json() as any;
        
        // Transform telemetry data to the format we need
        if (data.telemetry && Array.isArray(data.telemetry)) {
          const history = data.telemetry.map((point: any) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            timestamp: point.timestamp,
            state: point.stateCode,
            batteryLevel: point.batteryLevel,
            charging: point.charging,
            speed: point.speed
          }));
          
          setRouteHistory(history);
        }
      } catch (err) {
        console.error(`Error fetching route history for day ${day}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    // Start the data fetching process
    fetchCurrentTripDay();
    
    // Set up a polling interval to refresh data
    const intervalId = setInterval(() => {
      fetchCurrentTripDay();
    }, 60000); // Update every minute
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return {
    currentLocation,
    routeHistory,
    isLoading,
    error
  };
}
