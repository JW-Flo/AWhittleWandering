import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Unified interfaces based on actual Tessie API structure
export interface Vehicle {
  id: string;
  display_name: string;
  state: string;
  vin: string;
}

export interface VehicleData {
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

export interface HistoricalDrive {
  id: string;
  start_time: string; // ISO string
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

export interface HistoricalCharge {
  id: string;
  start_time: string; // ISO string
  end_time: string;
  location: string;
  energy_added_kwh: number;
  cost: number;
  start_battery_level: number;
  end_battery_level: number;
  coordinates: { lat: number; lng: number };
}

export const useUnifiedTessieApi = (apiKey?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedVehicleVin, setSelectedVehicleVin] = useState<string | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [historicalDrives, setHistoricalDrives] = useState<HistoricalDrive[]>([]);
  const [historicalCharges, setHistoricalCharges] = useState<HistoricalCharge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // PRODUCTION MODE ONLY - NO DEMO DATA
  if (!apiKey) {
    console.error('🚨 API KEY REQUIRED - No demo mode available');
  }

  const makeApiCall = useCallback(async (endpoint: string) => {
    if (!apiKey) {
      throw new Error('API key not provided');
    }

    console.log('🔌 Tessie API Call:', { endpoint, hasApiKey: !!apiKey });

    const response = await fetch(`https://api.tessie.com/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Tessie API Response:', { 
      status: response.status, 
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tessie API Error:', { status: response.status, body: errorText });
      throw new Error(`API call failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Tessie API Data:', { endpoint, dataKeys: Object.keys(data) });
    return data;
  }, [apiKey]);

  const fetchVehicles = useCallback(async () => {
    if (!apiKey) {
      console.log('⚠️ No API key provided, skipping vehicle fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚗 Fetching vehicles from Tessie API...');
      const data = await makeApiCall('vehicles');
      console.log('📊 Raw vehicle data:', data);
      
      const transformedVehicles = data.results?.map((vehicle: any) => ({
        id: vehicle.last_state?.id_s || vehicle.vin,
        display_name: vehicle.last_state?.display_name || `Tesla ${vehicle.vin?.slice(-4) || 'Unknown'}`,
        state: vehicle.last_state?.state || 'unknown',
        vin: vehicle.vin
      })) || [];
      
      console.log('🔄 Transformed vehicles:', transformedVehicles);
      setVehicles(transformedVehicles);
      
      if (transformedVehicles.length > 0 && !selectedVehicle) {
        const firstVehicle = transformedVehicles[0];
        console.log('🎯 Auto-selecting first vehicle:', firstVehicle);
        setSelectedVehicle(firstVehicle.id);
        setSelectedVehicleVin(firstVehicle.vin);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles';
      console.error('❌ Error fetching vehicles:', err);
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

  const fetchVehicleData = useCallback(async (vehicleVin: string) => {
    if (!apiKey || !vehicleVin) {
      console.log('⚠️ Missing API key or vehicle VIN:', { hasApiKey: !!apiKey, vehicleVin });
      return;
    }

    try {
      console.log('📍 Fetching vehicle data for VIN:', vehicleVin);
      const state = await makeApiCall(`${vehicleVin}/state`);
      console.log('📊 Raw vehicle state:', state);
      
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

      console.log('✅ Processed vehicle data:', combinedData);
      setVehicleData(combinedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicle data';
      setError(errorMessage);
      console.error('❌ Error fetching vehicle data:', err);
    }
  }, [apiKey, makeApiCall]);

  const fetchHistoricalDrives = useCallback(async (vehicleVin: string, startDate: string, endDate: string) => {
    if (!apiKey || !vehicleVin) {
      console.log('⚠️ Missing API key or vehicle VIN for historical drives');
      return;
    }

    try {
      console.log('🛣️ Fetching historical drives...', { vehicleVin, startDate, endDate });
      
      // CRITICAL FIX: Use correct Tessie API endpoints with Unix timestamps
      const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      console.log('📅 Date conversion:', { startDate, endDate, fromTimestamp, toTimestamp });
      
      const data = await makeApiCall(`${vehicleVin}/drives?from=${fromTimestamp}&to=${toTimestamp}`);
      
      console.log('📊 Raw historical drives data:', data);
      
      const drives: HistoricalDrive[] = data.results?.map((drive: any, index: number) => {
        // CRITICAL FIX: Map correct Tessie API field names
        const driveData = {
          id: drive.id || `drive-${drive.started_at}`,
          start_time: new Date(drive.started_at * 1000).toISOString(),
          end_time: new Date(drive.ended_at * 1000).toISOString(),
          start_address: drive.starting_location || 'Unknown',
          end_address: drive.ending_location || 'Unknown',
          distance_miles: drive.odometer_distance || 0, // Correct field
          duration_hours: drive.ended_at && drive.started_at ? (drive.ended_at - drive.started_at) / 3600 : 0,
          start_battery_level: drive.starting_battery || 0, // Correct field
          end_battery_level: drive.ending_battery || 0, // Correct field
          start_coordinates: {
            lat: drive.starting_latitude || 0, // Correct field
            lng: drive.starting_longitude || 0 // Correct field
          },
          end_coordinates: {
            lat: drive.ending_latitude || 0, // Correct field
            lng: drive.ending_longitude || 0 // Correct field
          }
        };
        
        if (index < 3) {
          console.log(`🔍 Drive ${index} mapping:`, { raw: drive, mapped: driveData });
        }
        
        return driveData;
      }) || [];

      console.log('✅ Processed historical drives:', drives.length, 'drives');
      setHistoricalDrives(drives);
    } catch (err) {
      console.error('❌ Error fetching historical drives:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical drives');
    }
  }, [apiKey, makeApiCall]);

  const fetchHistoricalCharges = useCallback(async (vehicleVin: string, startDate: string, endDate: string) => {
    if (!apiKey || !vehicleVin) {
      console.log('⚠️ Missing API key or vehicle VIN for historical charges');
      return;
    }

    try {
      console.log('⚡ Fetching historical charges...', { vehicleVin, startDate, endDate });
      
      const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      const data = await makeApiCall(`${vehicleVin}/charges?from=${fromTimestamp}&to=${toTimestamp}`);
      
      console.log('📊 Raw historical charges data:', data);
      
      const charges: HistoricalCharge[] = data.results?.map((charge: any, index: number) => {
        const chargeData = {
          id: charge.id || `charge-${charge.started_at}`,
          start_time: new Date(charge.started_at * 1000).toISOString(),
          end_time: new Date(charge.ended_at * 1000).toISOString(),
          location: charge.location || 'Unknown',
          energy_added_kwh: charge.energy_added || 0, // Correct field
          cost: charge.cost || 0,
          start_battery_level: charge.starting_battery || 0, // Correct field
          end_battery_level: charge.ending_battery || 0, // Correct field
          coordinates: {
            lat: charge.latitude || 0,
            lng: charge.longitude || 0
          }
        };
        
        if (index < 3) {
          console.log(`🔍 Charge ${index} mapping:`, { raw: charge, mapped: chargeData });
        }
        
        return chargeData;
      }) || [];

      console.log('✅ Processed historical charges:', charges.length, 'charges');
      setHistoricalCharges(charges);
    } catch (err) {
      console.error('❌ Error fetching historical charges:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical charges');
    }
  }, [apiKey, makeApiCall]);

  // Auto-refresh vehicle data every 30 seconds (PRODUCTION ONLY)
  useEffect(() => {
    if (!selectedVehicleVin || !apiKey) return;

    fetchVehicleData(selectedVehicleVin);
    const interval = setInterval(() => {
      fetchVehicleData(selectedVehicleVin);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedVehicleVin, apiKey, fetchVehicleData]);

  // Fetch vehicles when API key changes (PRODUCTION ONLY)
  useEffect(() => {
    if (apiKey) {
      fetchVehicles();
    }
  }, [apiKey, fetchVehicles]);

  // Fetch historical data when vehicle is selected (PRODUCTION ONLY)
  useEffect(() => {
    if (!selectedVehicleVin || !apiKey) return;

    // Use correct 2025 timestamps: June 1, 2025 to July 30, 2025
    const journeyStartDate = '2025-06-01';
    const currentDate = '2025-07-30'; // Fixed to actual journey end date
    
    console.log('📊 Fetching ALL REAL historical data from', journeyStartDate, 'to', currentDate);
    fetchHistoricalDrives(selectedVehicleVin, journeyStartDate, currentDate);
    fetchHistoricalCharges(selectedVehicleVin, journeyStartDate, currentDate);
  }, [selectedVehicleVin, apiKey, fetchHistoricalDrives, fetchHistoricalCharges]);

  return {
    vehicles,
    selectedVehicle,
    selectedVehicleVin,
    setSelectedVehicle: (vehicleId: string) => {
      setSelectedVehicle(vehicleId);
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicleVin(vehicle.vin);
      }
    },
    vehicleData,
    historicalDrives,
    historicalCharges,
    isLoading,
    error,
    refetch: () => {
      if (!selectedVehicleVin || !apiKey) {
        console.error('🚨 Cannot refresh - missing API key or vehicle VIN');
        return;
      }
      
      fetchVehicleData(selectedVehicleVin);
    },
    refreshHistoricalData: () => {
      if (!selectedVehicleVin || !apiKey) {
        console.error('🚨 Cannot refresh historical data - missing API key or vehicle VIN');
        return;
      }
      
      // Use correct 2025 timestamps for the full journey
      const journeyStartDate = '2025-06-01';
      const currentDate = '2025-07-30'; // Fixed journey end date
      
      console.log('🔄 Refreshing ALL REAL historical data:', journeyStartDate, 'to', currentDate);
      fetchHistoricalDrives(selectedVehicleVin, journeyStartDate, currentDate);
      fetchHistoricalCharges(selectedVehicleVin, journeyStartDate, currentDate);
    }
  };
};
