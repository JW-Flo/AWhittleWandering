// Mock data fallbacks for when APIs fail or hit rate limits
export const mockWeatherData = {
  coord: { lon: -97.3888, lat: 27.7418 },
  weather: [
    { 
      id: 800, 
      main: "Clear", 
      description: "clear sky", 
      icon: "01d" 
    }
  ],
  main: {
    temp: 75.2,
    feels_like: 74.8,
    temp_min: 72.5,
    temp_max: 78.3,
    pressure: 1013,
    humidity: 65
  },
  visibility: 10000,
  wind: { speed: 8.5, deg: 180 },
  clouds: { all: 0 },
  dt: Date.now() / 1000,
  sys: { 
    country: "US", 
    sunrise: 1234567890, 
    sunset: 1234567890 
  },
  timezone: -21600,
  name: "Corpus Christi",
  _isMockData: true
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
      power: 250
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
      power: 150
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
      power: 350
    }
  ],
  _isMockData: true
};

export const mockTripData = {
  currentStop: {
    city: "Corpus Christi",
    state: "TX",
    date: new Date().toISOString(),
    dayNumber: 15
  },
  nextStop: {
    city: "Houston", 
    state: "TX",
    date: new Date(Date.now() + 86400000).toISOString(),
    dayNumber: 16
  },
  visitedStates: [
    "CA", "NV", "AZ", "NM", "TX", "OK", "KS", "CO", 
    "WY", "MT", "ID", "UT", "OR", "WA"
  ],
  totalMiles: 4523,
  daysElapsed: 15,
  _isMockData: true
};

export const mockVehicleData = {
  location: {
    latitude: 27.741777,
    longitude: -97.388844
  },
  battery: {
    level: 72,
    range: 218
  },
  speed: 0,
  odometer: 15234,
  climate: {
    insideTemp: 72,
    outsideTemp: 78,
    isClimateOn: true
  },
  charging: {
    isCharging: false,
    chargingState: "Disconnected",
    chargeRate: 0
  },
  _isMockData: true
};
