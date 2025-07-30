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

  const demoHistoricalDrives: HistoricalDrive[] = [
    {
      id: 'demo-drive-1',
      start_time: '2025-06-01T10:00:00Z',
      end_time: '2025-06-01T15:30:00Z',
      start_address: 'Corpus Christi, TX',
      end_address: 'Carlsbad, NM',
      distance_miles: 287,
      duration_hours: 5.5,
      start_battery_level: 95,
      end_battery_level: 45,
      start_coordinates: { lat: 27.8006, lng: -97.3964 },
      end_coordinates: { lat: 32.4207, lng: -104.2288 }
    },
    {
      id: 'demo-drive-2',
      start_time: '2025-06-03T09:00:00Z',
      end_time: '2025-06-03T14:00:00Z',
      start_address: 'Carlsbad, NM',
      end_address: 'Amarillo, TX',
      distance_miles: 234,
      duration_hours: 5.0,
      start_battery_level: 88,
      end_battery_level: 42,
      start_coordinates: { lat: 32.4207, lng: -104.2288 },
      end_coordinates: { lat: 35.2220, lng: -101.8313 }
    },
    {
      id: 'demo-drive-3',
      start_time: '2025-06-05T08:00:00Z',
      end_time: '2025-06-05T13:30:00Z',
      start_address: 'Amarillo, TX',
      end_address: 'Oklahoma City, OK',
      distance_miles: 259,
      duration_hours: 5.5,
      start_battery_level: 90,
      end_battery_level: 38,
      start_coordinates: { lat: 35.2220, lng: -101.8313 },
      end_coordinates: { lat: 35.4676, lng: -97.5164 }
    },
    {
      id: 'demo-drive-4',
      start_time: '2025-06-07T07:30:00Z',
      end_time: '2025-06-07T14:00:00Z',
      start_address: 'Oklahoma City, OK',
      end_address: 'Little Rock, AR',
      distance_miles: 342,
      duration_hours: 6.5,
      start_battery_level: 88,
      end_battery_level: 22,
      start_coordinates: { lat: 35.4676, lng: -97.5164 },
      end_coordinates: { lat: 34.7465, lng: -92.2896 }
    },
    {
      id: 'demo-drive-5',
      start_time: '2025-06-09T09:00:00Z',
      end_time: '2025-06-09T15:30:00Z',
      start_address: 'Little Rock, AR',
      end_address: 'Nashville, TN',
      distance_miles: 339,
      duration_hours: 6.5,
      start_battery_level: 92,
      end_battery_level: 28,
      start_coordinates: { lat: 34.7465, lng: -92.2896 },
      end_coordinates: { lat: 36.1627, lng: -86.7816 }
    }
  ];

  const demoHistoricalCharges: HistoricalCharge[] = [
    {
      id: 'demo-charge-1',
      start_time: '2025-06-01T16:00:00Z',
      end_time: '2025-06-01T17:30:00Z',
      location: 'Tesla Supercharger - Carlsbad, NM',
      energy_added_kwh: 45.2,
      cost: 18.50,
      start_battery_level: 45,
      end_battery_level: 88,
      coordinates: { lat: 32.4207, lng: -104.2288 }
    },
    {
      id: 'demo-charge-2',
      start_time: '2025-06-03T14:30:00Z',
      end_time: '2025-06-03T16:00:00Z',
      location: 'Tesla Supercharger - Amarillo, TX',
      energy_added_kwh: 52.1,
      cost: 21.75,
      start_battery_level: 42,
      end_battery_level: 90,
      coordinates: { lat: 35.2220, lng: -101.8313 }
    },
    {
      id: 'demo-charge-3',
      start_time: '2025-06-05T14:00:00Z',
      end_time: '2025-06-05T15:45:00Z',
      location: 'Tesla Supercharger - Oklahoma City, OK',
      energy_added_kwh: 48.7,
      cost: 19.80,
      start_battery_level: 38,
      end_battery_level: 88,
      coordinates: { lat: 35.4676, lng: -97.5164 }
    }
  ];

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

  // Demo mode logic
  useEffect(() => {
    if (isDemoMode) {
      console.log('🎭 Running in demo mode');
      setVehicles([demoVehicle]);
      setSelectedVehicle(demoVehicle.id);
      setSelectedVehicleVin(demoVehicle.vin);
      setVehicleData(demoVehicleData);
      setHistoricalDrives(demoHistoricalDrives);
      setHistoricalCharges(demoHistoricalCharges);
      setError(null);
      setIsLoading(false);
      return;
    }
  }, [isDemoMode]);

  // Auto-refresh vehicle data every 30 seconds
  useEffect(() => {
    if (isDemoMode || !selectedVehicleVin || !apiKey) return;

    fetchVehicleData(selectedVehicleVin);
    const interval = setInterval(() => {
      fetchVehicleData(selectedVehicleVin);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedVehicleVin, apiKey, fetchVehicleData, isDemoMode]);

  // Fetch vehicles when API key changes
  useEffect(() => {
    if (isDemoMode) return;
    
    if (apiKey) {
      fetchVehicles();
    }
  }, [apiKey, fetchVehicles, isDemoMode]);

  // Fetch historical data when vehicle is selected
  useEffect(() => {
    if (isDemoMode || !selectedVehicleVin || !apiKey) return;

    const journeyStartDate = '2025-06-01';
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('📊 Fetching historical data from', journeyStartDate, 'to', currentDate);
    fetchHistoricalDrives(selectedVehicleVin, journeyStartDate, currentDate);
    fetchHistoricalCharges(selectedVehicleVin, journeyStartDate, currentDate);
  }, [selectedVehicleVin, apiKey, fetchHistoricalDrives, fetchHistoricalCharges, isDemoMode]);

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
      if (isDemoMode) {
        console.log('🎭 Demo mode - simulating refresh');
        setVehicleData(prev => prev ? { ...prev, timestamp: Date.now() } : null);
        return;
      }
      
      if (selectedVehicleVin) {
        fetchVehicleData(selectedVehicleVin);
      }
    },
    refreshHistoricalData: () => {
      if (isDemoMode || !selectedVehicleVin || !apiKey) return;
      
      const journeyStartDate = '2025-06-01';
      const currentDate = new Date().toISOString().split('T')[0];
      
      fetchHistoricalDrives(selectedVehicleVin, journeyStartDate, currentDate);
      fetchHistoricalCharges(selectedVehicleVin, journeyStartDate, currentDate);
    }
  };
};
