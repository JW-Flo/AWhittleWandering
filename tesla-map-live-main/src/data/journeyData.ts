// Real journey data for A Whittle Wandering
// 31-state cross-country adventure from June 1 - July 26, 2025

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

// A Whittle Wandering - Real Journey Timeline (June 1 - July 26, 2025)
export const journeyTimeline: TimelineEvent[] = [
  {
    state: 'Connecticut',
    date: 'June 1, 2025',
    highlights: ['Journey begins!', 'Final preparations', 'Family farewells'],
    type: 'milestone',
    location: { lat: 41.2048, lng: -73.1502 }
  },
  {
    state: 'New York',
    date: 'June 2, 2025',
    highlights: ['Empire State Building', 'Central Park drive', 'Brooklyn Bridge'],
    type: 'cultural',
    location: { lat: 40.7128, lng: -74.0060 }
  },
  {
    state: 'Pennsylvania',
    date: 'June 4, 2025',
    highlights: ['Liberty Bell', 'Philly cheesesteaks', 'Independence Hall'],
    type: 'cultural',
    location: { lat: 39.9526, lng: -75.1652 }
  },
  {
    state: 'Delaware',
    date: 'June 5, 2025',
    highlights: ['First State charm', 'Coastal beauty', 'Quick but memorable'],
    type: 'scenic',
    location: { lat: 38.9108, lng: -75.5277 }
  },
  {
    state: 'Maryland',
    date: 'June 6, 2025',
    highlights: ['Baltimore Inner Harbor', 'Crab cakes', 'Fort McHenry'],
    type: 'cultural',
    location: { lat: 39.2904, lng: -76.6122 }
  },
  {
    state: 'Virginia',
    date: 'June 8, 2025',
    highlights: ['Blue Ridge Mountains', 'Historic Williamsburg', 'Shenandoah Valley'],
    type: 'scenic',
    location: { lat: 37.4316, lng: -78.6569 }
  },
  {
    state: 'North Carolina',
    date: 'June 10, 2025',
    highlights: ['Great Smoky Mountains', 'Asheville art scene', 'BBQ traditions'],
    type: 'scenic',
    location: { lat: 35.7796, lng: -78.6382 }
  },
  {
    state: 'South Carolina',
    date: 'June 12, 2025',
    highlights: ['Charleston charm', 'Rainbow Row', 'Southern hospitality'],
    type: 'cultural',
    location: { lat: 32.7767, lng: -79.9311 }
  },
  {
    state: 'Georgia',
    date: 'June 14, 2025',
    highlights: ['Savannah squares', 'Peach cobbler', 'Historic district'],
    type: 'cultural',
    location: { lat: 32.0835, lng: -81.0998 }
  },
  {
    state: 'Florida',
    date: 'June 16, 2025',
    highlights: ['Key West sunset', 'Everglades wildlife', 'Miami Beach'],
    type: 'adventure',
    location: { lat: 25.7617, lng: -80.1918 }
  },
  {
    state: 'Alabama',
    date: 'June 19, 2025',
    highlights: ['Birmingham history', 'Gulf Coast beaches', 'Sweet tea'],
    type: 'cultural',
    location: { lat: 32.3617, lng: -86.2792 }
  },
  {
    state: 'Mississippi',
    date: 'June 21, 2025',
    highlights: ['Delta blues', 'Natchez Trace', 'River views'],
    type: 'cultural',
    location: { lat: 32.3547, lng: -89.3985 }
  },
  {
    state: 'Louisiana',
    date: 'June 23, 2025',
    highlights: ['New Orleans jazz', 'French Quarter', 'Beignets and coffee'],
    type: 'cultural',
    location: { lat: 29.9511, lng: -90.0715 }
  },
  {
    state: 'Texas',
    date: 'June 25, 2025',
    highlights: ['Austin music scene', 'BBQ paradise', 'Hill Country drives'],
    type: 'adventure',
    location: { lat: 30.2672, lng: -97.7431 }
  },
  {
    state: 'Arkansas',
    date: 'June 28, 2025',
    highlights: ['Hot Springs relaxation', 'Ozark Mountains', 'Diamond mining'],
    type: 'scenic',
    location: { lat: 34.7465, lng: -92.2896 }
  },
  {
    state: 'Oklahoma',
    date: 'June 30, 2025',
    highlights: ['Route 66 memories', 'Oklahoma City charm', 'Prairie sunsets'],
    type: 'adventure',
    location: { lat: 35.4676, lng: -97.5164 }
  },
  {
    state: 'Kansas',
    date: 'July 2, 2025',
    highlights: ['Sunflower fields', 'Dorothy\'s homeland', 'Endless horizons'],
    type: 'scenic',
    location: { lat: 39.0119, lng: -98.4842 }
  },
  {
    state: 'Colorado',
    date: 'July 4, 2025',
    highlights: ['Rocky Mountain peaks', 'Denver fireworks', 'Mile-high celebrations'],
    type: 'milestone',
    location: { lat: 39.7392, lng: -104.9903 }
  },
  {
    state: 'Nebraska',
    date: 'July 6, 2025',
    highlights: ['Chimney Rock', 'Pioneer spirit', 'Great Plains beauty'],
    type: 'scenic',
    location: { lat: 41.4925, lng: -99.9018 }
  },
  {
    state: 'South Dakota',
    date: 'July 8, 2025',
    highlights: ['Mount Rushmore majesty', 'Badlands adventure', 'Black Hills'],
    type: 'milestone',
    location: { lat: 43.9695, lng: -99.9018 }
  },
  {
    state: 'North Dakota',
    date: 'July 10, 2025',
    highlights: ['Theodore Roosevelt Park', 'Prairie wilderness', 'Medora charm'],
    type: 'scenic',
    location: { lat: 47.5515, lng: -101.0020 }
  },
  {
    state: 'Montana',
    date: 'July 12, 2025',
    highlights: ['Glacier National Park', 'Big Sky country', 'Going-to-the-Sun Road'],
    type: 'scenic',
    location: { lat: 47.0527, lng: -109.6333 }
  },
  {
    state: 'Wyoming',
    date: 'July 14, 2025',
    highlights: ['Yellowstone geysers', 'Grand Teton peaks', 'Wildlife encounters'],
    type: 'adventure',
    location: { lat: 43.0759, lng: -107.2903 }
  },
  {
    state: 'Idaho',
    date: 'July 16, 2025',
    highlights: ['Sawtooth Mountains', 'Sun Valley beauty', 'Potato country'],
    type: 'scenic',
    location: { lat: 44.0682, lng: -114.7420 }
  },
  {
    state: 'Utah',
    date: 'July 18, 2025',
    highlights: ['Arches National Park', 'Salt Lake serenity', 'Red rock wonders'],
    type: 'scenic',
    location: { lat: 39.3210, lng: -111.0937 }
  },
  {
    state: 'Nevada',
    date: 'July 20, 2025',
    highlights: ['Las Vegas lights', 'Valley of Fire', 'Desert landscapes'],
    type: 'adventure',
    location: { lat: 36.1716, lng: -115.1391 }
  },
  {
    state: 'Arizona',
    date: 'July 22, 2025',
    highlights: ['Grand Canyon wonder', 'Sedona red rocks', 'Desert sunsets'],
    type: 'milestone',
    location: { lat: 34.0489, lng: -111.0937 }
  },
  {
    state: 'New Mexico',
    date: 'July 24, 2025',
    highlights: ['Santa Fe art', 'White Sands magic', 'Southwestern culture'],
    type: 'cultural',
    location: { lat: 35.6870, lng: -105.9378 }
  },
  {
    state: 'California',
    date: 'July 26, 2025',
    highlights: ['Pacific Coast arrival', 'Golden Gate triumph', 'Journey complete!'],
    type: 'milestone',
    current: true,
    location: { lat: 37.7749, lng: -122.4194 }
  }
];

export const journeyStats = {
  totalStates: 31,
  visitedStates: 29,
  remainingStates: 2,
  tripDuration: 55,
  daysElapsed: 55,
  daysRemaining: 0,
  startDate: '2025-06-01',
  endDate: '2025-07-26',
  currentState: 'California',
  totalMiles: 6850,
  averageMilesPerDay: 125
};

// Achievement system based on real journey
export const journeyAchievements = [
  {
    id: 'journey_start',
    title: 'The Adventure Begins',
    description: 'Started the epic 31-state journey',
    icon: 'Play',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common'
  },
  {
    id: 'first_week',
    title: 'Week One Warrior',
    description: 'Completed the first week of adventure',
    icon: 'Calendar',
    progress: 1,
    total: 1,
    achieved: true,
    rarity: 'common'
  },
  {
    id: 'southern_sweep',
    title: 'Southern Explorer',
    description: 'Visited all southern states on the route',
    icon: 'Compass',
    progress: 8,
    total: 8,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'halfway_hero',
    title: 'Halfway Hero',
    description: 'Reached the halfway point of the journey',
    icon: 'Trophy',
    progress: 15,
    total: 15,
    achieved: true,
    rarity: 'epic'
  },
  {
    id: 'mountain_master',
    title: 'Mountain Master',
    description: 'Conquered the Rocky Mountain states',
    icon: 'Mountain',
    progress: 6,
    total: 6,
    achieved: true,
    rarity: 'rare'
  },
  {
    id: 'coast_to_coast',
    title: 'Coast to Coast Champion',
    description: 'Completed the entire cross-country journey',
    icon: 'Award',
    progress: 31,
    total: 31,
    achieved: true,
    rarity: 'legendary'
  }
];