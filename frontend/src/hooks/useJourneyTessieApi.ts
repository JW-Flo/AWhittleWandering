// COMPATIBILITY WRAPPER: Enhanced Tessie API integration for A Whittle Wandering journey tracking
// This is now a wrapper around useUnifiedTessieApi for backward compatibility

import { useUnifiedTessieApi } from './useUnifiedTessieApi';
import { useMemo, useState, useCallback } from 'react';

interface ChargeSessionData {
  id: string;
  start_date: string;
  end_date: string;
  energy_added: number;
  cost: number;
}

interface ExtendedStay {
  id: string;
  location: string;
  city: string;
  state: string;
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  durationHours: number;
  durationDays: number;
  reason: 'charging' | 'overnight' | 'extended_visit' | 'multi_day_stay';
  chargingSessions?: ChargeSessionData[];
}

interface DriveSession {
  id: string;
  start_date: string;
  end_date: string;
  start_location_name: string;
  end_location_name: string;
  start_city?: string;
  start_state?: string;
  end_city?: string;
  end_state?: string;
  distance_miles: number;
  duration_minutes: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  average_speed: number;
  energy_used: number;
}

interface ChargeSession {
  id: string;
  start_date: string;
  end_date: string;
  location_name: string;
  city?: string;
  state?: string;
  energy_added: number;
  cost: number;
  latitude: number;
  longitude: number;
  duration_minutes: number;
  charge_rate_max: number;
  start_battery_level: number;
  end_battery_level: number;
}

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  city?: string;
  state?: string;
  address?: string;
}

interface JourneyAnalytics {
  totalDrives: number;
  totalCharges: number;
  totalExtendedStays: number;
  statesCrossed: string[];
  citiesVisited: string[];
  longestDrive: DriveSession | null;
  longestStay: ExtendedStay | null;
  averageDriveDistance: number;
  totalChargingCost: number;
  totalEnergyAdded: number;
}

export const useJourneyTessieApi = (apiKey?: string, vehicleId?: string) => {
  const [driveHistory, setDriveHistory] = useState<DriveSession[]>([]);
  const [chargeHistory, setChargeHistory] = useState<ChargeSession[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [extendedStays, setExtendedStays] = useState<ExtendedStay[]>([]);
  const [journeyAnalytics, setJourneyAnalytics] = useState<JourneyAnalytics | null>(null);
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

  // Reverse geocoding to get city/state from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ city?: string; state?: string; address?: string }> => {
    try {
      // Use Mapbox reverse geocoding (could also use Google Maps or other service)
      const mapboxToken = 'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteHA0cjYwYXRjMm1weGgwdnk5YWw2In0.0Bj4LWRpeefn0qPj_2VHcA';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,region`
      );
      
      if (!response.ok) return {};
      
      const data = await response.json();
      const features = data.features || [];
      
      let city, state, address;
      
      for (const feature of features) {
        if (feature.place_type?.includes('place')) {
          city = feature.text;
        }
        if (feature.place_type?.includes('region') && feature.properties?.short_code) {
          state = feature.properties.short_code.replace('us-', '').toUpperCase();
        }
        if (feature.place_name) {
          address = feature.place_name;
        }
      }
      
      return { city, state, address };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {};
    }
  }, []);

  // Fetch drive history with enhanced data
  const fetchDriveHistory = useCallback(async (startDate: string, endDate: string) => {
    if (!vehicleId) return;
    
    try {
      setError(null);
      const data = await makeApiCall(`/vehicles/${vehicleId}/drives?start_date=${startDate}&end_date=${endDate}`);
      
      const enhancedDrives: DriveSession[] = [];
      
      for (const drive of data.results || []) {
        // Add reverse geocoding for start and end locations
        const startGeo = await reverseGeocode(drive.start_latitude, drive.start_longitude);
        const endGeo = await reverseGeocode(drive.end_latitude, drive.end_longitude);
        
        enhancedDrives.push({
          id: drive.id,
          start_date: drive.start_date,
          end_date: drive.end_date,
          start_location_name: drive.start_location_name || 'Unknown',
          end_location_name: drive.end_location_name || 'Unknown',
          start_city: startGeo.city,
          start_state: startGeo.state,
          end_city: endGeo.city,
          end_state: endGeo.state,
          distance_miles: drive.distance_miles || 0,
          duration_minutes: drive.duration_minutes || 0,
          start_latitude: drive.start_latitude || 0,
          start_longitude: drive.start_longitude || 0,
          end_latitude: drive.end_latitude || 0,
          end_longitude: drive.end_longitude || 0,
          average_speed: drive.distance_miles && drive.duration_minutes ? 
            (drive.distance_miles / (drive.duration_minutes / 60)) : 0,
          energy_used: drive.energy_used || 0,
        });
      }
      
      setDriveHistory(enhancedDrives);
      return enhancedDrives;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drive history');
      return [];
    }
  }, [makeApiCall, vehicleId, reverseGeocode]);

  // Fetch charge history with enhanced data
  const fetchChargeHistory = useCallback(async (startDate: string, endDate: string) => {
    if (!vehicleId) return;
    
    try {
      setError(null);
      const data = await makeApiCall(`/vehicles/${vehicleId}/charges?start_date=${startDate}&end_date=${endDate}`);
      
      const enhancedCharges: ChargeSession[] = [];
      
      for (const charge of data.results || []) {
        // Add reverse geocoding for charge location
        const geoData = await reverseGeocode(charge.latitude, charge.longitude);
        
        enhancedCharges.push({
          id: charge.id,
          start_date: charge.start_date,
          end_date: charge.end_date,
          location_name: charge.location_name || 'Unknown Location',
          city: geoData.city,
          state: geoData.state,
          energy_added: charge.energy_added || 0,
          cost: charge.cost || 0,
          latitude: charge.latitude || 0,
          longitude: charge.longitude || 0,
          duration_minutes: charge.duration_minutes || 0,
          charge_rate_max: charge.charge_rate_max || 0,
          start_battery_level: charge.start_battery_level || 0,
          end_battery_level: charge.end_battery_level || 0,
        });
      }
      
      setChargeHistory(enhancedCharges);
      return enhancedCharges;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch charge history');
      return [];
    }
  }, [makeApiCall, vehicleId, reverseGeocode]);

  // Detect extended stays (multi-day stops)
  const detectExtendedStays = useCallback((drives: DriveSession[], charges: ChargeSession[]): ExtendedStay[] => {
    const stays: ExtendedStay[] = [];
    
    for (let i = 0; i < drives.length - 1; i++) {
      const currentDrive = drives[i];
      const nextDrive = drives[i + 1];
      
      const endTime = new Date(currentDrive.end_date);
      const nextStartTime = new Date(nextDrive.start_date);
      const timeDifference = nextStartTime.getTime() - endTime.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      // Detect stays longer than 6 hours
      if (hoursDifference >= 6) {
        // Find charging sessions during this stay
        const stayCharges = charges.filter(charge => {
          const chargeTime = new Date(charge.start_date);
          return chargeTime >= endTime && chargeTime <= nextStartTime;
        });
        
        let reason: ExtendedStay['reason'] = 'overnight';
        if (hoursDifference >= 48) reason = 'multi_day_stay';
        else if (hoursDifference >= 24) reason = 'extended_visit';
        else if (stayCharges.length > 0) reason = 'charging';
        
        stays.push({
          id: `stay-${currentDrive.id}-${nextDrive.id}`,
          location: currentDrive.end_location_name,
          city: currentDrive.end_city || 'Unknown',
          state: currentDrive.end_state || 'Unknown',
          coordinates: {
            lat: currentDrive.end_latitude,
            lng: currentDrive.end_longitude
          },
          startDate: currentDrive.end_date,
          endDate: nextDrive.start_date,
          durationHours: Math.round(hoursDifference * 10) / 10,
          durationDays: Math.round((hoursDifference / 24) * 10) / 10,
          reason,
          chargingSessions: stayCharges
        });
      }
    }
    
    return stays;
  }, []);

  // Calculate journey analytics
  const calculateJourneyAnalytics = useCallback((drives: DriveSession[], charges: ChargeSession[], stays: ExtendedStay[]): JourneyAnalytics => {
    const statesCrossed = Array.from(new Set([
      ...drives.map(d => d.start_state).filter(Boolean),
      ...drives.map(d => d.end_state).filter(Boolean)
    ])) as string[];
    
    const citiesVisited = Array.from(new Set([
      ...drives.map(d => d.start_city).filter(Boolean),
      ...drives.map(d => d.end_city).filter(Boolean)
    ])) as string[];
    
    const longestDrive = drives.reduce((longest, current) => 
      current.distance_miles > (longest?.distance_miles || 0) ? current : longest, null as DriveSession | null);
    
    const longestStay = stays.reduce((longest, current) => 
      current.durationHours > (longest?.durationHours || 0) ? current : longest, null as ExtendedStay | null);
    
    const averageDriveDistance = drives.length > 0 ? 
      drives.reduce((sum, drive) => sum + drive.distance_miles, 0) / drives.length : 0;
    
    const totalChargingCost = charges.reduce((sum, charge) => sum + charge.cost, 0);
    const totalEnergyAdded = charges.reduce((sum, charge) => sum + charge.energy_added, 0);
    
    return {
      totalDrives: drives.length,
      totalCharges: charges.length,
      totalExtendedStays: stays.length,
      statesCrossed,
      citiesVisited,
      longestDrive,
      longestStay,
      averageDriveDistance: Math.round(averageDriveDistance * 10) / 10,
      totalChargingCost: Math.round(totalChargingCost * 100) / 100,
      totalEnergyAdded: Math.round(totalEnergyAdded * 10) / 10,
    };
  }, []);

  // Load complete journey data
  const loadJourneyData = useCallback(async (startDate: string = '2025-06-01', endDate: string = '2025-07-26') => {
    if (!vehicleId || !apiKey) return;
    
    setIsLoading(true);
    try {
      // Fetch drives and charges in parallel
      const [drives, charges] = await Promise.all([
        fetchDriveHistory(startDate, endDate),
        fetchChargeHistory(startDate, endDate)
      ]);
      
      if (drives && charges) {
        // Detect extended stays
        const stays = detectExtendedStays(drives, charges);
        setExtendedStays(stays);
        
        // Calculate analytics
        const analytics = calculateJourneyAnalytics(drives, charges, stays);
        setJourneyAnalytics(analytics);
        
        // Build location history from drives
        const locations: LocationPoint[] = [];
        for (const drive of drives) {
          const startGeo = await reverseGeocode(drive.start_latitude, drive.start_longitude);
          const endGeo = await reverseGeocode(drive.end_latitude, drive.end_longitude);
          
          locations.push({
            lat: drive.start_latitude,
            lng: drive.start_longitude,
            timestamp: drive.start_date,
            city: startGeo.city,
            state: startGeo.state,
            address: startGeo.address
          });
          
          locations.push({
            lat: drive.end_latitude,
            lng: drive.end_longitude,
            timestamp: drive.end_date,
            city: endGeo.city,
            state: endGeo.state,
            address: endGeo.address
          });
        }
        
        setLocationHistory(locations);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load journey data');
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, apiKey, fetchDriveHistory, fetchChargeHistory, detectExtendedStays, calculateJourneyAnalytics, reverseGeocode]);

  return {
    // Data
    driveHistory,
    chargeHistory,
    locationHistory,
    extendedStays,
    journeyAnalytics,
    
    // Loading state
    isLoading,
    error,
    
    // Actions
    loadJourneyData,
    fetchDriveHistory,
    fetchChargeHistory,
    
    // State setters for mock data
    setJourneyAnalytics,
    setDriveHistory,
    setChargeHistory,
    setExtendedStays,
  };
};
