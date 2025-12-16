import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleData {
  vin?: string;
  battery_level?: number;
  range?: number;
  odometer?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  charging_state?: string;
  inside_temp?: number;
  outside_temp?: number;
  last_seen?: string;
}

// Tessie API handler
async function fetchTessieData(token: string, vin?: string, action: string = 'state'): Promise<{ success: boolean; vehicle?: VehicleData; error?: string }> {
  try {
    // Get vehicle list if no VIN provided
    if (!vin && action === 'test_connection') {
      const listResponse = await fetch('https://api.tessie.com/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          return { success: false, error: 'Invalid API token. Please check your Tessie token and try again.' };
        }
        return { success: false, error: `Tessie API error: ${listResponse.status}` };
      }
      
      const vehicles = await listResponse.json();
      if (!vehicles.results || vehicles.results.length === 0) {
        return { success: false, error: 'No vehicles found in your Tessie account.' };
      }
      
      // Use first vehicle
      vin = vehicles.results[0].vin;
    }

    if (!vin) {
      return { success: false, error: 'No VIN provided and unable to auto-detect vehicle.' };
    }

    // Fetch vehicle state
    const stateResponse = await fetch(`https://api.tessie.com/${vin}/state`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!stateResponse.ok) {
      if (stateResponse.status === 401) {
        return { success: false, error: 'Invalid API token.' };
      }
      return { success: false, error: `Failed to fetch vehicle state: ${stateResponse.status}` };
    }
    
    const state = await stateResponse.json();
    
    // Normalize to our format
    const vehicle: VehicleData = {
      vin: vin,
      battery_level: state.charge_state?.battery_level,
      range: state.charge_state?.battery_range,
      odometer: state.vehicle_state?.odometer,
      latitude: state.drive_state?.latitude,
      longitude: state.drive_state?.longitude,
      speed: state.drive_state?.speed || 0,
      charging_state: state.charge_state?.charging_state,
      inside_temp: state.climate_state?.inside_temp ? (state.climate_state.inside_temp * 9/5) + 32 : undefined,
      outside_temp: state.climate_state?.outside_temp ? (state.climate_state.outside_temp * 9/5) + 32 : undefined,
      last_seen: new Date().toISOString(),
    };
    
    return { success: true, vehicle };
  } catch (error: unknown) {
    console.error('Tessie API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to connect to Tessie.';
    return { success: false, error: message };
  }
}

// Smartcar API handler (placeholder for OAuth flow)
async function fetchSmartcarData(token: string, vin?: string, action: string = 'state'): Promise<{ success: boolean; vehicle?: VehicleData; error?: string }> {
  // Smartcar uses OAuth, so this would typically involve:
  // 1. User authorizing via Smartcar Connect
  // 2. Exchange code for access token
  // 3. Use access token to fetch vehicle data
  
  // For now, return placeholder indicating OAuth is required
  return {
    success: false,
    error: 'Smartcar requires OAuth authorization. This feature is coming soon.',
  };
}

// Tesla Fleet API handler (placeholder)
async function fetchTeslaFleetData(token: string, vin?: string, action: string = 'state'): Promise<{ success: boolean; vehicle?: VehicleData; error?: string }> {
  return {
    success: false,
    error: 'Tesla Fleet API integration is coming soon. We recommend using Tessie for now.',
  };
}

// Provider router
async function handleProvider(provider: string, token: string, vin?: string, action: string = 'state'): Promise<{ success: boolean; vehicle?: VehicleData; error?: string }> {
  switch (provider) {
    case 'tessie':
      return fetchTessieData(token, vin, action);
    case 'smartcar':
      return fetchSmartcarData(token, vin, action);
    case 'tesla_fleet':
      return fetchTeslaFleetData(token, vin, action);
    default:
      return { success: false, error: `Unknown provider: ${provider}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, provider, token, vin } = await req.json();

    if (!provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'Provider is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'API token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Vehicle API request: provider=${provider}, action=${action || 'state'}, hasVin=${!!vin}`);

    const result = await handleProvider(provider, token, vin, action || 'state');

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Vehicle API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
