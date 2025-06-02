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
    chargingStops: Location[];
    weatherConditions: WeatherData[];
}

export interface WeatherRisk {
    severity: number;
    conditions: string[];
    location: Location;
}

export interface OptimizedRoute {
    route: Route;
    weatherAdjustedRange: number;
}

export interface WeatherRiskResponse {
    risk: WeatherRisk;
    conditions: WeatherData;
}

export interface RouteResponse extends OptimizedRoute {}
