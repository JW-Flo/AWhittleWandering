/** Types and loaders for pre-processed Tesla telemetry data */

export interface ChargingSession {
  start: string;
  end: string;
  durationMin: number;
  startBattery: number;
  endBattery: number;
  energyAdded: number;
  peakPowerKw: number;
  lat: number;
  lng: number;
  isSupercharger: boolean;
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
