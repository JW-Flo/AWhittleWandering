import { HistoricalDrive, HistoricalCharge } from '@/hooks/useTessieApi';

interface JourneyStats {
  totalJourneyMiles: number;
  statesConquered: number;
  completionPercentage: number;
  daysElapsed: number;
  currentState: string;
  averageDailyMiles: number;
  totalCharges: number;
  averageChargesPerDay: number;
  totalEnergyUsed: number;
  averageEfficiency: number;
  nextDestination?: {
    state: string;
    distance: number;
    eta: string;
  };
}

// State detection based on coordinates (simplified version)
const getStateFromCoordinates = (lat: number, lng: number): string => {
  // This is a simplified state detection - in production you'd use a proper geocoding service
  // For now, we'll use basic coordinate ranges for major states
  
  // Northeast
  if (lat >= 40.5 && lat <= 47.5 && lng >= -79 && lng <= -66) {
    if (lat >= 42.0 && lng >= -73.5) return 'Massachusetts';
    if (lat >= 41.0 && lat <= 42.0 && lng >= -73.7 && lng <= -71.8) return 'Connecticut';
    if (lat >= 40.5 && lat <= 41.4 && lng >= -75.5 && lng <= -73.9) return 'New York';
    if (lat >= 39.7 && lat <= 42.5 && lng >= -80.5 && lng <= -74.7) return 'Pennsylvania';
    if (lat >= 39.0 && lat <= 41.4 && lng >= -75.8 && lng <= -74.9) return 'New Jersey';
  }
  
  // Southeast
  if (lat >= 24.5 && lat <= 36.6 && lng >= -87 && lng <= -75) {
    if (lat >= 25.1 && lat <= 31.0 && lng >= -87.6 && lng <= -80.0) return 'Florida';
    if (lat >= 30.4 && lat <= 35.0 && lng >= -85.6 && lng <= -80.8) return 'Georgia';
    if (lat >= 32.0 && lat <= 35.2 && lng >= -84.3 && lng <= -75.5) return 'North Carolina';
    if (lat >= 32.0 && lat <= 35.2 && lng >= -83.4 && lng <= -78.5) return 'South Carolina';
  }
  
  // Midwest
  if (lat >= 36.0 && lat <= 49.4 && lng >= -104 && lng <= -80) {
    if (lat >= 41.5 && lat <= 47.1 && lng >= -90.4 && lng <= -86.8) return 'Michigan';
    if (lat >= 39.1 && lat <= 42.5 && lng >= -87.5 && lng <= -84.8) return 'Illinois';
    if (lat >= 38.4 && lat <= 42.5 && lng >= -91.5 && lng <= -87.0) return 'Indiana';
    if (lat >= 39.1 && lat <= 41.8 && lng >= -84.8 && lng <= -80.5) return 'Ohio';
  }
  
  // West
  if (lat >= 31.3 && lat <= 49.0 && lng >= -125 && lng <= -104) {
    if (lat >= 32.5 && lat <= 42.0 && lng >= -124.4 && lng <= -114.1) return 'California';
    if (lat >= 31.3 && lat <= 37.0 && lng >= -109.0 && lng <= -103.0) return 'Texas';
    if (lat >= 41.0 && lat <= 49.0 && lng >= -117.2 && lng <= -104.0) return 'Washington';
    if (lat >= 42.0 && lat <= 46.3 && lng >= -117.2 && lng <= -111.0) return 'Oregon';
  }
  
  return 'Unknown State';
};

// Get unique states from drives
const getUniqueStates = (drives: HistoricalDrive[]): string[] => {
  const states = new Set<string>();
  
  drives.forEach(drive => {
    // Add start state
    const startState = getStateFromCoordinates(
      drive.start_coordinates.lat, 
      drive.start_coordinates.lng
    );
    if (startState !== 'Unknown State') states.add(startState);
    
    // Add end state
    const endState = getStateFromCoordinates(
      drive.end_coordinates.lat, 
      drive.end_coordinates.lng
    );
    if (endState !== 'Unknown State') states.add(endState);
  });
  
  return Array.from(states);
};

// Calculate journey statistics from historical data
export const calculateJourneyStats = (
  drives: HistoricalDrive[], 
  charges: HistoricalCharge[],
  currentLocation?: { lat: number; lng: number }
): JourneyStats => {
  console.log('=== CALCULATING JOURNEY STATS ===');
  console.log('Input drives:', drives.length, drives.slice(0, 2));
  console.log('Input charges:', charges.length, charges.slice(0, 2));
  
  const journeyStartDate = new Date('2025-06-01');
  const currentDate = new Date();
  const daysElapsed = Math.floor((currentDate.getTime() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total miles from drives - check the actual data structure
  const totalJourneyMiles = drives.reduce((total, drive) => {
    const miles = drive.distance_miles || 0;
    console.log('Drive miles:', miles, 'from drive:', drive);
    return total + miles;
  }, 0);
  
  console.log('Total calculated miles:', totalJourneyMiles);
  
  // Get unique states visited
  const statesVisited = getUniqueStates(drives);
  const statesConquered = statesVisited.length;
  
  console.log('States visited:', statesVisited);
  console.log('States conquered:', statesConquered);
  
  // Calculate completion percentage (assuming 48 continental US states as target)
  const totalUSStates = 48; // Continental US
  const completionPercentage = (statesConquered / totalUSStates) * 100;
  
  // Calculate daily averages
  const averageDailyMiles = daysElapsed > 0 ? totalJourneyMiles / daysElapsed : 0;
  const totalCharges = charges.length;
  const averageChargesPerDay = daysElapsed > 0 ? totalCharges / daysElapsed : 0;
  
  // Calculate energy statistics - check the actual data structure
  const totalEnergyUsed = charges.reduce((total, charge) => {
    const energy = charge.energy_added_kwh || 0;
    return total + energy;
  }, 0);
  
  const averageEfficiency = totalEnergyUsed > 0 ? totalJourneyMiles / totalEnergyUsed : 0;
  
  // Determine current state
  const currentState = currentLocation 
    ? getStateFromCoordinates(currentLocation.lat, currentLocation.lng)
    : 'Unknown';
  
  // Simple next destination logic (would be more sophisticated in production)
  const nextDestination = statesConquered < totalUSStates ? {
    state: 'Massachusetts', // Example next destination
    distance: 47,
    eta: 'Aug 3, 6:30 AM'
  } : undefined;
  
  const result = {
    totalJourneyMiles: Math.round(totalJourneyMiles),
    statesConquered,
    completionPercentage: Math.round(completionPercentage * 10) / 10,
    daysElapsed,
    currentState,
    averageDailyMiles: Math.round(averageDailyMiles),
    totalCharges,
    averageChargesPerDay: Math.round(averageChargesPerDay * 10) / 10,
    totalEnergyUsed: Math.round(totalEnergyUsed),
    averageEfficiency: Math.round(averageEfficiency * 10) / 10,
    nextDestination
  };
  
  console.log('Final calculated stats:', result);
  return result;
};

// Calculate insights from historical data
export const calculateJourneyInsights = (
  drives: HistoricalDrive[], 
  charges: HistoricalCharge[]
) => {
  const totalMiles = drives.reduce((sum, drive) => sum + (drive.distance_miles || 0), 0);
  const totalEnergy = charges.reduce((sum, charge) => sum + (charge.energy_added_kwh || 0), 0);
  
  // Calculate charging patterns
  const chargingTimes = charges.map(charge => {
    const time = new Date(charge.start_time);
    return `${time.getHours().toString().padStart(2, '0')}:00`;
  });
  
  const timeFrequency = chargingTimes.reduce((acc, time) => {
    acc[time] = (acc[time] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const preferredChargingTimes = Object.entries(timeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([time]) => time);
  
  // Calculate average stop duration
  const stopDurations = charges.map(charge => {
    const start = new Date(charge.start_time);
    const end = new Date(charge.end_time);
    return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
  });
  
  const averageStopDuration = stopDurations.length > 0 
    ? stopDurations.reduce((sum, duration) => sum + duration, 0) / stopDurations.length
    : 0;
  
  return {
    efficiency: {
      milesPerKwh: totalEnergy > 0 ? Math.round((totalMiles / totalEnergy) * 10) / 10 : 0,
      totalEnergyUsed: Math.round(totalEnergy)
    },
    patterns: {
      averageStopDuration: Math.round(averageStopDuration),
      preferredChargingTimes
    }
  };
};
