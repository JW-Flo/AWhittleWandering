import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export function useTessieData(vinOverride?: string, autoRefresh = true, refreshInterval = 30000): TessieData {
  const { user } = useAuth();
  const [vehicleState, setVehicleState] = useState<VehicleState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [vin, setVin] = useState<string | null>(vinOverride || null);

  // Fetch VIN from database if not provided
  useEffect(() => {
    if (vinOverride) {
      setVin(vinOverride);
      return;
    }
    
    if (!user) return;

    const fetchVin = async () => {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('vin')
        .eq('user_id', user.id)
        .not('vin', 'is', null)
        .limit(1)
        .single();

      if (vehicle?.vin) {
        setVin(vehicle.vin);
      }
    };

    fetchVin();
  }, [user, vinOverride]);

  const fetchVehicleState = useCallback(async () => {
    if (!vin) {
      setError('No vehicle VIN configured. Create a journey with a vehicle first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching Tessie vehicle state for VIN:', vin);
      
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'state', vin }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch vehicle state');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse Tessie response into our VehicleState format
      const state: VehicleState = {
        vin,
        displayName: data.display_name || 'Tesla',
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
  }, [vin]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (vin) {
      fetchVehicleState();

      if (autoRefresh) {
        const interval = setInterval(fetchVehicleState, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [fetchVehicleState, autoRefresh, refreshInterval, vin]);

  return {
    vehicleState,
    isLoading,
    error,
    lastFetch,
    refresh: fetchVehicleState,
  };
}

// Hook for fetching recent drives
export function useTessieDrives(vinOverride?: string) {
  const { user } = useAuth();
  const [drives, setDrives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vin, setVin] = useState<string | null>(vinOverride || null);

  useEffect(() => {
    if (vinOverride) {
      setVin(vinOverride);
      return;
    }
    if (!user) return;

    const fetchVin = async () => {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('vin')
        .eq('user_id', user.id)
        .not('vin', 'is', null)
        .limit(1)
        .single();
      if (vehicle?.vin) setVin(vehicle.vin);
    };
    fetchVin();
  }, [user, vinOverride]);

  const fetchDrives = useCallback(async () => {
    if (!vin) return;
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'drives', vin }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setDrives(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drives');
    } finally {
      setIsLoading(false);
    }
  }, [vin]);

  useEffect(() => {
    if (vin) fetchDrives();
  }, [fetchDrives, vin]);

  return { drives, isLoading, error, refresh: fetchDrives };
}

// Hook for fetching recent charging sessions
export function useTessieCharges(vinOverride?: string) {
  const { user } = useAuth();
  const [charges, setCharges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vin, setVin] = useState<string | null>(vinOverride || null);

  useEffect(() => {
    if (vinOverride) {
      setVin(vinOverride);
      return;
    }
    if (!user) return;

    const fetchVin = async () => {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('vin')
        .eq('user_id', user.id)
        .not('vin', 'is', null)
        .limit(1)
        .single();
      if (vehicle?.vin) setVin(vehicle.vin);
    };
    fetchVin();
  }, [user, vinOverride]);

  const fetchCharges = useCallback(async () => {
    if (!vin) return;
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('tessie', {
        body: { action: 'charges', vin }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      setCharges(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch charges');
    } finally {
      setIsLoading(false);
    }
  }, [vin]);

  useEffect(() => {
    if (vin) fetchCharges();
  }, [fetchCharges, vin]);

  return { charges, isLoading, error, refresh: fetchCharges };
}
