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
  isStale?: boolean;
  statusMessage?: string;
}

/**
 * Hook to fetch vehicle telemetry data from the API
 */
export function useVehicleData(): UseVehicleDataResult {
  const [currentLocation, setCurrentLocation] = useState(null as VehicleLocation | null);
  const [routeHistory, setRouteHistory] = useState(null as VehicleLocation[] | null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null as Error | null);
  const [isStale, setIsStale] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // API base URL for the deployed API worker
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

  useEffect(() => {
    // Function to fetch live telemetry data
    async function fetchTelemetryData() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/telemetry`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch telemetry data: ${response.status}`);
        }
        
        const telemetryResponse = await response.json() as any;
        
        if (telemetryResponse.data) {
          setCurrentLocation({
            latitude: telemetryResponse.data.latitude,
            longitude: telemetryResponse.data.longitude,
            timestamp: telemetryResponse.data.timestamp,
            state: telemetryResponse.data.stateCode,
            batteryLevel: telemetryResponse.data.batteryLevel,
            charging: telemetryResponse.data.charging,
            speed: telemetryResponse.data.speed
          });
          
          // Handle stale data
          setIsStale(!telemetryResponse.fresh);
          if (!telemetryResponse.fresh && telemetryResponse.age) {
            const ageMinutes = Math.floor(telemetryResponse.age / 60000);
            setStatusMessage(`Data delayed, showing last update ${ageMinutes} minutes ago`);
          } else {
            setStatusMessage('');
          }
          
          setError(null);
        } else if (telemetryResponse.error) {
          throw new Error(telemetryResponse.error);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching telemetry data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatusMessage('Live telemetry currently unavailable');
        setIsLoading(false);
      }
    }

    // Function to fetch route history from trip API (fallback)
    async function fetchRouteHistoryData() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trip/current`);
        
        if (response.ok) {
          const data = await response.json() as any;
          
          if (data.day) {
            const dayResponse = await fetch(`${API_BASE_URL}/api/trip/day/${data.day}`);
            if (dayResponse.ok) {
              const dayData = await dayResponse.json() as any;
              
              if (dayData.telemetry && Array.isArray(dayData.telemetry)) {
                const history = dayData.telemetry.map((point: any) => ({
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
            }
          }
        }
      } catch (err) {
        console.error('Error fetching route history:', err);
        // Don't set error for route history - it's optional
      }
    }

    // Start the data fetching process
    fetchTelemetryData();
    fetchRouteHistoryData();
    
    // Set up a polling interval to refresh data
    const intervalId = setInterval(() => {
      fetchTelemetryData();
    }, 60000); // Update every minute
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [API_BASE_URL]);

  return {
    currentLocation,
    routeHistory,
    isLoading,
    error,
    isStale,
    statusMessage
  };
}
