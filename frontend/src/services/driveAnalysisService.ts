import { HistoricalDrive } from '@/hooks/useUnifiedTessieApi';

export interface JourneySegment {
  id: string;
  startDate: string;
  endDate: string;
  state: string;
  stateCode: string;
  startLocation: string;
  endLocation: string;
  durationHours: number;
  distanceMiles: number;
  isOvernight: boolean;
  isExtendedStay: boolean;
  stayDurationHours?: number;
  coordinates: {
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
  };
  category: 'drive' | 'overnight' | 'extended_stay' | 'border_crossing';
  milestoneType?: 'first_state' | 'summit' | 'national_park' | 'major_city' | 'border' | 'endpoint';
}

export interface JourneyStatistics {
  totalStatesVisited: number;
  uniqueStates: string[];
  totalMilesDriven: number;
  totalDrivingHours: number;
  overnightStays: number;
  extendedStays: number;
  averageDailyMiles: number;
  journeyDuration: number;
  firstState: string;
  currentState: string;
  borderCrossings: number;
  nationalParksVisited: string[];
  majorCitiesVisited: string[];
}

export interface TimelineEntry {
  date: string;
  state: string;
  stateCode: string;
  location: string;
  description: string;
  category: 'arrival' | 'departure' | 'overnight' | 'milestone' | 'activity';
  coordinates: { lat: number; lng: number };
  durationHours?: number;
  significance: 'low' | 'medium' | 'high' | 'epic';
}

export class DriveAnalysisService {
  private stateMapping: { [key: string]: string } = {
    'TX': 'Texas', 'NM': 'New Mexico', 'AZ': 'Arizona', 'UT': 'Utah', 'NV': 'Nevada',
    'CA': 'California', 'OR': 'Oregon', 'WA': 'Washington', 'ID': 'Idaho', 'MT': 'Montana',
    'WY': 'Wyoming', 'CO': 'Colorado', 'NE': 'Nebraska', 'IA': 'Iowa', 'SD': 'South Dakota',
    'ND': 'North Dakota', 'MN': 'Minnesota', 'WI': 'Wisconsin', 'IL': 'Illinois', 'IN': 'Indiana',
    'OH': 'Ohio', 'PA': 'Pennsylvania', 'NY': 'New York', 'VT': 'Vermont', 'NH': 'New Hampshire',
    'ME': 'Maine', 'MA': 'Massachusetts', 'CT': 'Connecticut', 'RI': 'Rhode Island',
    'MD': 'Maryland', 'DE': 'Delaware', 'NJ': 'New Jersey', 'FL': 'Florida', 'GA': 'Georgia',
    'SC': 'South Carolina', 'NC': 'North Carolina', 'VA': 'Virginia', 'WV': 'West Virginia',
    'KY': 'Kentucky', 'TN': 'Tennessee', 'AL': 'Alabama', 'MS': 'Mississippi', 'AR': 'Arkansas',
    'LA': 'Louisiana', 'OK': 'Oklahoma', 'KS': 'Kansas', 'MO': 'Missouri', 'MI': 'Michigan'
  };

  private nationalParks = [
    'Yellowstone', 'Zion', 'Grand Canyon', 'Yosemite', 'Redwood', 'Sequoia', 'Kings Canyon',
    'Carlsbad Caverns', 'Big Bend', 'Arches', 'Canyonlands', 'Capitol Reef', 'Bryce Canyon'
  ];

  private majorCities = [
    'Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'Denver', 'Chicago', 'Minneapolis',
    'Detroit', 'Boston', 'New York', 'Philadelphia', 'Washington', 'Atlanta', 'Miami'
  ];

  /**
   * Extract state from address using multiple patterns for maximum accuracy
   */
  private extractStateFromAddress(address: string): { state: string; stateCode: string } {
    if (!address) return { state: 'Unknown', stateCode: 'UN' };

    // Try multiple state extraction patterns
    const patterns = [
      /, ([A-Z]{2})(?:\s|$)/, // Standard ", TX " pattern
      /\b([A-Z]{2})\s*\d{5}/, // "TX 78701" pattern
      /\b([A-Z]{2})(?:\s*,|\s*$)/, // "TX," or "TX" at end
      /([A-Z]{2})\s+United States/, // "TX United States"
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match && this.stateMapping[match[1]]) {
        return {
          state: this.stateMapping[match[1]],
          stateCode: match[1]
        };
      }
    }

    // Fallback: search for full state names
    for (const [code, fullName] of Object.entries(this.stateMapping)) {
      if (address.toLowerCase().includes(fullName.toLowerCase())) {
        return { state: fullName, stateCode: code };
      }
    }

    console.warn('Could not extract state from address:', address);
    return { state: 'Unknown', stateCode: 'UN' };
  }

  /**
   * Detect if location is a national park
   */
  private isNationalPark(location: string): string | null {
    for (const park of this.nationalParks) {
      if (location.toLowerCase().includes(park.toLowerCase())) {
        return park;
      }
    }
    return null;
  }

  /**
   * Detect if location is a major city
   */
  private isMajorCity(location: string): string | null {
    for (const city of this.majorCities) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }
    return null;
  }

  /**
   * Analyze drive patterns to detect overnight stays and extended visits
   */
  public analyzeJourneyFromDrives(drives: HistoricalDrive[]): {
    segments: JourneySegment[];
    statistics: JourneyStatistics;
    timeline: TimelineEntry[];
  } {
    console.warn('🔍 Starting comprehensive drive analysis...', {
      totalDrives: drives.length,
      dateRange: drives.length > 0 ? {
        start: drives[0]?.start_time,
        end: drives[drives.length - 1]?.end_time
      } : null
    });

    // Sort drives chronologically
    const sortedDrives = [...drives].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const segments: JourneySegment[] = [];
    const timeline: TimelineEntry[] = [];
    const statesVisited = new Set<string>();
    const stateCodes = new Set<string>();
    const nationalParksVisited = new Set<string>();
    const majorCitiesVisited = new Set<string>();

    let totalMiles = 0;
    let totalHours = 0;
    let overnightStays = 0;
    let extendedStays = 0;
    let borderCrossings = 0;
    let previousState = '';

    for (let i = 0; i < sortedDrives.length; i++) {
      const drive = sortedDrives[i];
      const nextDrive = sortedDrives[i + 1];

      // Extract states for start and end
      const startStateInfo = this.extractStateFromAddress(drive.start_address);
      const endStateInfo = this.extractStateFromAddress(drive.end_address);

      // Add states to tracking
      if (startStateInfo.state !== 'Unknown') {
        statesVisited.add(startStateInfo.state);
        stateCodes.add(startStateInfo.stateCode);
      }
      if (endStateInfo.state !== 'Unknown') {
        statesVisited.add(endStateInfo.state);
        stateCodes.add(endStateInfo.stateCode);
      }

      // Detect border crossing
      const isBorderCrossing = startStateInfo.state !== endStateInfo.state && 
                               startStateInfo.state !== 'Unknown' && 
                               endStateInfo.state !== 'Unknown';

      if (isBorderCrossing) {
        borderCrossings++;
      }

      // Track first occurrence of each state
      if (endStateInfo.state !== previousState && endStateInfo.state !== 'Unknown') {
        timeline.push({
          date: new Date(drive.start_time).toLocaleDateString(),
          state: endStateInfo.state,
          stateCode: endStateInfo.stateCode,
          location: drive.end_address,
          description: `First arrival in ${endStateInfo.state}`,
          category: 'arrival',
          coordinates: drive.end_coordinates,
          significance: 'high'
        });
      }

      // Check for national parks and major cities
      const nationalPark = this.isNationalPark(drive.end_address);
      const majorCity = this.isMajorCity(drive.end_address);

      if (nationalPark) {
        nationalParksVisited.add(nationalPark);
        timeline.push({
          date: new Date(drive.start_time).toLocaleDateString(),
          state: endStateInfo.state,
          stateCode: endStateInfo.stateCode,
          location: drive.end_address,
          description: `Visited ${nationalPark} National Park`,
          category: 'milestone',
          coordinates: drive.end_coordinates,
          significance: 'epic'
        });
      }

      if (majorCity) {
        majorCitiesVisited.add(majorCity);
        timeline.push({
          date: new Date(drive.start_time).toLocaleDateString(),
          state: endStateInfo.state,
          stateCode: endStateInfo.stateCode,
          location: drive.end_address,
          description: `Explored ${majorCity}`,
          category: 'milestone',
          coordinates: drive.end_coordinates,
          significance: 'high'
        });
      }

      // Analyze time gap to next drive for overnight/extended stays
      let isOvernight = false;
      let isExtendedStay = false;
      let stayDurationHours = 0;

      if (nextDrive) {
        const currentEnd = new Date(drive.end_time);
        const nextStart = new Date(nextDrive.start_time);
        stayDurationHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

        if (stayDurationHours >= 8 && stayDurationHours < 48) {
          isOvernight = true;
          overnightStays++;
          
          timeline.push({
            date: new Date(drive.end_time).toLocaleDateString(),
            state: endStateInfo.state,
            stateCode: endStateInfo.stateCode,
            location: drive.end_address,
            description: `Overnight stay in ${endStateInfo.state}`,
            category: 'overnight',
            coordinates: drive.end_coordinates,
            durationHours: stayDurationHours,
            significance: 'medium'
          });
        } else if (stayDurationHours >= 48) {
          isExtendedStay = true;
          extendedStays++;
          
          timeline.push({
            date: new Date(drive.end_time).toLocaleDateString(),
            state: endStateInfo.state,
            stateCode: endStateInfo.stateCode,
            location: drive.end_address,
            description: `Extended stay in ${endStateInfo.state} (${Math.round(stayDurationHours / 24)} days)`,
            category: 'activity',
            coordinates: drive.end_coordinates,
            durationHours: stayDurationHours,
            significance: 'high'
          });
        }
      }

      // Create journey segment
      const segment: JourneySegment = {
        id: drive.id,
        startDate: drive.start_time,
        endDate: drive.end_time,
        state: endStateInfo.state,
        stateCode: endStateInfo.stateCode,
        startLocation: drive.start_address,
        endLocation: drive.end_address,
        durationHours: drive.duration_hours,
        distanceMiles: drive.distance_miles,
        isOvernight,
        isExtendedStay,
        stayDurationHours: stayDurationHours > 0 ? stayDurationHours : undefined,
        coordinates: {
          start: drive.start_coordinates,
          end: drive.end_coordinates
        },
        category: isBorderCrossing ? 'border_crossing' : 'drive',
        milestoneType: nationalPark ? 'national_park' : 
                      majorCity ? 'major_city' : 
                      isBorderCrossing ? 'border' : undefined
      };

      segments.push(segment);
      totalMiles += drive.distance_miles;
      totalHours += drive.duration_hours;
      previousState = endStateInfo.state;
    }

    // Calculate journey statistics
    const journeyStart = sortedDrives.length > 0 ? new Date(sortedDrives[0].start_time) : new Date();
    const journeyEnd = sortedDrives.length > 0 ? new Date(sortedDrives[sortedDrives.length - 1].end_time) : new Date();
    const journeyDuration = Math.ceil((journeyEnd.getTime() - journeyStart.getTime()) / (1000 * 60 * 60 * 24));

    const statistics: JourneyStatistics = {
      totalStatesVisited: statesVisited.size,
      uniqueStates: Array.from(statesVisited).filter(s => s !== 'Unknown'),
      totalMilesDriven: Math.round(totalMiles),
      totalDrivingHours: Math.round(totalHours),
      overnightStays,
      extendedStays,
      averageDailyMiles: journeyDuration > 0 ? Math.round(totalMiles / journeyDuration) : 0,
      journeyDuration,
      firstState: segments.length > 0 ? segments[0].state : 'Unknown',
      currentState: segments.length > 0 ? segments[segments.length - 1].state : 'Unknown',
      borderCrossings,
      nationalParksVisited: Array.from(nationalParksVisited),
      majorCitiesVisited: Array.from(majorCitiesVisited)
    };

    console.warn('✅ Drive analysis complete:', {
      statesFound: statistics.totalStatesVisited,
      totalMiles: statistics.totalMilesDriven,
      journeyDays: statistics.journeyDuration,
      segments: segments.length,
      timelineEntries: timeline.length,
      nationalParks: statistics.nationalParksVisited.length,
      majorCities: statistics.majorCitiesVisited.length
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { segments, statistics, timeline };
  }

  /**
   * Generate route waypoints from analyzed journey
   */
  public generateRouteWaypoints(segments: JourneySegment[]): Array<{
    latitude: number;
    longitude: number;
    state: string;
    date: string;
    address: string;
    driveIndex: number;
    category: string;
    significance: string;
  }> {
    return segments
      .filter(segment => segment.coordinates.end.lat !== 0 && segment.coordinates.end.lng !== 0)
      .map((segment, index) => ({
        latitude: segment.coordinates.end.lat,
        longitude: segment.coordinates.end.lng,
        state: segment.state,
        date: new Date(segment.startDate).toLocaleDateString(),
        address: segment.endLocation,
        driveIndex: index,
        category: segment.category,
        significance: segment.milestoneType || 'low'
      }));
  }
}

export const driveAnalysisService = new DriveAnalysisService();
