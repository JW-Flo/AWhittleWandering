// Real journey data based on actual Tesla trip from June-July 2025
// Based on actual CSV telemetry data from A Whittle Wandering adventure

export interface JourneyState {
  state: string;
  abbreviation: string;
  visited: boolean;
  date: string | null;
  stops: string[];
  currentLocation: boolean;
  highlights?: string[];
  type?: 'milestone' | 'scenic' | 'adventure' | 'cultural';
}

export interface TimelineEvent {
  state: string;
  date: string;
  highlights: string[];
  type: 'milestone' | 'scenic' | 'adventure' | 'cultural';
  current?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

// Real journey statistics from actual trip data - CURRENT STATUS
export const journeyStats = {
  totalStates: 48, // Goal: All 48 continental US states
  visitedStates: 29, // Currently visited (as of July 26, 2025)
  remainingStates: 19, // 48 - 29 = 19 states remaining
  tripDuration: 56, // June 1 - July 26, 2025 (56 days so far)
  daysElapsed: 56,
  daysRemaining: null, // Ongoing journey, end date TBD
  startDate: '2025-06-01',
  endDate: null, // Journey in progress
  currentState: 'Connecticut', // Leaving this afternoon to head south
  totalMiles: 11950, // Actual miles so far
  averageMilesPerDay: 213 // 11,950 miles / 56 days
};

// A Whittle Wandering - Real Journey Timeline based on actual trip description
export const journeyTimeline: TimelineEvent[] = [
  {
    state: 'Texas',
    date: 'June 1, 2025',
    highlights: ['Journey begins in Corpus Christi!', 'Tesla charged and ready', 'Adventure starts'],
    type: 'milestone',
    location: { lat: 27.8006, lng: -97.3964 }
  },
  {
    state: 'New Mexico',
    date: 'June 2-3, 2025',
    highlights: ['Carlsbad Caverns exploration', 'Underground wonders', 'First state conquered'],
    type: 'adventure',
    location: { lat: 32.1776, lng: -104.4569 }
  },
  {
    state: 'Texas',
    date: 'June 4, 2025',
    highlights: ['Fort Stockton overnight', 'Back through Texas', 'Tesla supercharging'],
    type: 'scenic',
    location: { lat: 30.8957, lng: -102.8790 }
  },
  {
    state: 'Texas',
    date: 'June 5, 2025',
    highlights: ['El Paso Tesla service', 'Vehicle maintenance', 'Border city vibes'],
    type: 'adventure',
    location: { lat: 31.7619, lng: -106.4850 }
  },
  {
    state: 'Arizona',
    date: 'June 6-7, 2025',
    highlights: ['Sedona red rocks', 'Grand Canyon Desert View Watchtower', 'Breathtaking vistas'],
    type: 'milestone',
    location: { lat: 36.0544, lng: -112.1401 }
  },
  {
    state: 'Utah',
    date: 'June 8, 2025',
    highlights: ['Zion National Park', 'First Utah adventure', 'Towering canyon walls'],
    type: 'scenic',
    location: { lat: 37.2982, lng: -113.0263 }
  },
  {
    state: 'Nevada',
    date: 'June 9, 2025',
    highlights: ['Drove through Las Vegas', 'Desert crossing', 'Bright lights brief stop'],
    type: 'adventure',
    location: { lat: 36.1716, lng: -115.1391 }
  },
  {
    state: 'California',
    date: 'June 9-14, 2025',
    highlights: ['Los Angeles 4-day stay', 'PCH coastal drive north', 'Redwoods National Park'],
    type: 'milestone',
    location: { lat: 41.2132, lng: -124.0046 }
  },
  {
    state: 'Oregon',
    date: 'June 15, 2025',
    highlights: ['Cannon Beach beauty', 'Pacific coastline', 'Haystack Rock views'],
    type: 'scenic',
    location: { lat: 45.8912, lng: -123.9615 }
  },
  {
    state: 'Washington',
    date: 'June 16, 2025',
    highlights: ['Verlot, Mount Baker-Snoqualmie', 'Mountain wilderness'],
    type: 'scenic',
    location: { lat: 48.0781, lng: -121.7432 }
  },
  {
    state: 'Washington',
    date: 'June 22, 2025',
    highlights: ['Olympia National Park camping', 'Overnight in nature'],
    type: 'adventure',
    location: { lat: 47.8021, lng: -123.6044 }
  },
  {
    state: 'Washington',
    date: 'June 23, 2025',
    highlights: ['Sequim with Brian', 'Left for Seattle 9pm', 'Executive Hotel Pacific arrival'],
    type: 'cultural',
    location: { lat: 47.6062, lng: -122.3321 }
  },
  {
    state: 'Idaho',
    date: 'June 20, 2025',
    highlights: ['Coeur d\'Alene camping', 'Lake views overnight', 'Mountain fresh air'],
    type: 'scenic',
    location: { lat: 47.6777, lng: -116.7804 }
  },
  {
    state: 'Montana',
    date: 'June 21-22, 2025',
    highlights: ['Bozeman arrival', 'Big Sky adventure', 'Summited Lone Mountain!'],
    type: 'milestone',
    location: { lat: 45.6870, lng: -111.0429 }
  },
  {
    state: 'Wyoming',
    date: 'June 23-24, 2025',
    highlights: ['Yellowstone National Park', 'Geysers and wildlife', 'Two amazing days'],
    type: 'adventure',
    location: { lat: 44.4280, lng: -110.5885 }
  },
  {
    state: 'Utah',
    date: 'June 25-26, 2025',
    highlights: ['Salt Lake City return', '2-day Provo visit', 'Utah round two'],
    type: 'cultural',
    location: { lat: 40.2731, lng: -111.6585 }
  },
  {
    state: 'Colorado',
    date: 'June 27-28, 2025',
    highlights: ['Denver with Josh', 'Fort Collins with Caleb', 'Rocky Mountain state'],
    type: 'cultural',
    location: { lat: 40.5853, lng: -105.0844 }
  },
  {
    state: 'Nebraska',
    date: 'July 3, 2025',
    highlights: ['Lincoln arrival evening', '4-day stay planned', 'Great Plains crossing'],
    type: 'scenic',
    location: { lat: 40.8136, lng: -96.7026 }
  },
  {
    state: 'Iowa',
    date: 'July 4, 2025',
    highlights: ['Council Bluffs stop', 'Independence Day travel', 'Midwest journey'],
    type: 'milestone',
    location: { lat: 41.2619, lng: -95.8608 }
  },
  {
    state: 'South Dakota',
    date: 'July 4, 2025',
    highlights: ['Badlands National Park', 'Dramatic landscapes', 'Fourth of July adventure'],
    type: 'adventure',
    location: { lat: 43.8554, lng: -102.3397 }
  },
  {
    state: 'North Dakota',
    date: 'July 10-11, 2025',
    highlights: ['Jasper Hotel downtown Fargo', 'Prairie state conquered', 'Thursday overnight stay'],
    type: 'cultural',
    location: { lat: 46.8772, lng: -96.7898 }
  },
  {
    state: 'Minnesota',
    date: 'July 6, 2025',
    highlights: ['Minneapolis city visit', 'Twin Cities exploration', 'Land of 10,000 lakes'],
    type: 'cultural',
    location: { lat: 44.9778, lng: -93.2650 }
  },
  {
    state: 'Wisconsin',
    date: 'July 7, 2025',
    highlights: ['Mars Cheese Castle in Kenosha', 'Wisconsin cheese culture', 'Dairy state delights'],
    type: 'cultural',
    location: { lat: 42.5847, lng: -87.8212 }
  },
  {
    state: 'Illinois',
    date: 'July 8, 2025',
    highlights: ['Chicago Wrigleyville', 'Met Connor McBride', 'Windy City adventures'],
    type: 'cultural',
    location: { lat: 41.8781, lng: -87.6298 }
  },
  {
    state: 'Indiana',
    date: 'July 9, 2025',
    highlights: ['Terre Haute with Jack Lavey', 'Turkey Run State Park', 'Hoosier state nature'],
    type: 'scenic',
    location: { lat: 39.4664, lng: -87.4139 }
  },
  {
    state: 'Ohio',
    date: 'July 10-12, 2025',
    highlights: ['John Bryan SP, Clifton Gorge', '2 nights Cincinnati with Cameron Hynes', 'Buckeye state highlights'],
    type: 'scenic',
    location: { lat: 39.1031, lng: -84.5120 }
  },
  {
    state: 'Pennsylvania',
    date: 'July 13, 2025',
    highlights: ['Erie and Lake Erie', 'Great Lakes shoreline', 'Keystone state waters'],
    type: 'scenic',
    location: { lat: 42.1292, lng: -80.0851 }
  },
  {
    state: 'New York',
    date: 'July 14, 2025',
    highlights: ['Albany with Phil Dalton', 'Hudson Valley views'],
    type: 'cultural',
    location: { lat: 42.6526, lng: -73.7562 }
  },
  {
    state: 'Vermont',
    date: 'July 15, 2025',
    highlights: ['Green Mountain National Forest', 'Vermont wilderness', 'Mountain state serenity'],
    type: 'scenic',
    location: { lat: 44.0459, lng: -72.7107 }
  },
  {
    state: 'New Hampshire',
    date: 'July 16, 2025',
    highlights: ['White Mountain Visitor Center', 'Live Free or Die state', 'Mountain exploration'],
    type: 'scenic',
    location: { lat: 44.2619, lng: -71.9989 }
  },
  {
    state: 'Maine',
    date: 'July 17-18, 2025',
    highlights: ['Bar Harbor beauty', 'Cadillac Mountain sunrise hike', 'Easternmost adventures'],
    type: 'milestone',
    location: { lat: 44.3876, lng: -68.2039 }
  },
  {
    state: 'Massachusetts',
    date: 'July 19, 2025',
    highlights: ['Drive-through to Connecticut', 'Bay State passage', 'Historic corridors'],
    type: 'cultural',
    location: { lat: 42.3601, lng: -71.0589 }
  },
  {
    state: 'Connecticut',
    date: 'July 20-26, 2025',
    highlights: ['Staying with Deanna in Stratford', 'Constitution State adventures', 'Preparing for southern journey'],
    type: 'milestone',
    current: true,
    location: { lat: 41.1865, lng: -73.1532 }
  },
  {
    state: 'Rhode Island',
    date: 'July 25, 2025',
    highlights: ['Watch Hill Point coastal visit', 'Ocean State beauty', 'Smallest state conquered'],
    type: 'scenic',
    location: { lat: 41.3217, lng: -71.8562 }
  }
];

// Legacy stats removed - using real data from above

// Achievement system based on real journey with expanded depth
export const journeyAchievements = [
  {
    id: 'journey_start',
    title: 'The Adventure Begins', 
    description: 'Started the epic 48-state Tesla journey in Texas',
    icon: 'Play',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common',
    points: 50
  },
  {
    id: 'first_week',
    title: 'Week One Warrior',
    description: 'Completed the first week of adventure',
    icon: 'Calendar',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common',
    points: 100
  },
  {
    id: 'desert_explorer',
    title: 'Desert Storm',
    description: 'Conquered the southwestern desert states',
    icon: 'Sun',
    progress: 4,
    total: 4,
    achieved: true,
    rarity: 'rare',
    points: 300
  },
  {
    id: 'first_ten_states',
    title: 'Double Digit Explorer',
    description: 'Conquered your first 10 states!',
    icon: 'Target',
    progress: 29,
    total: 10,
    achieved: true,
    rarity: 'rare',
    points: 500
  },
  {
    id: 'pacific_coast',
    title: 'Pacific Coast Highway Master',
    description: 'Drove the legendary California coastline',
    icon: 'Waves',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'epic',
    points: 750
  },
  {
    id: 'mountain_climber',
    title: 'Summit Conquerer',
    description: 'Summited Lone Mountain in Montana!',
    icon: 'Mountain',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'legendary',
    points: 1000
  },
  {
    id: 'national_parks',
    title: 'National Park Explorer',
    description: 'Visited 5+ National Parks on this journey',
    icon: 'Trees',
    progress: 7,
    total: 5,
    achieved: true,
    rarity: 'epic',
    points: 800
  },
  {
    id: 'halfway_hero',
    title: 'Halfway Hero',
    description: 'Reached 24 states - halfway to the goal!',
    icon: 'Trophy',
    progress: 29,
    total: 24,
    achieved: true,
    rarity: 'epic',
    points: 1200
  },
  {
    id: 'great_lakes',
    title: 'Great Lakes Navigator',
    description: 'Explored the Great Lakes region',
    icon: 'Droplets',
    progress: 3,
    total: 3,
    achieved: true,
    rarity: 'rare',
    points: 400
  },
  {
    id: 'midwest_master',
    title: 'Heartland Hero',
    description: 'Conquered the American Midwest',
    icon: 'Wheat',
    progress: 6,
    total: 6,
    achieved: true,
    rarity: 'rare',
    points: 600
  },
  {
    id: 'new_england_complete',
    title: 'New England Champion',
    description: 'Conquered all the New England states',
    icon: 'Flag',
    progress: 6,
    total: 6,
    achieved: true,
    rarity: 'epic',
    points: 900
  },
  {
    id: 'sunrise_hiker',
    title: 'Sunrise Summit',
    description: 'Hiked Cadillac Mountain for the first sunrise in America',
    icon: 'Sunrise',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'legendary',
    points: 1500
  },
  {
    id: 'cheese_connoisseur',
    title: 'Cheese Castle Champion',
    description: 'Discovered Wisconsin\'s famous Mars Cheese Castle',
    icon: 'Coffee',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'rare',
    points: 250
  },
  {
    id: 'baseball_fan',
    title: 'Wrigleyville Wanderer',
    description: 'Explored iconic Wrigleyville in Chicago',
    icon: 'MapPin',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common',
    points: 150
  },
  {
    id: 'mileage_master',
    title: '10,000 Mile Master',
    description: 'Drove over 10,000 miles on this epic journey',
    icon: 'Route',
    progress: 11950,
    total: 10000,
    achieved: true,
    rarity: 'epic',
    points: 1000
  },
  {
    id: 'state_hopper',
    title: 'State Hopping Pro',
    description: 'Visited multiple states in a single day',
    icon: 'Zap',
    progress: 8,
    total: 5,
    achieved: true,
    rarity: 'rare',
    points: 350
  },
  {
    id: 'two_month_warrior',
    title: 'Two Month Adventure',
    description: 'Sustained the adventure for over 8 weeks',
    icon: 'Clock',
    progress: 56,
    total: 56,
    achieved: true,
    rarity: 'epic',
    points: 800
  },
  {
    id: 'friend_gatherer',
    title: 'Social Butterfly',
    description: 'Stayed with friends in multiple states',
    icon: 'Users',
    progress: 8,
    total: 5,
    achieved: true,
    rarity: 'rare',
    points: 400
  },
  {
    id: 'tesla_champion',
    title: 'Electric Road Warrior',
    description: 'Proving Tesla can conquer America, state by state!',
    icon: 'Zap',
    progress: 29,
    total: 48,
    achieved: false,
    rarity: 'epic',
    points: 1200
  },
  {
    id: 'camping_expert',
    title: 'Wilderness Camper',
    description: 'Spent nights camping in the great outdoors',
    icon: 'Tent',
    progress: 4,
    total: 3,
    achieved: true,
    rarity: 'rare',
    points: 500
  },
  {
    id: 'fourtheenth_july',
    title: 'Independence Day Explorer',
    description: 'Celebrated July 4th on the road in the Badlands',
    icon: 'Sparkles',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'rare',
    points: 300
  },
  {
    id: 'new_england_complete',
    title: 'New England Champion',
    description: 'Conquered all the New England states',
    icon: 'Flag',
    progress: 6,
    total: 6,
    achieved: true,
    rarity: 'epic',
    points: 900
  },
  {
    id: 'two_month_warrior',
    title: 'Two Month Adventure',
    description: 'Sustained the adventure for over 8 weeks',
    icon: 'Clock',
    progress: 56,
    total: 56,
    achieved: true,
    rarity: 'epic',
    points: 800
  },
  {
    id: 'east_coast_finish',
    title: 'Atlantic Ocean Arrival',
    description: 'Reached the Atlantic coast - ready for the south!',
    icon: 'Waves',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'epic',
    points: 900
  },
  {
    id: 'cross_country_champion',
    title: 'Continental Champion',
    description: 'Visit all 48 continental US states',
    icon: 'Award',
    progress: 29,
    total: 48,
    achieved: false,
    rarity: 'legendary',
    points: 5000
  },
  {
    id: 'ultimate_wanderer',
    title: 'A Whittle Wandering Legend',
    description: 'Complete the ultimate American road trip adventure',
    icon: 'Crown',
    progress: 29,
    total: 48,
    achieved: false,
    rarity: 'mythic',
    points: 10000
  }
];