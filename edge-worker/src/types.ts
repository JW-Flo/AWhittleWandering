export interface Location {
  latitude: number;
  longitude: number;
}

export interface Weather {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string[];
}

export interface WeatherRiskResponse {
  location: Location;
  riskLevel: 'low' | 'medium' | 'high';
  weather: Weather;
  recommendations: string[];
  isFavorableForEV?: boolean;
}

export interface RouteSegment {
  start: Location;
  end: Location;
  distance: number;
  duration: number;
  weatherRisk: number;
}

export interface Route {
  segments: RouteSegment[];
  coordinates: Location[];
  totalDistance: number;
  totalDuration: number;
  weatherRisk: number;
  totalConsumption: number;
  requiredStops: number;
}

export interface RouteResponse {
  route: Route;
  alternatives: Route[];
}
