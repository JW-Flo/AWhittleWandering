// Advanced Feature Types for Multi-Track Development
export interface RouteOptimization {
  id: string;
  route: [number, number][];
  efficiency: number;
  estimatedTime: number;
  chargingStops: ChargingStop[];
  weatherFactors: WeatherFactor[];
}

export interface ChargingStop {
  id: string;
  location: [number, number];
  name: string;
  powerKw: number;
  estimatedChargingTime: number;
  cost: number;
  availability: 'available' | 'busy' | 'offline';
}

export interface WeatherFactor {
  location: [number, number];
  temperature: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface JourneyAnalytics {
  totalDistance: number;
  totalTime: number;
  energyEfficiency: number;
  costAnalysis: CostAnalysis;
  comparisonMetrics: ComparisonMetrics;
  insights: AIInsight[];
}

export interface CostAnalysis {
  electricityCost: number;
  gasolineEquivalent: number;
  savings: number;
  carbonFootprint: number;
}

export interface ComparisonMetrics {
  previousTrips: TripComparison[];
  benchmarks: Benchmark[];
  improvements: string[];
}

export interface TripComparison {
  date: string;
  efficiency: number;
  cost: number;
  duration: number;
}

export interface Benchmark {
  category: string;
  userValue: number;
  averageValue: number;
  percentile: number;
}

export interface AIInsight {
  id: string;
  type: 'efficiency' | 'route' | 'charging' | 'maintenance' | 'weather';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
}

export interface JourneyAssistant {
  currentQuery: string;
  suggestions: AISuggestion[];
  context: JourneyContext;
  capabilities: AssistantCapability[];
}

export interface AISuggestion {
  id: string;
  text: string;
  confidence: number;
  category: 'route' | 'timing' | 'charging' | 'weather' | 'maintenance';
  actionable: boolean;
}

export interface JourneyContext {
  currentLocation: [number, number];
  destination?: [number, number];
  batteryLevel: number;
  weatherConditions: WeatherFactor;
  timeOfDay: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AssistantCapability {
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
}

export interface UXEnhancement {
  realTimeUpdates: boolean;
  interactiveTimeline: boolean;
  socialSharing: boolean;
  notificationPreferences: NotificationSettings;
}

export interface NotificationSettings {
  chargingAlerts: boolean;
  routeUpdates: boolean;
  weatherWarnings: boolean;
  maintenanceReminders: boolean;
  efficiencyTips: boolean;
}
