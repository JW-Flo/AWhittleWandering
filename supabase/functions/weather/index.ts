import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY is not configured');
    }

    const { lat, lon, type, dt } = await req.json();
    console.log(`Weather API request: type=${type}, lat=${lat}, lon=${lon}, dt=${dt}`);

    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    let endpoint = '';
    switch (type) {
      case 'current':
        endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
        break;
      case 'historical':
        if (!dt) throw new Error('Timestamp (dt) required for historical data');
        endpoint = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
        break;
      case 'forecast':
        endpoint = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
        break;
      case 'air_quality':
        endpoint = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
        break;
      default:
        endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
    }

    const response = await fetch(endpoint);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenWeather API error: ${response.status} ${errorText}`);
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Weather API success: ${type}`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
