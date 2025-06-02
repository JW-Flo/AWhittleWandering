export interface Location {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  conditions: string[];
}

export interface RouteSegment {
  start: Location;
  end: Location;
  distance: number;
  estimatedConsumption: number;
}

export interface Route {
  segments: RouteSegment[];
  totalDistance: number;
  totalConsumption: number;
}

export interface WeatherRiskResponse {
  location: Location;
  weather: WeatherData;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface RouteResponse {
  route: Route;
  weatherRisks: WeatherRiskResponse[];
  alternativeRoutes?: Route[];
}
