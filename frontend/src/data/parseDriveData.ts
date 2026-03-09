/** Parsed row from the Tessie/TeslaFi drive data CSV */
export interface DriveRow {
  startedAt: string;
  endedAt: string;
  durationMin: number;
  startLocation: string;
  startLat: number;
  startLng: number;
  startOdometer: number;
  endLocation: string;
  endLat: number;
  endLng: number;
  endOdometer: number;
  distanceMi: number;
  startBattery: number;
  endBattery: number;
  avgSpeedMph: number;
  energyKwh: number;
}

/** A point on the route polyline */
export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
  odometer: number;
}

/** A significant stop along the trip */
export interface TripStop {
  lat: number;
  lng: number;
  location: string;
  state: string;
  arrivedAt: string;
  departedAt: string;
  dwellMinutes: number;
}

/** Parse the drives CSV text into structured rows */
export function parseDriveCsv(text: string): DriveRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Simple CSV parse that handles quoted fields with commas
  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  };

  return lines.slice(1).map((line) => {
    const f = parseRow(line);
    return {
      startedAt: f[0] ?? "",
      endedAt: f[1] ?? "",
      durationMin: parseFloat(f[3]) || 0,
      startLocation: f[4] ?? "",
      startLat: parseFloat(f[6]) || 0,
      startLng: parseFloat(f[7]) || 0,
      startOdometer: parseFloat(f[8]) || 0,
      endLocation: f[9] ?? "",
      endLat: parseFloat(f[11]) || 0,
      endLng: parseFloat(f[12]) || 0,
      endOdometer: parseFloat(f[13]) || 0,
      distanceMi: parseFloat(f[22]) || 0,
      startBattery: parseFloat(f[14]) || 0,
      endBattery: parseFloat(f[15]) || 0,
      avgSpeedMph: parseFloat(f[18]) || 0,
      energyKwh: parseFloat(f[23]) || 0,
    };
  });
}

/** Extract an ordered route polyline from drive data */
export function extractRoute(drives: DriveRow[]): RoutePoint[] {
  const points: RoutePoint[] = [];

  for (const d of drives) {
    if (d.startLat === 0 && d.startLng === 0) continue;

    // Add start point of each drive
    points.push({
      lat: d.startLat,
      lng: d.startLng,
      timestamp: d.startedAt,
      odometer: d.startOdometer,
    });
  }

  // Add the final endpoint
  const last = drives[drives.length - 1];
  if (last && (last.endLat !== 0 || last.endLng !== 0)) {
    points.push({
      lat: last.endLat,
      lng: last.endLng,
      timestamp: last.endedAt,
      odometer: last.endOdometer,
    });
  }

  return points;
}

/** Haversine distance in miles */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Extract state from a location string like "..., Texas 78411, United States" */
function extractState(location: string): string {
  const match = location.match(/, ([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+\d{5}/);
  return match?.[1] ?? "";
}

/**
 * Identify significant stops: places where the car was stationary for a while
 * between drives, at least `minDwellMin` minutes and `minDistMi` miles from
 * the previous stop.
 */
export function extractStops(
  drives: DriveRow[],
  minDwellMin = 60,
  minDistMi = 5,
): TripStop[] {
  const stops: TripStop[] = [];
  let lastStopLat = 0;
  let lastStopLng = 0;

  for (let i = 0; i < drives.length - 1; i++) {
    const current = drives[i];
    const next = drives[i + 1];

    // Gap between end of current drive and start of next drive
    const endTime = new Date(current.endedAt.replace(" ", "T") + ":00").getTime();
    const nextStart = new Date(next.startedAt.replace(" ", "T") + ":00").getTime();
    const dwellMin = (nextStart - endTime) / 60000;

    if (dwellMin < minDwellMin) continue;

    const lat = current.endLat;
    const lng = current.endLng;
    if (lat === 0 && lng === 0) continue;

    // Skip if too close to last stop (same parking lot)
    if (lastStopLat !== 0 && haversine(lat, lng, lastStopLat, lastStopLng) < minDistMi) {
      continue;
    }

    stops.push({
      lat,
      lng,
      location: current.endLocation,
      state: extractState(current.endLocation),
      arrivedAt: current.endedAt,
      departedAt: next.startedAt,
      dwellMinutes: Math.round(dwellMin),
    });

    lastStopLat = lat;
    lastStopLng = lng;
  }

  return stops;
}

/** Simplify the route by keeping every Nth point (or points far enough apart) */
export function simplifyRoute(points: RoutePoint[], maxPoints = 500): RoutePoint[] {
  if (points.length <= maxPoints) return points;

  // Keep every Nth point, always keep first and last
  const step = Math.ceil(points.length / maxPoints);
  const result: RoutePoint[] = [points[0]];

  for (let i = step; i < points.length - 1; i += step) {
    result.push(points[i]);
  }

  result.push(points[points.length - 1]);
  return result;
}
