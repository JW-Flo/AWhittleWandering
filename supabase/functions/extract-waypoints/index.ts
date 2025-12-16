import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryPoint {
  timestamp: string;
  lat: number;
  lng: number;
  elevation: number;
  speed: number;
  odometer: number;
  batteryLevel: number;
  chargingState: string;
}

interface ExtractedStop {
  lat: number;
  lng: number;
  elevation: number;
  arrivalTime: string;
  departureTime: string;
  dwellMinutes: number;
  odometer: number;
  wasCharging: boolean;
  minBattery: number;
  maxBattery: number;
}

// Haversine distance in miles
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCSV(csvText: string): TelemetryPoint[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const points: TelemetryPoint[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    
    const lat = parseFloat(row['Latitude']);
    const lng = parseFloat(row['Longitude']);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      points.push({
        timestamp: row['Timestamp (CST)'],
        lat,
        lng,
        elevation: parseFloat(row['Elevation (m)']) || 0,
        speed: parseFloat(row['Speed (mph)']) || 0,
        odometer: parseFloat(row['Odometer (mi)']) || 0,
        batteryLevel: parseFloat(row['Battery Level (%)']) || 0,
        chargingState: row['Charging State'] || 'Disconnected',
      });
    }
  }
  
  return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function extractSignificantStops(points: TelemetryPoint[], minDwellMinutes: number = 30): ExtractedStop[] {
  if (points.length === 0) return [];
  
  const stops: ExtractedStop[] = [];
  const LOCATION_THRESHOLD_MILES = 0.5; // Points within 0.5 miles are same location
  
  let stopStart: TelemetryPoint | null = null;
  let stopPoints: TelemetryPoint[] = [];
  let wasCharging = false;
  let minBattery = 100;
  let maxBattery = 0;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    if (point.speed === 0) {
      // Vehicle is stationary
      if (!stopStart) {
        stopStart = point;
        stopPoints = [point];
        wasCharging = point.chargingState === 'Charging';
        minBattery = point.batteryLevel;
        maxBattery = point.batteryLevel;
      } else {
        // Check if still at same location
        const dist = calculateDistance(stopStart.lat, stopStart.lng, point.lat, point.lng);
        if (dist < LOCATION_THRESHOLD_MILES) {
          stopPoints.push(point);
          if (point.chargingState === 'Charging') wasCharging = true;
          minBattery = Math.min(minBattery, point.batteryLevel);
          maxBattery = Math.max(maxBattery, point.batteryLevel);
        } else {
          // Different location - finalize previous stop
          if (stopPoints.length > 1) {
            const firstPoint = stopPoints[0];
            const lastPoint = stopPoints[stopPoints.length - 1];
            const dwellMinutes = (new Date(lastPoint.timestamp).getTime() - new Date(firstPoint.timestamp).getTime()) / 60000;
            
            if (dwellMinutes >= minDwellMinutes) {
              // Calculate average position
              const avgLat = stopPoints.reduce((s, p) => s + p.lat, 0) / stopPoints.length;
              const avgLng = stopPoints.reduce((s, p) => s + p.lng, 0) / stopPoints.length;
              const avgElevation = stopPoints.reduce((s, p) => s + p.elevation, 0) / stopPoints.length;
              
              stops.push({
                lat: avgLat,
                lng: avgLng,
                elevation: Math.round(avgElevation * 3.281), // meters to feet
                arrivalTime: firstPoint.timestamp,
                departureTime: lastPoint.timestamp,
                dwellMinutes: Math.round(dwellMinutes),
                odometer: lastPoint.odometer,
                wasCharging,
                minBattery,
                maxBattery,
              });
            }
          }
          
          // Start new stop
          stopStart = point;
          stopPoints = [point];
          wasCharging = point.chargingState === 'Charging';
          minBattery = point.batteryLevel;
          maxBattery = point.batteryLevel;
        }
      }
    } else {
      // Vehicle is moving - finalize any current stop
      if (stopStart && stopPoints.length > 1) {
        const firstPoint = stopPoints[0];
        const lastPoint = stopPoints[stopPoints.length - 1];
        const dwellMinutes = (new Date(lastPoint.timestamp).getTime() - new Date(firstPoint.timestamp).getTime()) / 60000;
        
        if (dwellMinutes >= minDwellMinutes) {
          const avgLat = stopPoints.reduce((s, p) => s + p.lat, 0) / stopPoints.length;
          const avgLng = stopPoints.reduce((s, p) => s + p.lng, 0) / stopPoints.length;
          const avgElevation = stopPoints.reduce((s, p) => s + p.elevation, 0) / stopPoints.length;
          
          stops.push({
            lat: avgLat,
            lng: avgLng,
            elevation: Math.round(avgElevation * 3.281),
            arrivalTime: firstPoint.timestamp,
            departureTime: lastPoint.timestamp,
            dwellMinutes: Math.round(dwellMinutes),
            odometer: lastPoint.odometer,
            wasCharging,
            minBattery,
            maxBattery,
          });
        }
      }
      stopStart = null;
      stopPoints = [];
    }
  }
  
  // Don't forget the last stop if vehicle ended stationary
  if (stopStart && stopPoints.length > 1) {
    const firstPoint = stopPoints[0];
    const lastPoint = stopPoints[stopPoints.length - 1];
    const dwellMinutes = (new Date(lastPoint.timestamp).getTime() - new Date(firstPoint.timestamp).getTime()) / 60000;
    
    if (dwellMinutes >= minDwellMinutes) {
      const avgLat = stopPoints.reduce((s, p) => s + p.lat, 0) / stopPoints.length;
      const avgLng = stopPoints.reduce((s, p) => s + p.lng, 0) / stopPoints.length;
      const avgElevation = stopPoints.reduce((s, p) => s + p.elevation, 0) / stopPoints.length;
      
      stops.push({
        lat: avgLat,
        lng: avgLng,
        elevation: Math.round(avgElevation * 3.281),
        arrivalTime: firstPoint.timestamp,
        departureTime: lastPoint.timestamp,
        dwellMinutes: Math.round(dwellMinutes),
        odometer: lastPoint.odometer,
        wasCharging,
        minBattery,
        maxBattery,
      });
    }
  }
  
  return stops;
}

// Merge stops that are very close together (within 1 mile)
function mergeNearbyStops(stops: ExtractedStop[]): ExtractedStop[] {
  if (stops.length === 0) return [];
  
  const merged: ExtractedStop[] = [];
  let current = { ...stops[0] };
  
  for (let i = 1; i < stops.length; i++) {
    const next = stops[i];
    const dist = calculateDistance(current.lat, current.lng, next.lat, next.lng);
    
    // If within 1 mile and gap is less than 2 hours, merge
    const gapHours = (new Date(next.arrivalTime).getTime() - new Date(current.departureTime).getTime()) / 3600000;
    
    if (dist < 1.0 && gapHours < 2) {
      // Merge: keep first arrival, use last departure
      current.departureTime = next.departureTime;
      current.dwellMinutes = Math.round((new Date(current.departureTime).getTime() - new Date(current.arrivalTime).getTime()) / 60000);
      current.wasCharging = current.wasCharging || next.wasCharging;
      current.minBattery = Math.min(current.minBattery, next.minBattery);
      current.maxBattery = Math.max(current.maxBattery, next.maxBattery);
      current.odometer = next.odometer;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  
  return merged;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { csvData, minDwellMinutes = 30 } = await req.json();
    
    if (!csvData) {
      return new Response(
        JSON.stringify({ error: 'csvData is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Parsing CSV data...');
    const points = parseCSV(csvData);
    console.log(`Parsed ${points.length} telemetry points`);
    
    console.log('Extracting significant stops...');
    const stops = extractSignificantStops(points, minDwellMinutes);
    console.log(`Found ${stops.length} initial stops`);
    
    console.log('Merging nearby stops...');
    const mergedStops = mergeNearbyStops(stops);
    console.log(`Merged to ${mergedStops.length} stops`);
    
    // Calculate journey stats
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const totalMiles = lastPoint ? lastPoint.odometer - (firstPoint?.odometer || 0) : 0;
    
    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalPoints: points.length,
          dateRange: {
            start: firstPoint?.timestamp,
            end: lastPoint?.timestamp,
          },
          totalMiles: Math.round(totalMiles),
          startOdometer: firstPoint?.odometer,
          endOdometer: lastPoint?.odometer,
        },
        stops: mergedStops,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error extracting waypoints:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
