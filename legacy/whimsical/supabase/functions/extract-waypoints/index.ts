import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TessieDrive {
  id: string;
  started_at: string;
  ended_at: string;
  starting_latitude: number;
  starting_longitude: number;
  starting_location: string;
  ending_latitude: number;
  ending_longitude: number;
  ending_location: string;
  ending_battery: number | null;
  ending_odometer: number | null;
  energy_used: number | null;
}

interface ExtractedWaypoint {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  state_code: string;
  arrived_at: string;
  departed_at: string | null;
  dwell_minutes: number;
  battery_on_arrival: number | null;
  odometer_miles: number | null;
  waypoint_type: 'stop' | 'charging' | 'overnight' | 'destination';
  drive_count: number;
}

// Haversine distance in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Extract state code from location string
function extractStateCode(location: string): string {
  const stateMap: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC'
  };
  for (const [stateName, code] of Object.entries(stateMap)) {
    if (location.includes(stateName)) return code;
  }
  return 'XX';
}

// Extract city name from location
function extractCityName(location: string): string {
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return parts[1]; // City is usually second part
  }
  return parts[0] || location;
}

// Determine waypoint type based on dwell time
function getWaypointType(dwellMinutes: number): 'stop' | 'charging' | 'overnight' | 'destination' {
  if (dwellMinutes >= 480) return 'overnight';
  if (dwellMinutes >= 120) return 'destination';
  if (dwellMinutes >= 20) return 'charging';
  return 'stop';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: isAdmin } = await authSupabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { 
      vin,
      fromDate, 
      toDate, 
      minDwellMinutes = 15,
      clusterRadiusMiles = 0.5,
      excludeHome = true,
      homeLocation = 'Austin, Texas',
      commitToFlagship = false
    } = await req.json();

    console.log(`Extract waypoints: from=${fromDate}, to=${toDate}, commit=${commitToFlagship}`);

    // Audit log
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      action: 'extract_waypoints',
      resource_type: 'tessie_drives',
      metadata: { vin, fromDate, toDate, commitToFlagship }
    });

    // Fetch from tessie_drives table (already synced)
    let query = supabase
      .from('tessie_drives')
      .select('*')
      .order('started_at', { ascending: true });

    if (vin) query = query.eq('vin', vin);
    if (fromDate) query = query.gte('started_at', fromDate);
    if (toDate) query = query.lte('started_at', toDate);

    const { data: drives, error: drivesError } = await query;

    if (drivesError) {
      throw new Error(`Failed to fetch drives: ${drivesError.message}`);
    }

    if (!drives || drives.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        waypoints: [],
        stats: { totalDrives: 0, uniqueLocations: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${drives.length} drives to analyze`);

    // Process drives to identify significant stops
    interface StopCluster {
      name: string;
      location: string;
      latitude: number;
      longitude: number;
      state_code: string;
      arrivals: { time: string; battery: number | null; odometer: number | null }[];
      departures: string[];
      driveIds: string[];
    }

    const stopClusters: StopCluster[] = [];

    for (let i = 0; i < drives.length; i++) {
      const drive = drives[i] as TessieDrive;
      
      // Skip home location if excludeHome is true
      if (excludeHome && drive.ending_location?.includes(homeLocation)) {
        continue;
      }

      const endLat = drive.ending_latitude;
      const endLon = drive.ending_longitude;
      const endLocation = drive.ending_location || 'Unknown';
      const endTime = new Date(drive.ended_at);

      // Calculate dwell time until next drive
      let dwellMinutes = 0;
      let departureTime: string | null = null;
      
      if (i + 1 < drives.length) {
        const nextDrive = drives[i + 1] as TessieDrive;
        const nextStartTime = new Date(nextDrive.started_at);
        dwellMinutes = (nextStartTime.getTime() - endTime.getTime()) / (1000 * 60);
        departureTime = nextDrive.started_at;
      } else {
        dwellMinutes = 999; // Last drive - still there
      }

      if (dwellMinutes < minDwellMinutes) continue;

      // Find existing cluster within radius
      let existingCluster = stopClusters.find(c => 
        haversineDistance(c.latitude, c.longitude, endLat, endLon) < clusterRadiusMiles
      );

      if (existingCluster) {
        existingCluster.arrivals.push({ 
          time: drive.ended_at, 
          battery: drive.ending_battery,
          odometer: drive.ending_odometer
        });
        if (departureTime) existingCluster.departures.push(departureTime);
        existingCluster.driveIds.push(drive.id);
      } else {
        stopClusters.push({
          name: extractCityName(endLocation),
          location: endLocation,
          latitude: endLat,
          longitude: endLon,
          state_code: extractStateCode(endLocation),
          arrivals: [{ time: drive.ended_at, battery: drive.ending_battery, odometer: drive.ending_odometer }],
          departures: departureTime ? [departureTime] : [],
          driveIds: [drive.id]
        });
      }
    }

    console.log(`Identified ${stopClusters.length} stop clusters`);

    // Convert clusters to waypoints
    const waypoints: ExtractedWaypoint[] = stopClusters.map(cluster => {
      const firstArrival = cluster.arrivals[0];
      const lastDeparture = cluster.departures.length > 0 
        ? cluster.departures[cluster.departures.length - 1] 
        : null;
      
      let totalDwellMinutes = 0;
      for (let i = 0; i < cluster.arrivals.length; i++) {
        const arrivalTime = new Date(cluster.arrivals[i].time).getTime();
        const departureTime = cluster.departures[i] 
          ? new Date(cluster.departures[i]).getTime() 
          : Date.now();
        totalDwellMinutes += (departureTime - arrivalTime) / (1000 * 60);
      }

      return {
        name: cluster.name,
        location: cluster.location,
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        state_code: cluster.state_code,
        arrived_at: firstArrival.time,
        departed_at: lastDeparture,
        dwell_minutes: Math.round(totalDwellMinutes),
        battery_on_arrival: firstArrival.battery,
        odometer_miles: firstArrival.odometer ? Math.round(firstArrival.odometer) : null,
        waypoint_type: getWaypointType(totalDwellMinutes),
        drive_count: cluster.driveIds.length
      };
    });

    // Sort by arrival time
    waypoints.sort((a, b) => new Date(a.arrived_at).getTime() - new Date(b.arrived_at).getTime());

    // Calculate stats
    const firstDrive = drives[0] as TessieDrive;
    const lastDrive = drives[drives.length - 1] as TessieDrive;
    const totalMiles = (lastDrive.ending_odometer || 0) - (firstDrive.ending_odometer || 0);
    const totalEnergy = drives.reduce((sum, d: any) => sum + (d.energy_used || 0), 0);
    const uniqueStates = [...new Set(waypoints.map(w => w.state_code).filter(s => s !== 'XX'))];

    const stats = {
      totalDrives: drives.length,
      uniqueLocations: stopClusters.length,
      totalMiles: Math.round(totalMiles),
      totalEnergyKwh: Math.round(totalEnergy * 10) / 10,
      statesVisited: uniqueStates,
      statesCount: uniqueStates.length,
      dateRange: { from: firstDrive.started_at, to: lastDrive.ended_at }
    };

    // Commit to flagship_waypoints if requested
    if (commitToFlagship && waypoints.length > 0) {
      console.log(`Committing ${waypoints.length} waypoints to flagship_waypoints`);
      
      const waypointsToInsert = waypoints.map((wp, index) => ({
        waypoint_number: index + 1,
        name: wp.name,
        location: wp.location,
        latitude: wp.latitude,
        longitude: wp.longitude,
        state_code: wp.state_code.substring(0, 2),
        arrived_at: wp.arrived_at,
        departed_at: wp.departed_at,
        dwell_minutes: wp.dwell_minutes,
        battery_on_arrival: wp.battery_on_arrival,
        odometer_miles: wp.odometer_miles,
        waypoint_type: wp.waypoint_type,
        is_highlight: wp.waypoint_type === 'overnight' || wp.waypoint_type === 'destination'
      }));

      const { error: insertError } = await supabase
        .from('flagship_waypoints')
        .insert(waypointsToInsert);

      if (insertError) {
        console.error('Error inserting waypoints:', insertError);
        throw new Error(`Failed to save waypoints: ${insertError.message}`);
      }

      console.log(`Saved ${waypointsToInsert.length} waypoints`);
    }

    return new Response(JSON.stringify({
      success: true,
      waypoints,
      stats,
      committed: commitToFlagship
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
