// Real trip data analyzer for A Whittle Wandering
// Analyzes actual Tesla trip data from CSV export

interface TripDataPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  shiftState: string;
  odometer: number;
  speed: number;
}

interface StateInfo {
  name: string;
  abbrev: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// US State boundaries (simplified - you might want more precise boundaries)
const US_STATES: StateInfo[] = [
  { name: 'Texas', abbrev: 'TX', bounds: { north: 36.5, south: 25.8, east: -93.5, west: -106.6 } },
  { name: 'Oklahoma', abbrev: 'OK', bounds: { north: 37.0, south: 33.6, east: -94.4, west: -103.0 } },
  { name: 'Arkansas', abbrev: 'AR', bounds: { north: 36.5, south: 33.0, east: -89.6, west: -94.6 } },
  { name: 'Louisiana', abbrev: 'LA', bounds: { north: 33.0, south: 28.9, east: -88.8, west: -94.0 } },
  { name: 'Mississippi', abbrev: 'MS', bounds: { north: 35.0, south: 30.2, east: -88.1, west: -91.7 } },
  { name: 'Alabama', abbrev: 'AL', bounds: { north: 35.0, south: 30.2, east: -84.9, west: -88.5 } },
  { name: 'Tennessee', abbrev: 'TN', bounds: { north: 36.7, south: 34.9, east: -81.6, west: -90.3 } },
  { name: 'Kentucky', abbrev: 'KY', bounds: { north: 39.1, south: 36.5, east: -81.9, west: -89.6 } },
  { name: 'Missouri', abbrev: 'MO', bounds: { north: 40.6, south: 35.9, east: -89.1, west: -95.8 } },
  { name: 'Illinois', abbrev: 'IL', bounds: { north: 42.5, south: 37.0, east: -87.0, west: -91.5 } },
  { name: 'Indiana', abbrev: 'IN', bounds: { north: 41.8, south: 37.8, east: -84.8, west: -88.1 } },
  { name: 'Ohio', abbrev: 'OH', bounds: { north: 42.3, south: 38.4, east: -80.5, west: -84.8 } },
  { name: 'West Virginia', abbrev: 'WV', bounds: { north: 40.6, south: 37.2, east: -77.7, west: -82.6 } },
  { name: 'Virginia', abbrev: 'VA', bounds: { north: 39.5, south: 36.5, east: -75.2, west: -83.7 } },
  { name: 'North Carolina', abbrev: 'NC', bounds: { north: 36.6, south: 33.8, east: -75.5, west: -84.3 } },
  { name: 'South Carolina', abbrev: 'SC', bounds: { north: 35.2, south: 32.0, east: -78.5, west: -83.4 } },
  { name: 'Georgia', abbrev: 'GA', bounds: { north: 35.0, south: 30.4, east: -80.8, west: -85.6 } },
  { name: 'Florida', abbrev: 'FL', bounds: { north: 31.0, south: 24.4, east: -79.8, west: -87.6 } },
  { name: 'Michigan', abbrev: 'MI', bounds: { north: 48.3, south: 41.7, east: -82.4, west: -90.4 } },
  { name: 'Wisconsin', abbrev: 'WI', bounds: { north: 47.1, south: 42.5, east: -86.2, west: -92.9 } },
  { name: 'Minnesota', abbrev: 'MN', bounds: { north: 49.4, south: 43.5, east: -89.5, west: -97.2 } },
  { name: 'Iowa', abbrev: 'IA', bounds: { north: 43.5, south: 40.4, east: -90.1, west: -96.6 } },
  { name: 'Nebraska', abbrev: 'NE', bounds: { north: 43.0, south: 40.0, east: -95.3, west: -104.1 } },
  { name: 'Kansas', abbrev: 'KS', bounds: { north: 40.0, south: 37.0, east: -94.6, west: -102.1 } },
  { name: 'Colorado', abbrev: 'CO', bounds: { north: 41.0, south: 37.0, east: -102.0, west: -109.1 } },
  { name: 'New Mexico', abbrev: 'NM', bounds: { north: 37.0, south: 31.3, east: -103.0, west: -109.1 } },
  { name: 'Arizona', abbrev: 'AZ', bounds: { north: 37.0, south: 31.3, east: -109.0, west: -114.8 } },
  { name: 'Utah', abbrev: 'UT', bounds: { north: 42.0, south: 37.0, east: -109.0, west: -114.1 } },
  { name: 'Nevada', abbrev: 'NV', bounds: { north: 42.0, south: 35.0, east: -114.0, west: -120.0 } },
  { name: 'California', abbrev: 'CA', bounds: { north: 42.0, south: 32.5, east: -114.1, west: -124.4 } },
  { name: 'Oregon', abbrev: 'OR', bounds: { north: 46.3, south: 41.9, east: -116.5, west: -124.6 } },
  { name: 'Washington', abbrev: 'WA', bounds: { north: 49.0, south: 45.5, east: -116.9, west: -124.8 } },
  { name: 'Idaho', abbrev: 'ID', bounds: { north: 49.0, south: 42.0, east: -111.0, west: -117.2 } },
  { name: 'Montana', abbrev: 'MT', bounds: { north: 49.0, south: 44.4, east: -104.0, west: -116.1 } },
  { name: 'Wyoming', abbrev: 'WY', bounds: { north: 45.0, south: 41.0, east: -104.1, west: -111.1 } },
  { name: 'North Dakota', abbrev: 'ND', bounds: { north: 49.0, south: 45.9, east: -96.6, west: -104.1 } },
  { name: 'South Dakota', abbrev: 'SD', bounds: { north: 45.9, south: 42.5, east: -96.4, west: -104.1 } },
  { name: 'Pennsylvania', abbrev: 'PA', bounds: { north: 42.3, south: 39.7, east: -74.7, west: -80.5 } },
  { name: 'New York', abbrev: 'NY', bounds: { north: 45.0, south: 40.5, east: -71.9, west: -79.8 } },
  { name: 'Vermont', abbrev: 'VT', bounds: { north: 45.0, south: 42.7, east: -71.5, west: -73.4 } },
  { name: 'New Hampshire', abbrev: 'NH', bounds: { north: 45.3, south: 42.7, east: -70.6, west: -72.6 } },
  { name: 'Maine', abbrev: 'ME', bounds: { north: 47.5, south: 43.1, east: -66.9, west: -71.1 } },
  { name: 'Massachusetts', abbrev: 'MA', bounds: { north: 42.9, south: 41.2, east: -69.9, west: -73.5 } },
  { name: 'Rhode Island', abbrev: 'RI', bounds: { north: 42.0, south: 41.1, east: -71.1, west: -71.9 } },
  { name: 'Connecticut', abbrev: 'CT', bounds: { north: 42.1, south: 40.9, east: -71.8, west: -73.7 } },
  { name: 'New Jersey', abbrev: 'NJ', bounds: { north: 41.4, south: 38.9, east: -73.9, west: -75.6 } },
  { name: 'Delaware', abbrev: 'DE', bounds: { north: 39.8, south: 38.4, east: -75.0, west: -75.8 } },
  { name: 'Maryland', abbrev: 'MD', bounds: { north: 39.7, south: 37.9, east: -75.0, west: -79.5 } },
];

export function detectStateFromCoordinates(lat: number, lng: number): StateInfo | null {
  return US_STATES.find(state => 
    lat <= state.bounds.north && 
    lat >= state.bounds.south && 
    lng <= state.bounds.east && 
    lng >= state.bounds.west
  ) || null;
}

export async function analyzeRealTripData(csvData: string) {
  const lines = csvData.split('\n').slice(1); // Skip header
  const tripData: TripDataPoint[] = [];
  const statesVisited = new Set<string>();
  const dailyData = new Map<string, { miles: number, states: Set<string> }>();
  
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let startOdometer = 0;
  let endOdometer = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const [timestamp, lat, lng, shiftState, odometer, speed] = line.split(',').map(s => s.replace(/"/g, ''));
    
    if (!timestamp || !lat || !lng) continue;
    
    const dataPoint: TripDataPoint = {
      timestamp,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      shiftState,
      odometer: parseFloat(odometer),
      speed: parseFloat(speed)
    };
    
    const date = new Date(timestamp);
    if (!startDate || date < startDate) {
      startDate = date;
      startOdometer = dataPoint.odometer;
    }
    if (!endDate || date > endDate) {
      endDate = date;
      endOdometer = dataPoint.odometer;
    }
    
    // Detect state from coordinates
    const state = detectStateFromCoordinates(dataPoint.latitude, dataPoint.longitude);
    if (state) {
      statesVisited.add(state.name);
      
      // Track daily data
      const dayKey = date.toISOString().split('T')[0];
      if (!dailyData.has(dayKey)) {
        dailyData.set(dayKey, { miles: 0, states: new Set() });
      }
      dailyData.get(dayKey)!.states.add(state.name);
    }
    
    tripData.push(dataPoint);
  }

  const totalDays = startDate && endDate ? 
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalMiles = endOdometer - startOdometer;

  return {
    tripData,
    statesVisited: Array.from(statesVisited),
    totalStates: statesVisited.size,
    totalDays,
    totalMiles: Math.round(totalMiles),
    averageMilesPerDay: totalDays > 0 ? Math.round(totalMiles / totalDays) : 0,
    startDate: startDate?.toISOString().split('T')[0] || '',
    endDate: endDate?.toISOString().split('T')[0] || '',
    startOdometer,
    endOdometer,
    dailyData: Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      miles: data.miles,
      statesVisited: Array.from(data.states)
    }))
  };
}
