/** Types and loaders for pre-processed Tesla telemetry data */

export interface ChargingSession {
  start: string;
  end: string;
  durationMin: number;
  location: string;
  isSupercharger: boolean;
  energyAddedKwh: number;
  energyUsedKwh: number;
  startBattery: number;
  endBattery: number;
  costUsd: number;
  lat: number;
  lng: number;
}

export interface BatterySample {
  t: string;
  pct: number;
  range: number;
  state: string;
}

export interface ClimateSample {
  t: string;
  outsideF: number;
  insideF: number;
}

export interface DrivingSample {
  t: string;
  lat: number;
  lng: number;
  speed: number;
  odo: number;
}

export interface TripItineraryEntry {
  state: string;
  visits: number;
  locations: string;
  dates: string;
  peopleMet: string;
}

export interface DailyCharging {
  date: string;
  energyKwh: number;
  costUsd: number;
  durationMin: number;
  sessions: number;
}

export interface TripSummary {
  totalMiles: number;
  totalEnergyKwh: number;
  efficiencyWhPerMi: number;
  chargingSessions: number;
  totalCostUsd: number;
  avgCostPerSession: number;
  uniqueChargerLocations: number;
  tripDurationDays: number;
  statesVisited: number;
  peopleMet: number;
  costPerMile: number;
  avgCostPerKwh: number;
  batteryDegradation: string;
  rangeAt100Pct: string;
  maxCabinTempF: number;
}

export interface TripInsight {
  category: string;
  finding: string;
  detail: string;
  implication: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export function loadChargingSessions(): Promise<ChargingSession[]> {
  return fetchJson("/data/charging_sessions.json");
}

export function loadBatteryTimeline(): Promise<BatterySample[]> {
  return fetchJson("/data/battery_timeline.json");
}

export function loadClimateTimeline(): Promise<ClimateSample[]> {
  return fetchJson("/data/climate_timeline.json");
}

export function loadDrivingTimeline(): Promise<DrivingSample[]> {
  return fetchJson("/data/driving_timeline.json");
}

export function loadTripItinerary(): Promise<TripItineraryEntry[]> {
  return fetchJson("/data/trip_itinerary.json");
}

export function loadDailyCharging(): Promise<DailyCharging[]> {
  return fetchJson("/data/daily_charging.json");
}

export function loadTripSummary(): Promise<TripSummary> {
  return fetchJson("/data/trip_summary.json");
}

export function loadTripInsights(): Promise<TripInsight[]> {
  return fetchJson("/data/trip_insights.json");
}
