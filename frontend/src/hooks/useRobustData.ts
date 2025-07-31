import { useState, useEffect, useCallback } from 'react';
import { useUnifiedTessieApi } from './useUnifiedTessieApi';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  battery_level: number;
  battery_range: number;
  charging_state: string;
  speed?: number;
  timestamp: string;
}

export interface Drive {
  id: string;
  start_date: string;
  end_date: string;
  start_location?: {
    address: string;
  };
  end_location?: {
    address: string;
  };
  distance_miles: number;
  duration_minutes: number;
}

export interface Charge {
  id: string;
  start_date: string;
  end_date: string;
  location?: {
    address: string;
  };
  energy_added: number;
  start_battery_level: number;
  end_battery_level: number;
}

export interface JourneyInsights {
  totalMiles: number;
  statesVisited: string[];
  daysElapsed: number;
  currentState?: string;
  currentProgress?: number;
}

/**
 * useRobustData - A simplified hook that provides consistent data interface
 * Falls back to static data when API is not available
 */
export function useRobustData() {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to use real API data
  const tessieApiKey = import.meta.env.VITE_TESSIE_API_KEY;
  const {
    vehicles,
    vehicleData,
    historicalDrives,
    historicalCharges,
    isLoading: apiLoading,
    error: apiError
  } = useUnifiedTessieApi(tessieApiKey);

  // Transform data to match expected interface
  const currentLocation: CurrentLocation | null = vehicleData ? {
    latitude: vehicleData.latitude,
    longitude: vehicleData.longitude,
    battery_level: vehicleData.battery_level,
    battery_range: vehicleData.battery_range,
    charging_state: vehicleData.charging_state,
    speed: vehicleData.speed,
    timestamp: new Date(vehicleData.timestamp).toISOString()
  } : null;

  const drives: Drive[] = historicalDrives.map(drive => ({
    id: drive.id,
    start_date: drive.start_time,
    end_date: drive.end_time,
    start_location: { address: drive.start_address },
    end_location: { address: drive.end_address },
    distance_miles: drive.distance_miles,
    duration_minutes: drive.duration_hours * 60
  }));

  const charges: Charge[] = historicalCharges.map(charge => ({
    id: charge.id,
    start_date: charge.start_time,
    end_date: charge.end_time,
    location: { address: charge.location },
    energy_added: charge.energy_added_kwh,
    start_battery_level: charge.start_battery_level,
    end_battery_level: charge.end_battery_level
  }));

  // Calculate journey insights
  const extractStateFromAddress = (address: string): string => {
    const stateAbbr = address.match(/, ([A-Z]{2})/)?.[1];
    if (!stateAbbr) return 'Unknown';
    
    // Map abbreviations to full state names
    const stateMap: { [key: string]: string } = {
      'TX': 'Texas', 'NM': 'New Mexico', 'AZ': 'Arizona', 'UT': 'Utah', 'NV': 'Nevada',
      'CA': 'California', 'OR': 'Oregon', 'WA': 'Washington', 'ID': 'Idaho', 'MT': 'Montana',
      'WY': 'Wyoming', 'CO': 'Colorado', 'NE': 'Nebraska', 'IA': 'Iowa', 'SD': 'South Dakota',
      'ND': 'North Dakota', 'MN': 'Minnesota', 'WI': 'Wisconsin', 'IL': 'Illinois', 'IN': 'Indiana',
      'OH': 'Ohio', 'PA': 'Pennsylvania', 'NY': 'New York', 'VT': 'Vermont', 'NH': 'New Hampshire',
      'ME': 'Maine', 'MA': 'Massachusetts', 'CT': 'Connecticut', 'RI': 'Rhode Island'
    };
    
    return stateMap[stateAbbr] || stateAbbr;
  };

  // Calculate journey insights from REAL drive data
  const totalMilesFromDrives = drives.reduce((sum, drive) => sum + drive.distance_miles, 0);
  const statesFromDrives = Array.from(new Set([
    ...drives.map(drive => extractStateFromAddress(drive.start_location?.address || '')),
    ...drives.map(drive => extractStateFromAddress(drive.end_location?.address || ''))
  ])).filter(state => state !== 'Unknown');

  // Use known journey data ONLY as fallback when NO drives available
  const knownStates = [
    'Texas', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'California', 'Oregon', 
    'Washington', 'Idaho', 'Montana', 'Wyoming', 'Colorado', 'Nebraska', 'Iowa',
    'South Dakota', 'North Dakota', 'Minnesota', 'Wisconsin', 'Illinois', 'Indiana',
    'Ohio', 'Pennsylvania', 'New York', 'Vermont', 'New Hampshire', 'Maine',
    'Massachusetts', 'Connecticut', 'Rhode Island'
  ];

  const journeyStartDate = new Date('2025-06-01');
  const currentDate = new Date();
  const daysElapsed = Math.floor((currentDate.getTime() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // ALWAYS prefer real drive data when available
  const journeyInsights: JourneyInsights = {
    totalMiles: totalMilesFromDrives > 0 ? totalMilesFromDrives : 12411, // Use real miles when available
    statesVisited: statesFromDrives.length > 0 ? statesFromDrives : knownStates, // Use real states when available
    daysElapsed,
    currentState: currentLocation ? 'Live' : 'Connecticut',
    currentProgress: ((statesFromDrives.length > 0 ? statesFromDrives.length : knownStates.length) / 48) * 100
  };

  console.log('🔍 Journey Insights Calculation:', {
    totalMilesFromDrives,
    statesFromDrives: statesFromDrives.length,
    drivesCount: drives.length,
    usingRealData: statesFromDrives.length > 0,
    finalInsights: journeyInsights
  });

  // Fallback to static data ONLY if API completely fails
  useEffect(() => {
    setLoading(apiLoading);
    
    if (apiError) {
      console.warn('⚠️ API Error, using fallback data:', apiError);
      setError(apiError);
      setIsLive(false);
      loadStaticData();
    } else if (vehicles.length > 0 || historicalDrives.length > 0) {
      console.log('✅ Using live API data:', { 
        vehicles: vehicles.length, 
        drives: historicalDrives.length,
        charges: historicalCharges.length 
      });
      setError(null);
      setIsLive(true);
    } else if (!apiLoading) {
      console.log('📊 No live data available, using fallback');
      setIsLive(false);
      loadStaticData();
    }
  }, [apiLoading, apiError, vehicles, historicalDrives, historicalCharges]);

  const [staticData, setStaticData] = useState<{
    drives: Drive[];
    charges: Charge[];
    currentLocation: CurrentLocation | null;
    journeyInsights: JourneyInsights;
  } | null>(null);

  const loadStaticData = useCallback(async () => {
    try {
      // Try to load from static files
      const response = await fetch('/data/processed_telemetry.json');
      if (response.ok) {
        const data = await response.json();
        setStaticData({
          drives: data.drives || [],
          charges: data.charges || [],
          currentLocation: data.currentLocation || null,
          journeyInsights: data.journeyInsights || {
            totalMiles: 0,
            statesVisited: [],
            daysElapsed: 0
          }
        });
        setError(null);
      } else {
        throw new Error('Static data not available');
      }
    } catch (err) {
      console.warn('Could not load static data, using known fallback');
      // Use known data from the actual journey
      const knownStates = [
        'Texas', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'California', 'Oregon', 
        'Washington', 'Idaho', 'Montana', 'Wyoming', 'Colorado', 'Nebraska', 'Iowa',
        'South Dakota', 'North Dakota', 'Minnesota', 'Wisconsin', 'Illinois', 'Indiana',
        'Ohio', 'Pennsylvania', 'New York', 'Vermont', 'New Hampshire', 'Maine',
        'Massachusetts', 'Connecticut', 'Rhode Island'
      ];
      
      setStaticData({
        drives: [],
        charges: [],
        currentLocation: {
          latitude: 41.1865,
          longitude: -73.1532,
          battery_level: 22,
          battery_range: 267,
          charging_state: 'Charging',
          timestamp: new Date().toISOString()
        },
        journeyInsights: {
          totalMiles: 12411,
          statesVisited: knownStates,
          daysElapsed: 56,
          currentState: 'Connecticut',
          currentProgress: (29 / 48) * 100
        }
      });
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    if (isLive) {
      // Refresh API data
      window.location.reload();
    } else {
      // Reload static data
      loadStaticData();
    }
  }, [isLive, loadStaticData]);

  // Generate route points from real drive data
  const generateRoutePoints = useCallback(() => {
    if (historicalDrives.length > 0) {
      // Sort drives chronologically from June 1st
      const sortedDrives = [...historicalDrives].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

      console.log('🗺️ Generating route from real drives:', {
        totalDrives: sortedDrives.length,
        firstDrive: sortedDrives[0]?.start_time,
        lastDrive: sortedDrives[sortedDrives.length - 1]?.start_time
      });

      // Create route points from actual drive coordinates
      const routePoints = sortedDrives.map((drive, index) => ({
        latitude: drive.end_coordinates.lat,
        longitude: drive.end_coordinates.lng,
        state: extractStateFromAddress(drive.end_address),
        date: new Date(drive.start_time).toLocaleDateString(),
        address: drive.end_address,
        driveIndex: index
      })).filter(point => point.latitude !== 0 && point.longitude !== 0);

      console.log('✅ Generated route points:', { 
        points: routePoints.length,
        sample: routePoints.slice(0, 3)
      });

      return routePoints;
    }

    // Fallback to known waypoints only if no real drive data
    return [
      { latitude: 27.8006, longitude: -97.3964, state: 'Texas', date: 'June 1', address: 'Corpus Christi, TX', driveIndex: 0 },
      { latitude: 32.2548, longitude: -104.3681, state: 'New Mexico', date: 'June 2', address: 'Carlsbad, NM', driveIndex: 1 },
      { latitude: 34.0489, longitude: -111.0937, state: 'Arizona', date: 'June 6', address: 'Sedona, AZ', driveIndex: 2 },
      { latitude: 39.3210, longitude: -111.0937, state: 'Utah', date: 'June 8', address: 'Zion, UT', driveIndex: 3 },
      { latitude: 34.0522, longitude: -118.2437, state: 'California', date: 'June 9', address: 'Los Angeles, CA', driveIndex: 4 },
      { latitude: 45.5152, longitude: -122.6784, state: 'Oregon', date: 'June 15', address: 'Portland, OR', driveIndex: 5 },
      { latitude: 47.6062, longitude: -122.3321, state: 'Washington', date: 'June 16', address: 'Seattle, WA', driveIndex: 6 },
      { latitude: 47.6587, longitude: -116.7804, state: 'Idaho', date: 'June 20', address: 'Coeur d\'Alene, ID', driveIndex: 7 },
      { latitude: 45.6770, longitude: -111.0429, state: 'Montana', date: 'June 21', address: 'Bozeman, MT', driveIndex: 8 },
      { latitude: 44.2619, longitude: -110.8384, state: 'Wyoming', date: 'June 23', address: 'Yellowstone, WY', driveIndex: 9 },
      { latitude: 39.7392, longitude: -104.9903, state: 'Colorado', date: 'June 27', address: 'Denver, CO', driveIndex: 10 },
      { latitude: 40.8136, longitude: -96.7026, state: 'Nebraska', date: 'July 3', address: 'Lincoln, NE', driveIndex: 11 },
      { latitude: 41.5868, longitude: -93.6250, state: 'Iowa', date: 'July 4', address: 'Des Moines, IA', driveIndex: 12 },
      { latitude: 44.5000, longitude: -100.0000, state: 'South Dakota', date: 'July 4', address: 'Badlands, SD', driveIndex: 13 },
      { latitude: 46.8083, longitude: -96.7898, state: 'North Dakota', date: 'July 5', address: 'Fargo, ND', driveIndex: 14 },
      { latitude: 44.9537, longitude: -93.0900, state: 'Minnesota', date: 'July 6', address: 'Minneapolis, MN', driveIndex: 15 },
      { latitude: 44.2619, longitude: -89.6165, state: 'Wisconsin', date: 'July 7', address: 'Wisconsin Dells, WI', driveIndex: 16 },
      { latitude: 41.8781, longitude: -87.6298, state: 'Illinois', date: 'July 8', address: 'Chicago, IL', driveIndex: 17 },
      { latitude: 39.7910, longitude: -86.1480, state: 'Indiana', date: 'July 9', address: 'Indianapolis, IN', driveIndex: 18 },
      { latitude: 40.3888, longitude: -82.7649, state: 'Ohio', date: 'July 10', address: 'Columbus, OH', driveIndex: 19 },
      { latitude: 42.1540, longitude: -80.0348, state: 'Pennsylvania', date: 'July 13', address: 'Erie, PA', driveIndex: 20 },
      { latitude: 42.6526, longitude: -73.7562, state: 'New York', date: 'July 14', address: 'Albany, NY', driveIndex: 21 },
      { latitude: 44.0459, longitude: -72.7107, state: 'Vermont', date: 'July 15', address: 'Montpelier, VT', driveIndex: 22 },
      { latitude: 43.4525, longitude: -71.5639, state: 'New Hampshire', date: 'July 16', address: 'Concord, NH', driveIndex: 23 },
      { latitude: 44.3106, longitude: -68.2073, state: 'Maine', date: 'July 17', address: 'Bar Harbor, ME', driveIndex: 24 },
      { latitude: 42.2352, longitude: -71.0275, state: 'Massachusetts', date: 'July 19', address: 'Boston, MA', driveIndex: 25 },
      { latitude: 41.1865, longitude: -73.1532, state: 'Connecticut', date: 'July 20', address: 'Stratford, CT', driveIndex: 26 },
      { latitude: 41.4901, longitude: -71.3128, state: 'Rhode Island', date: 'July 25', address: 'Watch Hill, RI', driveIndex: 27 }
    ];
  }, [historicalDrives, extractStateFromAddress]);

  // Return live data if available, otherwise static data
  return {
    drives: isLive ? drives : (staticData?.drives || []),
    charges: isLive ? charges : (staticData?.charges || []),
    currentLocation: isLive ? currentLocation : staticData?.currentLocation || null,
    journeyInsights: isLive ? journeyInsights : (staticData?.journeyInsights || {
      totalMiles: 0,
      statesVisited: [],
      daysElapsed: 0
    }),
    routePoints: generateRoutePoints(), // Real route points from drives
    loading,
    error,
    isLive,
    refresh
  };
}
