import { useState, useEffect, useCallback, useMemo } from 'react';

interface Vehicle {
  id: string;
  display_name: string;
  state: string;
  vin: string;
}

interface VehicleData {
  battery_level: number;
  battery_range: number;
  charging_state: string;
  inside_temp: number;
  outside_temp: number;
  odometer: number;
  speed: number;
  latitude: number;
  longitude: number;
  heading: number;
  timestamp: number;
}

interface DriveSession {
  id: string;
  start_date: string;
  end_date: string;
  start_location_name: string;
  end_location_name: string;
  distance_miles: number;
  duration_minutes: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
}

interface ChargeSession {
  id: string;
  start_date: string;
  end_date: string;
  location_name: string;
  energy_added: number;
  cost: number;
  latitude: number;
  longitude: number;
}

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export const useEnhancedTessieApi = (apiKey?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [driveHistory, setDriveHistory] = useState<DriveSession[]>([]);
  const [chargeHistory, setChargeHistory] = useState<ChargeSession[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeApiCall = useCallback(async (endpoint: string) => {
    if (!apiKey) throw new Error('API key required');
    
    const response = await fetch(`https://api.tessie.com${endpoint}`, {
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
    try {
      setIsLoading(true);
      setError(null);
      const data = await makeApiCall('/vehicles');
      
      const vehicleList = data.results.map((vehicle: any) => ({
        id: vehicle.last_state?.id_s || vehicle.vin,
        display_name: vehicle.last_state?.display_name || `Tesla ${vehicle.vin.slice(-6)}`,
        state: vehicle.last_state?.state || 'unknown',
        vin: vehicle.vin,
      }));

      setVehicles(vehicleList);
      if (vehicleList.length > 0 && !selectedVehicle) {
        setSelectedVehicle(vehicleList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [makeApiCall, selectedVehicle]);

  const fetchVehicleData = useCallback(async (vehicleId: string) => {
    try {
      setError(null);
      // Use enhanced Tessie API endpoint for detailed vehicle state
      const data = await makeApiCall('/vehicles');
      
      // Find the specific vehicle by ID from the results
      const vehicle = data.results.find((v: any) => v.last_state?.id_s === vehicleId || v.vin === vehicleId);
      
      if (!vehicle || !vehicle.last_state) {
        throw new Error('Vehicle data not found');
      }

      // Return the full Tessie API structure for maximum compatibility
      const enhancedVehicleData = {
        // Flattened structure for backward compatibility
        battery_level: vehicle.last_state.charge_state?.battery_level || 0,
        battery_range: vehicle.last_state.charge_state?.battery_range || 0,
        charging_state: vehicle.last_state.charge_state?.charging_state || 'Unknown',
        inside_temp: vehicle.last_state.climate_state?.inside_temp || 0,
        outside_temp: vehicle.last_state.climate_state?.outside_temp || 0,
        odometer: vehicle.last_state.vehicle_state?.odometer || 0,
        speed: vehicle.last_state.drive_state?.speed || 0,
        latitude: vehicle.last_state.drive_state?.latitude || 0,
        longitude: vehicle.last_state.drive_state?.longitude || 0,
        heading: vehicle.last_state.drive_state?.heading || 0,
        timestamp: vehicle.last_state.drive_state?.timestamp || Date.now(),
        
        // Full Tessie API structure for advanced features
        last_state: vehicle.last_state,
        
        // Enhanced capabilities from Tessie API
        vehicle_config: vehicle.vehicle_config,
        gui_settings: vehicle.gui_settings,
        option_codes: vehicle.option_codes,
        
        // Real-time streaming data when available
        streaming_data: vehicle.streaming_data || null,
        
        // Vehicle command capabilities
        command_signing: vehicle.command_signing || false,
        firmware_version: vehicle.last_state.vehicle_state?.car_version || 'Unknown'
      };

      setVehicleData(enhancedVehicleData as any);
      return enhancedVehicleData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle data');
      return null;
    }
  }, [makeApiCall]);

  const fetchDriveHistory = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    try {
      setError(null);
      const data = await makeApiCall(`/vehicles/${vehicleId}/drives?start_date=${startDate}&end_date=${endDate}`);
      
      const drives: DriveSession[] = data.results?.map((drive: any) => ({
        id: drive.id,
        start_date: drive.start_date,
        end_date: drive.end_date,
        start_location_name: drive.start_location_name || 'Unknown',
        end_location_name: drive.end_location_name || 'Unknown',
        distance_miles: drive.distance_miles || 0,
        duration_minutes: drive.duration_minutes || 0,
        start_latitude: drive.start_latitude || 0,
        start_longitude: drive.start_longitude || 0,
        end_latitude: drive.end_latitude || 0,
        end_longitude: drive.end_longitude || 0,
      })) || [];

      setDriveHistory(drives);
      return drives;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drive history');
      return [];
    }
  }, [makeApiCall]);

  const fetchChargeHistory = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    try {
      setError(null);
      const data = await makeApiCall(`/vehicles/${vehicleId}/charges?start_date=${startDate}&end_date=${endDate}`);
      
      const charges: ChargeSession[] = data.results?.map((charge: any) => ({
        id: charge.id,
        start_date: charge.start_date,
        end_date: charge.end_date,
        location_name: charge.location_name || 'Unknown',
        energy_added: charge.energy_added || 0,
        cost: charge.cost || 0,
        latitude: charge.latitude || 0,
        longitude: charge.longitude || 0,
      })) || [];

      setChargeHistory(charges);
      return charges;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch charge history');
      return [];
    }
  }, [makeApiCall]);

  const fetchLocationHistory = useCallback(async (vehicleId: string, startDate: string, endDate: string) => {
    try {
      setError(null);
      // Note: This would use Tessie's location history endpoint when available
      // For now, we'll construct from drive history
      const drives = await fetchDriveHistory(vehicleId, startDate, endDate);
      
      const locations: LocationPoint[] = drives.flatMap(drive => [
        {
          lat: drive.start_latitude,
          lng: drive.start_longitude,
          timestamp: drive.start_date,
        },
        {
          lat: drive.end_latitude,
          lng: drive.end_longitude,
          timestamp: drive.end_date,
        }
      ]).filter(loc => loc.lat !== 0 && loc.lng !== 0);

      setLocationHistory(locations);
      return locations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch location history');
      return [];
    }
  }, [fetchDriveHistory]);

  const refetch = useCallback(() => {
    if (selectedVehicle) {
      fetchVehicleData(selectedVehicle.id);
    }
  }, [selectedVehicle, fetchVehicleData]);

  // Auto-fetch vehicle data every 30 seconds for selected vehicle
  useEffect(() => {
    if (!selectedVehicle || !apiKey) return;

    fetchVehicleData(selectedVehicle.id);
    const interval = setInterval(() => {
      fetchVehicleData(selectedVehicle.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedVehicle, apiKey, fetchVehicleData]);

  // Fetch vehicles when API key is provided
  useEffect(() => {
    if (apiKey) {
      fetchVehicles();
    }
  }, [apiKey, fetchVehicles]);

  return {
    // State
    vehicles,
    selectedVehicle,
    vehicleData,
    driveHistory,
    chargeHistory,
    locationHistory,
    isLoading,
    error,
    
    // Actions
    setSelectedVehicle,
    fetchVehicleData,
    fetchDriveHistory,
    fetchChargeHistory,
    fetchLocationHistory,
    refetch,
  };
};