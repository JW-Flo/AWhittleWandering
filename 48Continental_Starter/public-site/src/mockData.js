/**
 * Mock Data for The Wandering Whittle
 * 
 * This file provides static mock data for development and fallback purposes
 * when the real-time APIs are not available.
 */

// Mock vehicle data
export const mockVehicleData = {
  id: "vehicle_12345",
  name: "The Wandering Whittle Tesla",
  model: "Model Y",
  year: 2023,
  location: {
    latitude: 39.8283,
    longitude: -98.5795, // Geographic center of the continental US
    heading: 90,
    speed: 65
  },
  battery: {
    level: 76,
    range: 218,
    charging: false,
    timeToFullCharge: null,
    chargeRate: null
  },
  climate: {
    insideTemp: 72,
    outsideTemp: 68,
    driverTemp: 70,
    passengerTemp: 70,
    isClimateOn: true
  },
  status: {
    locked: true,
    sentry_mode: true,
    windows_open: false,
    doors_open: false,
    trunk_open: false,
    frunk_open: false,
    is_user_present: true
  },
  odometer: 12876,
  lastUpdated: new Date().toISOString()
};

// Mock weather data
export const mockWeatherData = {
  location: "Lebanon, Kansas", // Near geographic center of continental US
  current: {
    temp: 68,
    feels_like: 66,
    humidity: 45,
    wind_speed: 8,
    wind_direction: "NE",
    conditions: "Partly Cloudy",
    icon: "partly-cloudy-day"
  },
  forecast: [
    {
      day: "Today",
      high: 72,
      low: 55,
      conditions: "Partly Cloudy",
      icon: "partly-cloudy-day",
      precipitation: 10
    },
    {
      day: "Tomorrow",
      high: 75,
      low: 57,
      conditions: "Sunny",
      icon: "clear-day",
      precipitation: 0
    },
    {
      day: "Wednesday",
      high: 68,
      low: 54,
      conditions: "Scattered Showers",
      icon: "rain",
      precipitation: 40
    }
  ],
  alerts: [],
  lastUpdated: new Date().toISOString()
};

// Mock trip data
export const mockTripData = {
  name: "The Great American Road Trip",
  currentState: "Kansas",
  nextStop: "Denver, Colorado",
  distanceToNext: 428,
  visitedStates: [
    "New York", "Pennsylvania", "Ohio", "Indiana", 
    "Illinois", "Missouri", "Kansas"
  ],
  totalStateCount: 7,
  totalDistance: 1247,
  startDate: "2025-05-25T00:00:00Z",
  estimatedEndDate: "2025-07-24T00:00:00Z",
  daysOnRoad: 9,
  daysRemaining: 51,
  currentLeg: {
    from: "Kansas City, Missouri",
    to: "Denver, Colorado",
    distance: 600,
    duration: "8 hours 45 minutes",
    departureTime: "2025-06-03T09:00:00Z",
    estimatedArrival: "2025-06-03T17:45:00Z"
  },
  milestones: [
    {
      description: "Easternmost Point",
      location: "Cape Cod, Massachusetts",
      date: "2025-05-28T14:30:00Z",
      completed: true
    },
    {
      description: "Southernmost Point",
      location: "Key West, Florida",
      date: "2025-06-18T12:00:00Z",
      completed: false
    },
    {
      description: "Westernmost Point",
      location: "Cape Alava, Washington",
      date: "2025-07-02T15:00:00Z",
      completed: false
    },
    {
      description: "Northernmost Point",
      location: "Northwest Angle, Minnesota",
      date: "2025-07-15T11:00:00Z",
      completed: false
    }
  ],
  lastUpdated: new Date().toISOString()
};

// Mock charging stations data
export const mockStationsData = {
  stations: [
    {
      id: "station_1",
      name: "Lebanon Supercharger",
      location: {
        latitude: 39.8283,
        longitude: -98.5795
      },
      available: true,
      stalls: 8,
      stallsAvailable: 5,
      distance: 0.8,
      power: 250,
      amenities: ["Restrooms", "Food", "Shopping"]
    },
    {
      id: "station_2",
      name: "Salina Supercharger",
      location: {
        latitude: 38.8403,
        longitude: -97.6114
      },
      available: true,
      stalls: 12,
      stallsAvailable: 9,
      distance: 58.2,
      power: 250,
      amenities: ["Restrooms", "Food", "WiFi"]
    },
    {
      id: "station_3",
      name: "Hays Destination Charger",
      location: {
        latitude: 38.8792,
        longitude: -99.3268
      },
      available: true,
      stalls: 4,
      stallsAvailable: 2,
      distance: 65.1,
      power: 80,
      amenities: ["Restrooms", "Lodging"]
    }
  ],
  radius: 75,
  lastUpdated: new Date().toISOString()
};
