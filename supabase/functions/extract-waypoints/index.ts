import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TessieDrive {
  id: number;
  started_at: number;
  ended_at: number;
  starting_latitude: number;
  starting_longitude: number;
  starting_location: string;
  starting_odometer: number;
  ending_latitude: number;
  ending_longitude: number;
  ending_location: string;
  ending_odometer: number;
  odometer_distance: number;
  energy_used: number;
  average_speed: number;
  max_speed: number;
  starting_battery: number;
  ending_battery: number;
}

interface Waypoint {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  arrivedAt: string;
  departedAt: string;
  dwellTimeMinutes: number;
  odometerMiles: number;
  distanceSinceLastStop: number;
  batteryOnArrival: number;
}

// Haversine distance in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Extract city/state from location string
function extractLocationName(location: string): string {
  const parts = location.split(', ');
  if (parts.length >= 3) {
    const city = parts[parts.length - 3];
    const stateZip = parts[parts.length - 2];
    const state = stateZip.split(' ')[0];
    return `${city}, ${state}`;
  }
  return location;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TESSIE_API_KEY = Deno.env.get('TESSIE_API_KEY');
    if (!TESSIE_API_KEY) {
      throw new Error('TESSIE_API_KEY is not configured');
    }

    const { vin, fromDate, toDate, minDwellMinutes = 30, minDistanceMiles = 50 } = await req.json();
    
    if (!vin) {
      throw new Error('VIN is required');
    }

    console.log(`Extracting waypoints for VIN ${vin} from ${fromDate} to ${toDate}`);

    // Fetch drives from Tessie API
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate.toString());
    if (toDate) params.append('to', toDate.toString());

    const drivesUrl = `https://api.tessie.com/${vin}/drives?${params.toString()}`;
    console.log(`Fetching drives from: ${drivesUrl}`);

    const response = await fetch(drivesUrl, {
      headers: {
        'Authorization': `Bearer ${TESSIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tessie API error: ${response.status} ${errorText}`);
      throw new Error(`Tessie API error: ${response.status}`);
    }

    const data = await response.json();
    const drives: TessieDrive[] = data.results || [];
    
    console.log(`Retrieved ${drives.length} drives from Tessie`);

    if (drives.length === 0) {
      return new Response(JSON.stringify({ waypoints: [], totalDrives: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sort drives chronologically (oldest first)
    drives.sort((a, b) => a.started_at - b.started_at);

    // Group stops: identify significant stopping points
    const waypoints: Waypoint[] = [];
    let waypointId = 1;
    let lastLocation = { lat: 0, lon: 0 };
    let cumulativeDistance = 0;

    for (let i = 0; i < drives.length; i++) {
      const drive = drives[i];
      const nextDrive = drives[i + 1];

      // Calculate dwell time at end of this drive
      let dwellMinutes = 0;
      if (nextDrive) {
        dwellMinutes = (nextDrive.started_at - drive.ended_at) / 60;
      }

      // Calculate distance from last waypoint
      const distanceFromLast = lastLocation.lat !== 0 
        ? haversineDistance(lastLocation.lat, lastLocation.lon, drive.ending_latitude, drive.ending_longitude)
        : 0;

      cumulativeDistance += drive.odometer_distance;

      // A significant stop: either long dwell time OR significant distance from last waypoint
      const isSignificantStop = dwellMinutes >= minDwellMinutes || 
        (distanceFromLast >= minDistanceMiles && dwellMinutes >= 15) ||
        i === drives.length - 1; // Always include final destination

      if (isSignificantStop && drive.ending_latitude && drive.ending_longitude) {
        // Check if this is too close to the last waypoint (merge if < 2 miles)
        const lastWaypoint = waypoints[waypoints.length - 1];
        if (lastWaypoint) {
          const distToLast = haversineDistance(
            lastWaypoint.latitude, lastWaypoint.longitude,
            drive.ending_latitude, drive.ending_longitude
          );
          if (distToLast < 2) {
            // Merge: update departure time and dwell time
            lastWaypoint.departedAt = nextDrive 
              ? new Date(nextDrive.started_at * 1000).toISOString()
              : new Date(drive.ended_at * 1000).toISOString();
            lastWaypoint.dwellTimeMinutes += dwellMinutes;
            continue;
          }
        }

        const waypoint: Waypoint = {
          id: waypointId++,
          name: extractLocationName(drive.ending_location),
          location: drive.ending_location,
          latitude: drive.ending_latitude,
          longitude: drive.ending_longitude,
          arrivedAt: new Date(drive.ended_at * 1000).toISOString(),
          departedAt: nextDrive 
            ? new Date(nextDrive.started_at * 1000).toISOString()
            : new Date(drive.ended_at * 1000).toISOString(),
          dwellTimeMinutes: Math.round(dwellMinutes),
          odometerMiles: Math.round(drive.ending_odometer),
          distanceSinceLastStop: Math.round(cumulativeDistance),
          batteryOnArrival: drive.ending_battery,
        };

        waypoints.push(waypoint);
        lastLocation = { lat: drive.ending_latitude, lon: drive.ending_longitude };
        cumulativeDistance = 0;
      }
    }

    // Calculate journey statistics
    const totalMiles = drives.length > 0 
      ? drives[drives.length - 1].ending_odometer - drives[0].starting_odometer 
      : 0;
    const totalEnergy = drives.reduce((sum, d) => sum + (d.energy_used || 0), 0);
    const journeyStart = new Date(drives[0].started_at * 1000).toISOString();
    const journeyEnd = new Date(drives[drives.length - 1].ended_at * 1000).toISOString();

    console.log(`Extracted ${waypoints.length} waypoints, ${Math.round(totalMiles)} total miles`);

    return new Response(JSON.stringify({
      waypoints,
      statistics: {
        totalDrives: drives.length,
        totalWaypoints: waypoints.length,
        totalMiles: Math.round(totalMiles),
        totalEnergyKwh: Math.round(totalEnergy * 10) / 10,
        efficiencyWhMi: totalMiles > 0 ? Math.round((totalEnergy * 1000) / totalMiles) : 0,
        journeyStart,
        journeyEnd,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Extract waypoints error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
