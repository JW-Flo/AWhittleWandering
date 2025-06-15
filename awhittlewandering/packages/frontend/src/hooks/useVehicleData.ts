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

  useEffect(() => {
    // Function to fetch the current trip day
    async function fetchCurrentTripDay() {
      try {
        const response = await fetch('/api/trip/current');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch current trip data: ${response.status}`);
        }
        
        const data = await response.json();
        
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
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    // Function to fetch route history for a specific day
    async function fetchRouteHistory(day: number) {
      try {
        const response = await fetch(`/api/trip/day/${day}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch day ${day} data: ${response.status}`);
        }
        
        const data = await response.json();
        
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
