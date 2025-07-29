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

interface HistoricalDrive {
  id: string;
  start_time: string;
  end_time: string;
  start_address: string;
  end_address: string;
  distance_miles: number;
  duration_hours: number;
  start_battery_level: number;
  end_battery_level: number;
  start_coordinates: { lat: number; lng: number };
  end_coordinates: { lat: number; lng: number };
}

interface HistoricalCharge {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  energy_added_kwh: number;
  cost: number;
  start_battery_level: number;
  end_battery_level: number;
  coordinates: { lat: number; lng: number };
}

export const useTessieApi = (apiKey?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [historicalDrives, setHistoricalDrives] = useState<HistoricalDrive[]>([]);
  const [historicalCharges, setHistoricalCharges] = useState<HistoricalCharge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if we're in demo mode (no API key provided)
  const isDemoMode = !apiKey;

  // Demo data for when no API key is provided
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

  const fetchHistoricalDrives = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    if (!apiKey || !vehicleId) {
      console.log('Missing API key or vehicle ID for historical drives');
      return;
    }

    try {
      console.log('Fetching historical drives from Tessie API...', { vehicleId, startDate, endDate });
      const data = await makeApiCall(`${vehicleId}/drives?start_date=${startDate}&end_date=${endDate}`);
      
      console.log('Raw historical drives data:', data);
      
      const drives: HistoricalDrive[] = data.results?.map((drive: any) => ({
        id: drive.id || `drive-${drive.start_time}`,
        start_time: drive.start_time,
        end_time: drive.end_time,
        start_address: drive.start_address || 'Unknown',
        end_address: drive.end_address || 'Unknown',
        distance_miles: drive.distance_miles || 0,
        duration_hours: drive.duration_hours || 0,
        start_battery_level: drive.start_battery_level || 0,
        end_battery_level: drive.end_battery_level || 0,
        start_coordinates: {
          lat: drive.start_latitude || 0,
          lng: drive.start_longitude || 0
        },
        end_coordinates: {
          lat: drive.end_latitude || 0,
          lng: drive.end_longitude || 0
        }
      })) || [];

      console.log('Processed historical drives:', drives);
      setHistoricalDrives(drives);
    } catch (err) {
      console.error('Error fetching historical drives:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical drives');
    }
  }, [apiKey, makeApiCall]);

  const fetchHistoricalCharges = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    if (!apiKey || !vehicleId) {
      console.log('Missing API key or vehicle ID for historical charges');
      return;
    }

    try {
      console.log('Fetching historical charges from Tessie API...', { vehicleId, startDate, endDate });
      const data = await makeApiCall(`${vehicleId}/charges?start_date=${startDate}&end_date=${endDate}`);
      
      console.log('Raw historical charges data:', data);
      
      const charges: HistoricalCharge[] = data.results?.map((charge: any) => ({
        id: charge.id || `charge-${charge.start_time}`,
        start_time: charge.start_time,
        end_time: charge.end_time,
        location: charge.location || 'Unknown',
        energy_added_kwh: charge.energy_added_kwh || 0,
        cost: charge.cost || 0,
        start_battery_level: charge.start_battery_level || 0,
        end_battery_level: charge.end_battery_level || 0,
        coordinates: {
          lat: charge.latitude || 0,
          lng: charge.longitude || 0
        }
      })) || [];

      console.log('Processed historical charges:', charges);
      setHistoricalCharges(charges);
    } catch (err) {
      console.error('Error fetching historical charges:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical charges');
    }
  }, [apiKey, makeApiCall]);

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

  // Fetch historical data when vehicle is selected
  useEffect(() => {
    if (isDemoMode || !selectedVehicle || !apiKey) return;

    const journeyStartDate = '2025-06-01';
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('Fetching historical data from', journeyStartDate, 'to', currentDate);
    fetchHistoricalDrives(selectedVehicle, journeyStartDate, currentDate);
    fetchHistoricalCharges(selectedVehicle, journeyStartDate, currentDate);
  }, [selectedVehicle, apiKey, fetchHistoricalDrives, fetchHistoricalCharges, isDemoMode]);

  return {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    vehicleData,
    historicalDrives,
    historicalCharges,
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
