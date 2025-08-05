import Papa from 'papaparse';

export interface TimelineEntry {
  date: string;
  state: string;
  activities: string;
  startDate: Date;
  endDate: Date;
  waypoint?: {
    lat: number;
    lng: number;
    name: string;
  };
}

// Known coordinates for major stops from the CSV timeline
const WAYPOINT_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'Corpus Christi': { lat: 27.8006, lng: -97.3964, name: 'Corpus Christi, TX - Journey Start' },
  'Carlsbad Caverns': { lat: 32.1478, lng: -104.4405, name: 'Carlsbad Caverns National Park, NM' },
  'Fort Stockton': { lat: 30.8897, lng: -102.8793, name: 'Fort Stockton, TX' },
  'El Paso': { lat: 31.7619, lng: -106.4850, name: 'El Paso, TX - Tesla Service' },
  'Sedona': { lat: 34.8697, lng: -111.7610, name: 'Sedona, AZ' },
  'Grand Canyon': { lat: 36.0544, lng: -112.1401, name: 'Grand Canyon National Park, AZ' },
  'Zion National Park': { lat: 37.2982, lng: -113.0263, name: 'Zion National Park, UT' },
  'Las Vegas': { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
  'Redwoods National Park': { lat: 41.2132, lng: -124.0046, name: 'Redwoods National Park, CA' },
  'Cannon Beach': { lat: 45.8917, lng: -123.9615, name: 'Cannon Beach, OR' },
  'Mount Baker-Snoqualmie': { lat: 47.7211, lng: -121.1531, name: 'Mount Baker-Snoqualmie, WA' },
  'Sequim': { lat: 48.0798, lng: -123.1015, name: 'Sequim, WA' },
  'Seattle': { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
  'Quincy': { lat: 47.2342, lng: -119.8522, name: 'Quincy, WA' },
  'Coeur d\'Alene': { lat: 47.6777, lng: -116.7805, name: 'Coeur d\'Alene, ID' },
  'Bozeman': { lat: 45.6770, lng: -111.0429, name: 'Bozeman, MT' },
  'Big Sky': { lat: 45.2847, lng: -111.4006, name: 'Big Sky, MT - Lone Mountain Summit' },
  'Yellowstone': { lat: 44.4280, lng: -110.5885, name: 'Yellowstone National Park, WY' },
  'Salt Lake City': { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City, UT' },
  'Provo': { lat: 40.2338, lng: -111.6585, name: 'Provo, UT' },
  'Denver': { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
  'Fort Collins': { lat: 40.5853, lng: -105.0844, name: 'Fort Collins, CO' },
  'Lincoln': { lat: 40.8136, lng: -96.7026, name: 'Lincoln, NE' },
  'Council Bluffs': { lat: 41.2619, lng: -95.8608, name: 'Council Bluffs, IA' },
  'Badlands': { lat: 43.8554, lng: -102.3397, name: 'Badlands National Park, SD' },
  'Fargo': { lat: 46.8772, lng: -96.7898, name: 'Fargo, ND' },
  'Minneapolis': { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' },
  'Kenosha': { lat: 42.5847, lng: -87.8212, name: 'Mars Cheese Castle, Kenosha, WI' },
  'Chicago': { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL - Wrigleyville' },
  'Terre Haute': { lat: 39.4667, lng: -87.4139, name: 'Terre Haute, IN' },
  'Turkey Run State Park': { lat: 39.8767, lng: -87.2019, name: 'Turkey Run State Park, IN' },
  'John Bryan SP': { lat: 39.7947, lng: -83.8552, name: 'John Bryan State Park, OH' },
  'Cincinnati': { lat: 39.1031, lng: -84.5120, name: 'Cincinnati, OH' },
  'Erie': { lat: 42.1292, lng: -80.0851, name: 'Erie, PA - Lake Erie' },
  'Albany': { lat: 42.6526, lng: -73.7562, name: 'Albany, NY' },
  'Green Mountain': { lat: 43.2081, lng: -72.8092, name: 'Green Mountain National Forest, VT' },
  'White Mountain': { lat: 44.2619, lng: -71.3031, name: 'White Mountain National Forest, NH' },
  'Bar Harbor': { lat: 44.3876, lng: -68.2039, name: 'Bar Harbor, ME' },
  'Cadillac Mountain': { lat: 44.3531, lng: -68.2251, name: 'Cadillac Mountain, ME - Sunrise Hike' },
  'Stratford': { lat: 41.1848, lng: -73.1332, name: 'Stratford, CT' },
  'Watch Hill Point': { lat: 41.3126, lng: -71.8570, name: 'Watch Hill Point, RI' }
};

function parseDate(dateStr: string): { start: Date; end: Date } {
  const currentYear = 2025;
  
  // Handle date ranges like "June 2–3", "July 3 (evening)", etc.
  const cleanDate = dateStr.replace(/\s*\([^)]*\)/, ''); // Remove parenthetical notes
  
  if (cleanDate.includes('–') || cleanDate.includes('-')) {
    // Date range
    const [startStr, endStr] = cleanDate.split(/[–-]/).map(s => s.trim());
    const [startMonth, startDay] = startStr.split(' ').filter(Boolean);
    const endDay = endStr.includes(' ') ? endStr.split(' ')[1] : endStr;
    const endMonth = endStr.includes(' ') ? endStr.split(' ')[0] : startMonth;
    
    return {
      start: new Date(`${startMonth} ${startDay}, ${currentYear}`),
      end: new Date(`${endMonth} ${endDay}, ${currentYear}`)
    };
  } else {
    // Single date
    const singleDate = new Date(`${cleanDate}, ${currentYear}`);
    return {
      start: singleDate,
      end: singleDate
    };
  }
}

function findWaypoint(activities: string, state: string): { lat: number; lng: number; name: string } | undefined {
  // Look for specific landmarks in activities first
  for (const [key, coord] of Object.entries(WAYPOINT_COORDINATES)) {
    if (activities.toLowerCase().includes(key.toLowerCase())) {
      return coord;
    }
  }
  
  // If no specific waypoint found, try to match by state (use major cities)
  const stateDefaults: Record<string, { lat: number; lng: number; name: string }> = {
    'Texas': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
    'New Mexico': { lat: 35.0844, lng: -106.6504, name: 'Albuquerque, NM' },
    'Arizona': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' },
    'Utah': { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City, UT' },
    'Nevada': { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
    'California': { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
    'Oregon': { lat: 45.5152, lng: -122.6784, name: 'Portland, OR' },
    'Washington': { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' },
    'Idaho': { lat: 43.6150, lng: -116.2023, name: 'Boise, ID' },
    'Montana': { lat: 46.5958, lng: -110.6049, name: 'Billings, MT' },
    'Wyoming': { lat: 41.1400, lng: -104.8197, name: 'Cheyenne, WY' },
    'Colorado': { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' },
    'Nebraska': { lat: 40.8136, lng: -96.7026, name: 'Lincoln, NE' },
    'Iowa': { lat: 41.5868, lng: -93.6250, name: 'Des Moines, IA' },
    'South Dakota': { lat: 44.2998, lng: -99.4388, name: 'Pierre, SD' },
    'North Dakota': { lat: 46.8772, lng: -96.7898, name: 'Fargo, ND' },
    'Minnesota': { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' },
    'Wisconsin': { lat: 43.0731, lng: -87.9073, name: 'Milwaukee, WI' },
    'Illinois': { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
    'Indiana': { lat: 39.7910, lng: -86.1480, name: 'Indianapolis, IN' },
    'Ohio': { lat: 39.9612, lng: -82.9988, name: 'Columbus, OH' },
    'Pennsylvania': { lat: 40.2732, lng: -76.8839, name: 'Harrisburg, PA' },
    'New York': { lat: 42.6526, lng: -73.7562, name: 'Albany, NY' },
    'Vermont': { lat: 44.2601, lng: -72.5806, name: 'Montpelier, VT' },
    'New Hampshire': { lat: 43.2081, lng: -71.5376, name: 'Concord, NH' },
    'Maine': { lat: 44.3876, lng: -68.2039, name: 'Bar Harbor, ME' },
    'Massachusetts': { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' },
    'Connecticut': { lat: 41.1848, lng: -73.1332, name: 'Stratford, CT' },
    'Rhode Island': { lat: 41.3126, lng: -71.8570, name: 'Watch Hill Point, RI' }
  };
  
  return stateDefaults[state];
}

export async function loadTimelineData(): Promise<TimelineEntry[]> {
  try {
    // Try to fetch from public data directory first
    let csvData: string;
    try {
      const response = await fetch('/data/awhittlewandering_timeline.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch CSV from public directory');
      }
      csvData = await response.text();
    } catch {
      // Fallback to hardcoded data if CSV not accessible
      console.warn('CSV not accessible, using fallback data');
      csvData = `Date(s),State(s),Key Stop(s) / Activities
June 1,Texas,Corpus Christi - Journey Start
June 2,New Mexico,Carlsbad Caverns National Park
June 6,Arizona,Sedona
June 8,Utah,Zion National Park
June 9,California,Los Angeles
June 15,Oregon,Portland
June 16,Washington,Seattle
June 20,Idaho,Coeur d'Alene
June 21,Montana,Bozeman
June 23,Wyoming,Yellowstone National Park
June 27,Colorado,Denver
July 3,Nebraska,Lincoln
July 4,Iowa,Council Bluffs
July 4,South Dakota,Badlands National Park
July 5,North Dakota,Fargo
July 6,Minnesota,Minneapolis
July 7,Wisconsin,Kenosha
July 8,Illinois,Chicago
July 9,Indiana,Terre Haute
July 10,Ohio,Cincinnati
July 13,Pennsylvania,Erie
July 14,New York,Albany
July 15,Vermont,Green Mountain National Forest
July 16,New Hampshire,White Mountain National Forest
July 17,Maine,Bar Harbor
July 19,Massachusetts,Boston
July 20,Connecticut,Stratford
July 25,Rhode Island,Watch Hill Point`;
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const entries: TimelineEntry[] = results.data.map((row: any) => {
              const dateRange = parseDate(row['Date(s)']);
              const state = row['State(s)']?.split('→')[0]?.trim() || row['State(s)']?.trim() || '';
              const activities = row['Key Stop(s) / Activities'] || '';
              const waypoint = findWaypoint(activities, state);
              
              return {
                date: row['Date(s)'],
                state,
                activities,
                startDate: dateRange.start,
                endDate: dateRange.end,
                waypoint
              };
            }).filter(entry => entry.date && entry.state);

            resolve(entries.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()));
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading timeline data:', error);
    return [];
  }
}

export function getTimelineWaypoints(entries: TimelineEntry[]): Array<{ lat: number; lng: number; name: string; date: string }> {
  return entries
    .filter(entry => entry.waypoint)
    .map(entry => ({
      lat: entry.waypoint!.lat,
      lng: entry.waypoint!.lng,
      name: entry.waypoint!.name,
      date: entry.date
    }));
}
