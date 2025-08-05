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

  const makeApiCall = useCallback(async (endpoint: string) => {
    if (!apiKey) throw new Error('API key not provided');

    const response = await fetch(`https://api.tessie.com/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, [apiKey]);

  const fetchVehicles = useCallback(async () => {
    if (!apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await makeApiCall('vehicles');
      
      // Transform the vehicle data to match our interface
      const transformedVehicles = data.results?.map((vehicle: any) => ({
        id: vehicle.last_state?.id_s || vehicle.vin,
        display_name: vehicle.last_state?.display_name || `Tesla ${vehicle.vin.slice(-4)}`,
        state: vehicle.last_state?.state || 'unknown',
        vin: vehicle.vin
      })) || [];
      
      setVehicles(transformedVehicles);
      
      if (transformedVehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(transformedVehicles[0].id);
      }

      toast({
        title: "Connected successfully",
        description: `Found ${data.results?.length || 0} vehicle(s)`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles';
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
    if (!apiKey || !vehicleId) return;

    try {
      // Use the vehicles endpoint to get current data (which already includes everything)
      const vehiclesData = await makeApiCall('vehicles');
      const currentVehicle = vehiclesData.results?.find((v: any) => 
        (v.last_state?.id_s || v.vin) === vehicleId
      );

      if (!currentVehicle?.last_state) {
        throw new Error('Vehicle data not found');
      }

      const state = currentVehicle.last_state;
      
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
    if (!selectedVehicle || !apiKey) return;

    fetchVehicleData(selectedVehicle);
    const interval = setInterval(() => {
      fetchVehicleData(selectedVehicle);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedVehicle, apiKey, fetchVehicleData]);

  // Fetch vehicles when API key changes
  useEffect(() => {
    if (apiKey) {
      fetchVehicles();
    }
  }, [apiKey, fetchVehicles]);

  return {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    vehicleData,
    isLoading,
    error,
    refetch: () => {
      if (selectedVehicle) {
        fetchVehicleData(selectedVehicle);
      }
    },
  };
};