// A Whittle Wandering - Real-Time Tesla Road-Trip Tracker
// 48 Continental States Journey - Currently 31/48 States Visited

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

// A Whittle Wandering - REAL Journey Timeline (June 1 - July 26, 2025)
// START: Texas (Corpus Christi) → CURRENT: Connecticut (Stratford)
export const journeyTimeline: TimelineEvent[] = [
  {
    state: 'Texas',
    date: 'June 1-5, 2025',
    highlights: ['The calm before the storm', 'Final prep days in hometown', 'Charging devices, tuning systems, mapping dreams', 'Sasha curled up in shade'],
    type: 'milestone',
    location: { lat: 27.8006, lng: -97.3964 }
  },
  {
    state: 'Texas',
    date: 'June 6, 2025',
    highlights: ['Hit the road! Fort Stockton overnight', 'Goodbye comfort, hello freedom', 'First night under Texas sky'],
    type: 'milestone',
    location: { lat: 30.8949, lng: -102.8816 }
  },
  {
    state: 'Texas',
    date: 'June 7, 2025',
    highlights: ['Van Horn camping', 'Desert scrub and windblown highway signs', 'Dust and cactus flower scents'],
    type: 'scenic',
    location: { lat: 31.0515, lng: -104.8306 }
  },
  {
    state: 'Texas',
    date: 'June 8, 2025',
    highlights: ['El Paso Tesla service center', 'Mechanical pit stop', 'Maintenance for the great journey'],
    type: 'milestone',
    location: { lat: 31.7619, lng: -106.4850 }
  },
  {
    state: 'Arizona',
    date: 'June 9, 2025',
    highlights: ['Sedona red rock vortexes', 'Sasha chased lizards', 'Sunsets carved by hand'],
    type: 'scenic',
    location: { lat: 34.8697, lng: -111.7610 }
  },
  {
    state: 'Arizona',
    date: 'June 10, 2025',
    highlights: ['Grand Canyon Desert View Watchtower', 'Sunrise beyond photography', 'Scale held only in memory'],
    type: 'adventure',
    location: { lat: 36.0544, lng: -112.1401 }
  },
  {
    state: 'Utah',
    date: 'June 11, 2025',
    highlights: ['Zion National Park', 'Vertical breathlessness', 'Cathedral cliffs and winding narrows', 'Stone older than memory'],
    type: 'adventure',
    location: { lat: 37.2982, lng: -113.0263 }
  },
  {
    state: 'Nevada',
    date: 'June 12, 2025',
    highlights: ['Las Vegas drive-through', 'Neon flashes and distant blackjack tables', 'Chasing something purer'],
    type: 'cultural',
    location: { lat: 36.1699, lng: -115.1398 }
  },
  {
    state: 'California',
    date: 'June 12-16, 2025',
    highlights: ['4 days in Los Angeles with Laurent', 'City buzz and shared stories', 'Rest, espresso, sunset', 'Pacific whispered at back'],
    type: 'milestone',
    location: { lat: 34.0522, lng: -118.2437 }
  },
  {
    state: 'California',
    date: 'June 16, 2025',
    highlights: ['Big Sur overnight', 'Surf crashing against cliffs', 'Moon pouring silver across Sasha\'s coat'],
    type: 'scenic',
    location: { lat: 36.2704, lng: -121.8081 }
  },
  {
    state: 'California',
    date: 'June 17, 2025',
    highlights: ['San Francisco hills and fog', 'Walked the Mission', 'Ocean air and purposeful movement'],
    type: 'cultural',
    location: { lat: 37.7749, lng: -122.4194 }
  },
  {
    state: 'California',
    date: 'June 18, 2025',
    highlights: ['Redwoods National Park', 'Titans of silence', 'Trees humming in ancient frequencies'],
    type: 'adventure',
    location: { lat: 41.2132, lng: -124.0046 }
  },
  {
    state: 'Oregon',
    date: 'June 19, 2025',
    highlights: ['Cannon Beach', 'Wind, gulls, and sea stacks', 'Oregon coast washed you clean'],
    type: 'scenic',
    location: { lat: 45.8918, lng: -123.9615 }
  },
  {
    state: 'Washington',
    date: 'June 20-22, 2025',
    highlights: ['Verlot camping with Troy Guter', 'Campfires and stars', 'Emerald forest wildness', 'June 22: Olympia with Brian Williamson'],
    type: 'adventure',
    location: { lat: 48.0985, lng: -121.5691 }
  },
  {
    state: 'Washington',
    date: 'June 23, 2025',
    highlights: ['Seattle with Troy', 'Coffee, sidewalks, city breath', 'One last hang'],
    type: 'cultural',
    location: { lat: 47.6062, lng: -122.3321 }
  },
  {
    state: 'Washington',
    date: 'June 24, 2025',
    highlights: ['Quincy hike alone', 'Wide skies and dry trails', 'Reset button between chapters'],
    type: 'scenic',
    location: { lat: 47.2344, lng: -119.8522 }
  },
  {
    state: 'Idaho',
    date: 'June 25, 2025',
    highlights: ['Coeur d\'Alene lakeside sleep', 'Pine-scented stillness', 'Sasha and lake dreams'],
    type: 'scenic',
    location: { lat: 47.6777, lng: -116.7805 }
  },
  {
    state: 'Montana',
    date: 'June 25-26, 2025',
    highlights: ['Bozeman with Jasper, Sam, Dakota', 'Fire pits and beers', 'Horizon that kept going'],
    type: 'cultural',
    location: { lat: 45.6770, lng: -111.0429 }
  },
  {
    state: 'Montana',
    date: 'June 27, 2025',
    highlights: ['Big Sky - Summited Lone Mountain!', 'Alone. Alive. Electrified.', 'Peak achievement'],
    type: 'adventure',
    location: { lat: 45.2846, lng: -111.3009 }
  },
  {
    state: 'Wyoming',
    date: 'June 28, 2025',
    highlights: ['Yellowstone National Park', 'Bison, geysers, alien terrain', 'A planet within a planet'],
    type: 'adventure',
    location: { lat: 44.4280, lng: -110.5885 }
  },
  {
    state: 'Utah',
    date: 'June 29-30, 2025',
    highlights: ['Provo with Erin Lane', 'After wildness, calm presence', 'Two solid grounding days'],
    type: 'cultural',
    location: { lat: 40.2338, lng: -111.6585 }
  },
  {
    state: 'Colorado',
    date: 'July 1, 2025',
    highlights: ['Denver with Josh', 'Back to city rhythm', 'Heat and street'],
    type: 'cultural',
    location: { lat: 39.7392, lng: -104.9903 }
  },
  {
    state: 'Colorado',
    date: 'July 2, 2025',
    highlights: ['Fort Collins with Caleb Blakeman', 'Friendly reset in slower town', 'Coffee, catch-up, calm'],
    type: 'cultural',
    location: { lat: 40.5853, lng: -105.0844 }
  },
  {
    state: 'Nebraska',
    date: 'July 3-10, 2025',
    highlights: ['Lincoln with Hayden and Parents', 'Extended warm recharge', 'Kitchen smells, dog snores, familiar couches', 'First real pause'],
    type: 'milestone',
    location: { lat: 40.8136, lng: -96.7026 }
  },
  {
    state: 'Iowa',
    date: 'July 10, 2025',
    highlights: ['Council Bluffs photo stop', 'Whirlwind three-state day begins'],
    type: 'scenic',
    location: { lat: 41.2619, lng: -95.8608 }
  },
  {
    state: 'South Dakota',
    date: 'July 10, 2025',
    highlights: ['Badlands National Park', 'Jagged alien spires', 'Same whirlwind day continues'],
    type: 'adventure',
    location: { lat: 43.8554, lng: -102.3397 }
  },
  {
    state: 'North Dakota',
    date: 'July 10-11, 2025',
    highlights: ['Fargo dinner with Cyon', 'Sleep under ND sky', 'Morning in the plains'],
    type: 'cultural',
    location: { lat: 46.8772, lng: -96.7898 }
  },
  {
    state: 'Minnesota',
    date: 'July 12, 2025',
    highlights: ['Minneapolis visit', 'Food, energy, city pulse', 'Twin Cities exploration'],
    type: 'cultural',
    location: { lat: 44.9778, lng: -93.2650 }
  },
  {
    state: 'Wisconsin',
    date: 'July 13, 2025',
    highlights: ['Mars Cheese Castle in Kenosha', 'Obligatory. Delicious. Absurd.', 'Wisconsin cheese culture'],
    type: 'cultural',
    location: { lat: 42.5847, lng: -87.8212 }
  },
  {
    state: 'Illinois',
    date: 'July 14, 2025',
    highlights: ['Chicago with Connor McBride', 'Deep dish and Wrigley Field', 'Former Army team lead reunion', 'Brotherhood revived'],
    type: 'cultural',
    location: { lat: 41.8781, lng: -87.6298 }
  },
  {
    state: 'Indiana',
    date: 'July 15, 2025',
    highlights: ['Terre Haute with Jack Lavey', 'Turkey Run State Park trails', 'Sandstone bluffs and rain-slick roots'],
    type: 'adventure',
    location: { lat: 39.4667, lng: -87.4139 }
  },
  {
    state: 'Ohio',
    date: 'July 16-17, 2025',
    highlights: ['2 nights in Cincinnati', 'Cameron Hynes and Danny Garay', 'Skyline chili and belonging', 'Queen City conversations'],
    type: 'cultural',
    location: { lat: 39.1031, lng: -84.5120 }
  },
  {
    state: 'New York',
    date: 'July 18, 2025',
    highlights: ['Albany with Phil Dalton', 'Thoughtful day of ideas', 'History and reflection'],
    type: 'cultural',
    location: { lat: 42.6526, lng: -73.7562 }
  },
  {
    state: 'Vermont',
    date: 'July 19, 2025',
    highlights: ['Green Mountain solitude', 'Tent flaps open', 'Mist on bark'],
    type: 'scenic',
    location: { lat: 44.2601, lng: -72.5806 }
  },
  {
    state: 'New Hampshire',
    date: 'July 20, 2025',
    highlights: ['White Mountains sunrise', 'Morning mountain air'],
    type: 'scenic',
    location: { lat: 43.9373, lng: -71.7077 }
  },
  {
    state: 'Maine',
    date: 'July 20, 2025',
    highlights: ['Bar Harbor salty air', 'Cadillac Mountain summit on foot', 'Sunrise earned through effort'],
    type: 'milestone',
    location: { lat: 44.3876, lng: -68.2039 }
  },
  {
    state: 'Massachusetts',
    date: 'July 21, 2025',
    highlights: ['Drive-through to Connecticut', 'Coast lingered like memory', 'Bay State passage'],
    type: 'scenic',
    location: { lat: 42.3601, lng: -71.0589 }
  },
  {
    state: 'Connecticut',
    date: 'July 21-26, 2025',
    highlights: ['Stratford with Deanna', 'House, yard, meals, peace', 'Sasha slept deeply', 'Caught your breath'],
    type: 'milestone',
    current: true,
    location: { lat: 41.2048, lng: -73.1502 }
  },
  {
    state: 'Rhode Island',
    date: 'July 25, 2025',
    highlights: ['Watch Hill coastal cliffs', 'Crashing waves', 'Brief but beautiful Ocean State mark'],
    type: 'scenic',
    location: { lat: 41.3217, lng: -71.8562 }
  }
];

// Generate route path from journey waypoints for map visualization
export const routeLocations = journeyTimeline
  .filter(event => event.location)
  .map(event => ({
    lat: event.location!.lat,
    lng: event.location!.lng,
    timestamp: event.date,
    state: event.state
  }));

export const journeyStats = {
  totalStates: 48, // 48 Continental US States
  visitedStates: 31,
  remainingStates: 17,
  tripDuration: 55,
  daysElapsed: 55,
  daysRemaining: null, // Ongoing journey
  startDate: '2025-06-01',
  currentDate: '2025-07-26',
  currentState: 'Connecticut',
  totalMiles: 8500,
  averageMilesPerDay: 154,
  completionPercentage: 65 // 31/48 = 64.6%
};

// Achievement system based on real US Continental road trip milestones
export const journeyAchievements = [
  {
    id: 'journey_start',
    title: 'Texas Takeoff',
    description: 'Started the epic journey in Corpus Christi, Texas',
    icon: 'Play',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common'
  },
  {
    id: 'first_ten',
    title: 'Double Digits',
    description: 'Conquered your first 10 states',
    icon: 'Target',
    progress: 10,
    total: 10,
    achieved: true,
    rarity: 'common'
  },
  {
    id: 'coast_to_coast',
    title: 'Ocean to Ocean',
    description: 'Reached both Pacific and Atlantic coasts',
    icon: 'Waves',
    progress: 2,
    total: 2,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'mountain_conquest',
    title: 'Peak Performer',
    description: 'Summited Lone Mountain in Big Sky, Montana',
    icon: 'Mountain',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'national_parks',
    title: 'Park Ranger',
    description: 'Visited 6+ National Parks during the journey',
    icon: 'Trees',
    progress: 6,
    total: 5,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'new_england_sweep',
    title: 'New England Explorer',
    description: 'Visited all 6 New England states',
    icon: 'MapPin',
    progress: 6,
    total: 6,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'great_lakes_explorer',
    title: 'Great Lakes Navigator',
    description: 'Visited states bordering the Great Lakes',
    icon: 'Anchor',
    progress: 5,
    total: 4,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'desert_wanderer',
    title: 'Desert Wanderer',
    description: 'Crossed 4 major desert states',
    icon: 'Sun',
    progress: 4,
    total: 4,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'mountain_states',
    title: 'Rocky Mountain High',
    description: 'Conquered all Rocky Mountain states',
    icon: 'Peaks',
    progress: 4,
    total: 4,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'plains_crosser',
    title: 'Great Plains Crosser',
    description: 'Traveled through the heartland states',
    icon: 'Wheat',
    progress: 6,
    total: 5,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'time_zone_master',
    title: 'Time Zone Master',
    description: 'Traveled through all 4 continental time zones',
    icon: 'Clock',
    progress: 4,
    total: 4,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'elevation_extremes',
    title: 'Elevation Extremist',
    description: 'From sea level to mountain peaks',
    icon: 'TrendingUp',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'four_corners',
    title: 'Four Corners Collector',
    description: 'Visited Utah, Colorado, Arizona, and New Mexico',
    icon: 'Navigation',
    progress: 4,
    total: 4,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'border_patrol',
    title: 'Border Patrol',
    description: 'Visited states on Canadian and Mexican borders',
    icon: 'Shield',
    progress: 8,
    total: 6,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'capital_collector',
    title: 'Capital Collector',
    description: 'Visited 10+ state capitals',
    icon: 'Building',
    progress: 12,
    total: 10,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'seasonal_traveler',
    title: 'Seasonal Traveler',
    description: 'Experienced summer solstice during journey',
    icon: 'Calendar',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'independence_day',
    title: 'Independence Day Adventurer',
    description: 'Celebrated July 4th on the road',
    icon: 'Fireworks',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'two_thirds_complete',
    title: 'Two-Thirds Traveler',
    description: 'Completed 31 of 48 continental states (65%)',
    icon: 'Trophy',
    progress: 31,
    total: 32,
    achieved: false,
    rarity: 'epic'
  },
  {
    id: 'the_homestretch',
    title: 'The Homestretch',
    description: 'Only 10 states remaining!',
    icon: 'Flag',
    progress: 31,
    total: 38,
    achieved: false,
    rarity: 'epic'
  },
  {
    id: 'all_48_complete',
    title: 'Continental Champion',
    description: 'Visit all 48 continental United States',
    icon: 'Award',
    progress: 31,
    total: 48,
    achieved: false,
    rarity: 'legendary'
  }
];