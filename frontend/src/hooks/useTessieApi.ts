import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  display_name: string;
  state: string;
  vin: string;
}

interface VehicleData {
  battery_level: number;
  battery_range: number;
  charging_state: 'Charging' | 'Complete' | 'Disconnected';
  inside_temp?: number;
  outside_temp?: number;
  odometer: number;
  speed?: number;
  latitude: number;
  longitude: number;
  heading?: number;
  timestamp: number;
}

export const useTessieApi = (apiKey?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Demo data for testing
  const demoVehicle: Vehicle = {
    id: 'demo-midnight-shadow',
    display_name: 'Midnight Shadow',
    state: 'online',
    vin: 'DEMO123'
  };

  const demoVehicleData: VehicleData = {
    battery_level: 82,
    battery_range: 267,
    charging_state: 'Complete',
    inside_temp: 72,
    outside_temp: 78,
    odometer: 70128,
    speed: 0,
    latitude: 41.1865, // Greenwich, CT
    longitude: -73.1532,
    heading: 67,
    timestamp: Date.now(),
  };

  // Check if we're in demo mode (no API key provided)
  const isDemoMode = !apiKey;

  // Demo mode logic
  useEffect(() => {
    if (isDemoMode) {
      console.log('Running in demo mode');
      setVehicles([demoVehicle]);
      setSelectedVehicle(demoVehicle.id);
      setVehicleData(demoVehicleData);
      setError(null);
      setIsLoading(false);
      return;
    }
  }, [isDemoMode]);

  const makeApiCall = useCallback(async (endpoint: string) => {
    if (!apiKey) {
      throw new Error('API key not provided');
    }

    console.log('Making Tessie API call:', { endpoint, hasApiKey: !!apiKey });

    const response = await fetch(`https://api.tessie.com/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Tessie API response:', { 
      status: response.status, 
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tessie API error:', { status: response.status, body: errorText });
      throw new Error(`API call failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Tessie API data received:', { endpoint, dataKeys: Object.keys(data) });
    return data;
  }, [apiKey]);

  const fetchVehicles = useCallback(async () => {
    if (!apiKey) {
      console.log('No API key provided, skipping vehicle fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching vehicles from Tessie API...');
      const data = await makeApiCall('vehicles');
      console.log('Raw vehicle data:', data);
      
      // Transform the vehicle data to match our interface
      const transformedVehicles = data.results?.map((vehicle: any) => ({
        id: vehicle.last_state?.id_s || vehicle.vin,
        display_name: vehicle.last_state?.display_name || `Tesla ${vehicle.vin?.slice(-4) || 'Unknown'}`,
        state: vehicle.last_state?.state || 'unknown',
        vin: vehicle.vin
      })) || [];
      
      console.log('Transformed vehicles:', transformedVehicles);
      setVehicles(transformedVehicles);
      
      if (transformedVehicles.length > 0 && !selectedVehicle) {
        const firstVehicleId = transformedVehicles[0].id;
        console.log('Auto-selecting first vehicle:', firstVehicleId);
        setSelectedVehicle(firstVehicleId);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles';
      console.error('Error fetching vehicles:', err);
      setError(errorMessage);
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, makeApiCall, selectedVehicle, toast]);

  const fetchVehicleData = useCallback(async (vehicleId: string) => {
    if (!apiKey || !vehicleId) {
      console.log('Missing API key or vehicle ID:', { hasApiKey: !!apiKey, vehicleId });
      return;
    }

    try {
      console.log('Fetching vehicle data for:', vehicleId);
      // Use the vehicles endpoint to get current data (which already includes everything)
      const vehiclesData = await makeApiCall('vehicles');
      const currentVehicle = vehiclesData.results?.find((v: any) => 
        (v.last_state?.id_s || v.vin) === vehicleId
      );

      if (!currentVehicle?.last_state) {
        throw new Error('Vehicle data not found');
      }

      const state = currentVehicle.last_state;
      console.log('Raw vehicle state:', state);
      
      const combinedData: VehicleData = {
        battery_level: state.charge_state?.battery_level || 0,
        battery_range: Math.round(state.charge_state?.battery_range || 0),
        charging_state: state.charge_state?.charging_state || 'Disconnected',
        inside_temp: state.climate_state?.inside_temp,
        outside_temp: state.climate_state?.outside_temp,
        odometer: Math.round(state.vehicle_state?.odometer || 0),
        speed: state.drive_state?.speed || 0,
        latitude: state.drive_state?.latitude || 0,
        longitude: state.drive_state?.longitude || 0,
        heading: state.drive_state?.heading,
        timestamp: state.timestamp || Date.now(),
      };

      console.log('Processed vehicle data:', combinedData);
      setVehicleData(combinedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicle data';
      setError(errorMessage);
      console.error('Error fetching vehicle data:', err);
    }
  }, [apiKey, makeApiCall]);

  // Auto-refresh vehicle data every 30 seconds
  useEffect(() => {
    if (isDemoMode || !selectedVehicle || !apiKey) return;

    fetchVehicleData(selectedVehicle);
    const interval = setInterval(() => {
      fetchVehicleData(selectedVehicle);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedVehicle, apiKey, fetchVehicleData, isDemoMode]);

  // Fetch vehicles when API key changes
  useEffect(() => {
    if (isDemoMode) return; // Skip if in demo mode
    
    if (apiKey) {
      fetchVehicles();
    }
  }, [apiKey, fetchVehicles, isDemoMode]);

  return {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    vehicleData,
    isLoading,
    error,
    refetch: () => {
      if (isDemoMode) {
        console.log('Demo mode - simulating refresh');
        // Update timestamp to show refresh happened
        setVehicleData(prev => prev ? { ...prev, timestamp: Date.now() } : null);
        return;
      }
      
      if (selectedVehicle) {
        fetchVehicleData(selectedVehicle);
      }
    },
  };
};