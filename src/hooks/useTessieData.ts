import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleState {
  vin: string;
  displayName: string;
  state: string;
  batteryLevel: number;
  batteryRange: number;
  isCharging: boolean;
  chargeRate?: number;
  latitude: number;
  longitude: number;
  speed: number;
  odometer: number;
  insideTemp: number;
  outsideTemp: number;
  lastUpdated: Date;
}

export interface TessieData {
  vehicleState: VehicleState | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  refresh: () => Promise<void>;
}

const VIN = '5YJYGDEE5LF027324'; // Shadowfax

export function useTessieData(autoRefresh = true, refreshInterval = 30000): TessieData {
  const [vehicleState, setVehicleState] = useState<VehicleState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchVehicleState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching Tessie vehicle state...');
      
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'state', vin: VIN }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch vehicle state');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse Tessie response into our VehicleState format
      const state: VehicleState = {
        vin: VIN,
        displayName: data.display_name || 'Shadowfax',
        state: data.state || 'unknown',
        batteryLevel: data.charge_state?.battery_level ?? 0,
        batteryRange: data.charge_state?.battery_range ?? 0,
        isCharging: data.charge_state?.charging_state === 'Charging',
        chargeRate: data.charge_state?.charge_rate,
        latitude: data.drive_state?.latitude ?? 0,
        longitude: data.drive_state?.longitude ?? 0,
        speed: data.drive_state?.speed ?? 0,
        odometer: data.vehicle_state?.odometer ?? 0,
        insideTemp: data.climate_state?.inside_temp 
          ? (data.climate_state.inside_temp * 9/5) + 32 // Convert C to F
          : 0,
        outsideTemp: data.climate_state?.outside_temp
          ? (data.climate_state.outside_temp * 9/5) + 32
          : 0,
        lastUpdated: new Date(),
      };

      setVehicleState(state);
      setLastFetch(new Date());
      console.log('Vehicle state updated:', state);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching vehicle data';
      console.error('Tessie fetch error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchVehicleState();

    if (autoRefresh) {
      const interval = setInterval(fetchVehicleState, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchVehicleState, autoRefresh, refreshInterval]);

  return {
    vehicleState,
    isLoading,
    error,
    lastFetch,
    refresh: fetchVehicleState,
  };
}

// Hook for fetching recent drives
export function useTessieDrives() {
  const [drives, setDrives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'drives', vin: VIN }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setDrives(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drives');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  return { drives, isLoading, error, refresh: fetchDrives };
}

// Hook for fetching recent charging sessions
export function useTessieCharges() {
  const [charges, setCharges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharges = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'charges', vin: VIN }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setCharges(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch charges');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  return { charges, isLoading, error, refresh: fetchCharges };
}
