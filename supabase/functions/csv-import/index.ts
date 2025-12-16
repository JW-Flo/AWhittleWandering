import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriveDataRow {
  journey_id: string;
  user_id: string;
  recorded_at: string;
  latitude: number;
  longitude: number;
  elevation_ft: number | null;
  speed_mph: number | null;
  odometer: number | null;
  battery_level: number | null;
  battery_range: number | null;
  outside_temp_f: number | null;
  inside_temp_f: number | null;
  power_kw: number | null;
  energy_used_kwh: number | null;
  is_charging: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data, journey_id, user_id } = await req.json();
    console.log(`CSV Import request: action=${action}, journey_id=${journey_id}, rows=${data?.length || 0}`);

    if (action === 'parse_preview') {
      // Parse CSV and return preview (first 10 rows + stats)
      const rows = data as string[][];
      const headers = rows[0];
      
      const stats = {
        totalRows: rows.length - 1,
        headers,
        preview: rows.slice(1, 11),
        dateRange: {
          start: rows[1]?.[0] || '',
          end: rows[rows.length - 1]?.[0] || ''
        }
      };

      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import_drive_data') {
      if (!journey_id || !user_id) {
        throw new Error('journey_id and user_id are required');
      }

      const rows = data as string[][];
      const headers = rows[0].map((h: string) => h.replace(/"/g, '').trim());
      
      // Map header indices
      const headerMap: Record<string, number> = {};
      headers.forEach((h: string, i: number) => {
        headerMap[h] = i;
      });

      console.log('Headers found:', headers);

      const driveData: DriveDataRow[] = [];
      let skipped = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 10) {
          skipped++;
          continue;
        }

        const getValue = (key: string): string => {
          const idx = headerMap[key];
          return idx !== undefined ? (row[idx] || '').replace(/"/g, '').trim() : '';
        };

        const getNum = (key: string): number | null => {
          const val = getValue(key);
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        };

        const lat = getNum('Latitude');
        const lng = getNum('Longitude');
        const timestamp = getValue('Timestamp (CST)');

        if (!lat || !lng || !timestamp) {
          skipped++;
          continue;
        }

        const chargingState = getValue('Charging State');
        const isCharging = chargingState?.toLowerCase().includes('charging') || false;

        driveData.push({
          journey_id,
          user_id,
          recorded_at: new Date(timestamp).toISOString(),
          latitude: lat,
          longitude: lng,
          elevation_ft: getNum('Elevation (m)') ? getNum('Elevation (m)')! * 3.28084 : null,
          speed_mph: getNum('Speed (mph)'),
          odometer: getNum('Odometer (mi)'),
          battery_level: getNum('Battery Level (%)'),
          battery_range: getNum('Battery Range (mi)'),
          outside_temp_f: getNum('Outside Temp (°F)'),
          inside_temp_f: getNum('Inside Temp (°F)'),
          power_kw: getNum('Power (kW)'),
          energy_used_kwh: getNum('Lifetime Energy Used (kWh)'),
          is_charging: isCharging
        });
      }

      console.log(`Parsed ${driveData.length} rows, skipped ${skipped}`);

      // Insert in batches of 500
      const batchSize = 500;
      let inserted = 0;

      for (let i = 0; i < driveData.length; i += batchSize) {
        const batch = driveData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('drive_data')
          .insert(batch);

        if (error) {
          console.error(`Batch insert error at ${i}:`, error);
          throw error;
        }

        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total: ${inserted}`);
      }

      // Update journey stats
      const { data: statsData } = await supabase
        .from('drive_data')
        .select('odometer, battery_level, recorded_at')
        .eq('journey_id', journey_id)
        .order('recorded_at', { ascending: true });

      if (statsData && statsData.length > 0) {
        const first = statsData[0];
        const last = statsData[statsData.length - 1];
        const totalMiles = (last.odometer || 0) - (first.odometer || 0);

        await supabase
          .from('journeys')
          .update({ 
            total_miles: totalMiles,
            start_date: first.recorded_at?.split('T')[0],
            end_date: last.recorded_at?.split('T')[0]
          })
          .eq('id', journey_id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        inserted,
        skipped,
        message: `Successfully imported ${inserted} GPS points`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('CSV Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
