// Mock data fallbacks for when APIs fail or hit rate limits
export const mockWeatherData = {
  coord: { lon: -97.3888, lat: 27.7418 },
  weather: [
    {
      id: 800,
      main: "Clear",
      description: "clear sky",
      icon: "01d",
    },
  ],
  main: {
    temp: 75.2,
    feels_like: 74.8,
    temp_min: 72.5,
    temp_max: 78.3,
    pressure: 1013,
    humidity: 65,
  },
  visibility: 10000,
  wind: { speed: 8.5, deg: 180 },
  clouds: { all: 0 },
  dt: Date.now() / 1000,
  sys: {
    country: "US",
    sunrise: 1234567890,
    sunset: 1234567890,
  },
  timezone: -21600,
  name: "Corpus Christi",
  _isMockData: true,
};

export const mockStationsData = {
  stations: [
    {
      id: "station-1",
      name: "Tesla Supercharger - Corpus Christi",
      latitude: 27.7477,
      longitude: -97.4014,
      address: "5488 S Padre Island Dr, Corpus Christi, TX 78411",
      distance: 2.3,
      available: 8,
      total: 12,
      power: 250,
    },
    {
      id: "station-2",
      name: "ChargePoint - HEB Plus",
      latitude: 27.7261,
      longitude: -97.3904,
      address: "1145 Waldron Rd, Corpus Christi, TX 78418",
      distance: 4.1,
      available: 2,
      total: 4,
      power: 150,
    },
    {
      id: "station-3",
      name: "Electrify America - Walmart",
      latitude: 27.6648,
      longitude: -97.3719,
      address: "4109 S Padre Island Dr, Corpus Christi, TX 78411",
      distance: 5.8,
      available: 3,
      total: 6,
      power: 350,
    },
  ],
  _isMockData: true,
};

export const mockTripData = {
  id: "48continental-2025",
  name: "The Wandering Whittle's 48 Continental Journey",
  description:
    "An epic road trip across all 48 continental United States in a Tesla, exploring the beauty and diversity of America.",
  startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
  endDate: new Date(Date.now() + 33 * 86400000).toISOString(),
  currentState: "Texas",
  stateMedia: {
    CA: {
      photos: [
        {
          url: "https://source.unsplash.com/800x600/?california,golden-gate-bridge",
          caption: "Golden Gate Bridge at sunset",
          timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          url: "https://source.unsplash.com/800x600/?california,yosemite",
          caption: "Yosemite National Park",
          timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
      ],
      videos: [
        {
          url: "https://example.com/videos/california-coast.mp4",
          thumbnail: "https://source.unsplash.com/800x600/?california,coast",
          caption: "Driving down the Pacific Coast Highway",
          duration: "2:15",
        },
      ],
    },
    NV: {
      photos: [
        {
          url: "https://source.unsplash.com/800x600/?nevada,las-vegas",
          caption: "Las Vegas Strip at night",
          timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
      ],
      videos: [
        {
          url: "https://example.com/videos/nevada-desert.mp4",
          thumbnail: "https://source.unsplash.com/800x600/?nevada,desert",
          caption: "Tesla crossing the Nevada desert",
          duration: "1:45",
        },
      ],
    },
    AZ: {
      photos: [
        {
          url: "https://source.unsplash.com/800x600/?arizona,grand-canyon",
          caption: "Grand Canyon sunrise",
          timestamp: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
      ],
      videos: [
        {
          url: "https://example.com/videos/arizona-sunset.mp4",
          thumbnail: "https://source.unsplash.com/800x600/?arizona,sunset",
          caption: "Sunset in the Sonoran Desert",
          duration: "3:00",
        },
      ],
    },
    TX: {
      photos: [
        {
          url: "https://source.unsplash.com/800x600/?texas,austin",
          caption: "Austin skyline",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          url: "https://source.unsplash.com/800x600/?texas,beach",
          caption: "Corpus Christi beach",
          timestamp: new Date().toISOString(),
        },
      ],
      videos: [
        {
          url: "https://example.com/videos/texas-gigafactory.mp4",
          thumbnail: "https://source.unsplash.com/800x600/?tesla,factory",
          caption: "Tour of Tesla Gigafactory Texas",
          duration: "4:30",
        },
      ],
    },
  },
  currentStop: {
    city: "Corpus Christi",
    state: "TX",
    date: new Date().toISOString(),
    dayNumber: 15,
  },
  nextStop: {
    city: "Houston",
    state: "TX",
    date: new Date(Date.now() + 86400000).toISOString(),
    dayNumber: 16,
  },
  distanceToNext: 210,
  durationToNext: 195, // minutes
  visitedStates: [
    "CA",
    "NV",
    "AZ",
    "NM",
    "TX",
    "OK",
    "KS",
    "CO",
    "WY",
    "MT",
    "ID",
    "UT",
    "OR",
    "WA",
  ],
  totalMiles: 4523,
  daysElapsed: 15,
  stats: {
    totalDistance: 4523,
    daysOnRoad: 15,
    chargingStops: 42,
    statesVisited: 14,
  },
  timeline: [
    {
      date: new Date(Date.now() - 15 * 86400000).toISOString(),
      location: "San Francisco, CA",
      description: "Started the journey from the Golden Gate Bridge",
      completed: true,
    },
    {
      date: new Date(Date.now() - 12 * 86400000).toISOString(),
      location: "Las Vegas, NV",
      description: "Explored the desert and charged at Tesla Supercharger",
      completed: true,
    },
    {
      date: new Date(Date.now() - 8 * 86400000).toISOString(),
      location: "Grand Canyon, AZ",
      description: "Witnessed one of nature's greatest wonders",
      completed: true,
    },
    {
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      location: "Austin, TX",
      description: "Visited Tesla Gigafactory Texas",
      completed: true,
    },
    {
      date: new Date().toISOString(),
      location: "Corpus Christi, TX",
      description: "Enjoying the Gulf Coast beaches",
      completed: false,
    },
    {
      date: new Date(Date.now() + 5 * 86400000).toISOString(),
      location: "New Orleans, LA",
      description: "Experience the vibrant culture and cuisine",
      completed: false,
    },
  ],
  stops: [
    {
      id: "stop-1",
      name: "Golden Gate Bridge",
      latitude: 37.8199,
      longitude: -122.4783,
      state: "CA",
      type: "waypoint",
      arrivalTime: new Date(Date.now() - 15 * 86400000).toISOString(),
      description: "Starting point of our epic journey",
      notes: "Perfect weather for the send-off!",
    },
    {
      id: "stop-2",
      name: "Tesla Supercharger Las Vegas",
      latitude: 36.1699,
      longitude: -115.1398,
      state: "NV",
      type: "charging",
      arrivalTime: new Date(Date.now() - 12 * 86400000).toISOString(),
      description: "Quick charge and lunch break",
      notes: "250kW charging speed",
    },
    {
      id: "stop-3",
      name: "Grand Canyon South Rim",
      latitude: 36.0544,
      longitude: -112.1401,
      state: "AZ",
      type: "overnight",
      arrivalTime: new Date(Date.now() - 8 * 86400000).toISOString(),
      description: "Overnight stay with sunrise viewing",
      notes: "Unforgettable sunrise at Hopi Point",
    },
    {
      id: "stop-4",
      name: "Tesla Gigafactory Texas",
      latitude: 30.2211,
      longitude: -97.6269,
      state: "TX",
      type: "waypoint",
      arrivalTime: new Date(Date.now() - 3 * 86400000).toISOString(),
      description: "Factory tour and charging",
      notes: "Amazing to see where our car was built!",
    },
    {
      id: "stop-5",
      name: "Corpus Christi Beach",
      latitude: 27.7418,
      longitude: -97.3888,
      state: "TX",
      type: "overnight",
      arrivalTime: new Date().toISOString(),
      description: "Current location - enjoying the coast",
      notes: "Beautiful sunset over the Gulf",
    },
  ],
  lastUpdated: new Date().toISOString(),
  _isMockData: true,
};

export const mockVehicleData = {
  location: {
    latitude: 27.741777,
    longitude: -97.388844,
  },
  battery: {
    level: 72,
    range: 218,
  },
  speed: 0,
  odometer: 15234,
  climate: {
    insideTemp: 72,
    outsideTemp: 78,
    isClimateOn: true,
  },
  charging: {
    isCharging: false,
    chargingState: "Disconnected",
    chargeRate: 0,
  },
  _isMockData: true,
};
