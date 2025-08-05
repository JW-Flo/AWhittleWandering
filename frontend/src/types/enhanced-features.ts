// Enhanced Features Type Definitions for Multi-Track Development
// Track 1: Enhanced Map Features
export interface RouteOptimization {
  originalRoute: Coordinate[];
  optimizedRoute: Coordinate[];
  energySavings: number;
  timeSavings: number;
  chargingStops: ChargingStop[];
}

export interface SmartChargingRecommendation {
  stationId: string;
  location: Coordinate;
  arrivalSoC: number;
  targetSoC: number;
  chargingTime: number;
  cost: number;
  amenities: string[];
  confidence: number;
}

export interface TripRecommendation {
  id: string;
  title: string;
  description: string;
  route: Coordinate[];
  estimatedDuration: number;
  highlights: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  energyRequirement: number;
}

// Track 2: Advanced Analytics Dashboard
export interface JourneyInsights {
  totalDistance: number;
  totalEnergy: number;
  averageEfficiency: number;
  carbonSaved: number;
  costSavings: number;
  favoriteRoutes: RouteAnalytics[];
  chargingPatterns: ChargingAnalytics[];
  seasonalTrends: SeasonalData[];
}

export interface RouteAnalytics {
  routeId: string;
  frequency: number;
  averageTime: number;
  averageEnergy: number;
  bestEfficiency: number;
  worstEfficiency: number;
  weatherImpact: WeatherImpact[];
}

export interface ChargingAnalytics {
  stationId: string;
  frequency: number;
  averageTime: number;
  averageCost: number;
  peakUsageTimes: string[];
  satisfaction: number;
}

export interface EnergyEfficiencyAnalysis {
  currentTrip: EfficiencyMetrics;
  historicalAverage: EfficiencyMetrics;
  comparison: ComparisonMetrics;
  recommendations: EfficiencyRecommendation[];
}

// Track 3: AI-Powered Journey Assistant
export interface JourneyAssistant {
  planTrip: (request: TripPlanningRequest) => Promise<TripPlan>;
  analyzeRoute: (route: Coordinate[]) => Promise<RouteAnalysis>;
  predictMaintenance: (vehicleData: VehicleData) => Promise<MaintenanceAlert[]>;
  optimizeRoute: (currentRoute: Coordinate[], preferences: RoutePreferences) => Promise<RouteOptimization>;
}

export interface TripPlanningRequest {
  destination: string;
  departureTime?: Date;
  preferences: TripPreferences;
  constraints: TripConstraints;
}

export interface TripPreferences {
  prioritizeTime: boolean;
  prioritizeEnergy: boolean;
  prioritizeScenery: boolean;
  avoidHighways: boolean;
  includeCharging: boolean;
  stopPreferences: StopPreferences;
}

export interface MaintenanceAlert {
  type: 'tire' | 'battery' | 'brake' | 'service';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  estimatedMiles: number;
  confidence: number;
}

// Track 4: UX Enhancements
export interface RealTimeStream {
  vehicleLocation: Coordinate;
  batteryLevel: number;
  chargingStatus: ChargingStatus;
  speed: number;
  heading: number;
  timestamp: Date;
}

export interface InteractiveTimelineEvent {
  id: string;
  type: 'drive' | 'charge' | 'stop' | 'milestone';
  timestamp: Date;
  location: Coordinate;
  details: Record<string, unknown>;
  media?: MediaItem[];
  interactive: boolean;
  expandable: boolean;
}

export interface SocialShareData {
  tripId: string;
  title: string;
  description: string;
  image: string;
  statistics: TripStatistics;
  route: Coordinate[];
  privacy: 'public' | 'friends' | 'private';
}

export interface NotificationPreferences {
  chargingAlerts: boolean;
  routeUpdates: boolean;
  maintenanceReminders: boolean;
  energyInsights: boolean;
  socialUpdates: boolean;
  realTimeTracking: boolean;
}

// Shared Types
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ChargingStop {
  stationId: string;
  location: Coordinate;
  arrivalTime: Date;
  departureTime: Date;
  energyAdded: number;
  cost: number;
}

export interface WeatherImpact {
  condition: string;
  temperatureRange: [number, number];
  efficiencyImpact: number;
  recommendations: string[];
}

export interface EfficiencyMetrics {
  milesPerKwh: number;
  energyConsumption: number;
  regenEfficiency: number;
  climateImpact: number;
}

export interface ComparisonMetrics {
  efficiencyDelta: number;
  energyDelta: number;
  costDelta: number;
  timeImpact: number;
}

export interface EfficiencyRecommendation {
  type: 'driving' | 'climate' | 'route' | 'timing';
  description: string;
  expectedImprovement: number;
  difficulty: 'easy' | 'moderate' | 'hard';
}

// Additional missing types
export interface SeasonalData {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  averageEfficiency: number;
  tripCount: number;
  energyUsage: number;
  insights: string[];
}

export interface TripPlan {
  id: string;
  route: Coordinate[];
  chargingStops: ChargingStop[];
  estimatedTime: number;
  estimatedEnergy: number;
  alternatives: TripPlan[];
}

export interface RouteAnalysis {
  efficiency: number;
  energyRequired: number;
  chargingNeeded: boolean;
  weatherImpacts: WeatherImpact[];
  recommendations: string[];
}

export interface VehicleData {
  batteryLevel: number;
  range: number;
  odometer: number;
  efficiency: number;
  temperature: number;
}

export interface RoutePreferences {
  fastestRoute: boolean;
  mostEfficient: boolean;
  scenic: boolean;
  avoidTolls: boolean;
  maxChargingStops: number;
}

export interface TripConstraints {
  maxDuration: number;
  minBatteryLevel: number;
  requiredStops: string[];
  avoidAreas: Coordinate[];
}

export interface StopPreferences {
  food: boolean;
  restrooms: boolean;
  shopping: boolean;
  lodging: boolean;
  entertainment: boolean;
}

export interface ChargingStatus {
  isCharging: boolean;
  chargeRate: number;
  timeToComplete: number;
  targetLevel: number;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  timestamp: Date;
}

export interface TripStatistics {
  distance: number;
  duration: number;
  energyUsed: number;
  efficiency: number;
  chargingStops: number;
  cost: number;
}
