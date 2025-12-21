import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const d1DatabaseId = Deno.env.get('CLOUDFLARE_D1_DATABASE_ID');

    if (!cloudflareAccountId || !cloudflareApiToken || !d1DatabaseId) {
      console.error('Missing Cloudflare credentials');
      return new Response(
        JSON.stringify({ error: 'Cloudflare D1 not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get recent audit entries that haven't been synced (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: auditEntries, error: fetchError } = await supabase
      .from('security_audit_log')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true })
      .limit(500);

    if (fetchError) {
      console.error('Error fetching audit entries:', fetchError);
      throw fetchError;
    }

    if (!auditEntries || auditEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No new audit entries to sync', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing ${auditEntries.length} audit entries to Cloudflare D1`);

    // Create table if not exists
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        metadata TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL,
        synced_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);
    `;

    // Execute table creation
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/d1/database/${d1DatabaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: createTableSql }),
      }
    );

    // Batch insert audit entries
    let syncedCount = 0;
    const batchSize = 50;
    const syncedAt = new Date().toISOString();

    for (let i = 0; i < auditEntries.length; i += batchSize) {
      const batch = auditEntries.slice(i, i + batchSize);
      
      // Use INSERT OR REPLACE to handle duplicates
      const values = batch.map((entry: AuditEntry) => 
        `('${entry.id}', '${entry.user_id}', '${entry.action.replace(/'/g, "''")}', '${entry.resource_type.replace(/'/g, "''")}', ${entry.resource_id ? `'${entry.resource_id}'` : 'NULL'}, '${JSON.stringify(entry.metadata || {}).replace(/'/g, "''")}', ${entry.ip_address ? `'${entry.ip_address}'` : 'NULL'}, ${entry.user_agent ? `'${entry.user_agent.replace(/'/g, "''")}'` : 'NULL'}, '${entry.created_at}', '${syncedAt}')`
      ).join(',');

      const insertSql = `
        INSERT OR REPLACE INTO audit_log (id, user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at, synced_at)
        VALUES ${values};
      `;

      const insertResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/d1/database/${d1DatabaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql: insertSql }),
        }
      );

      const insertResult = await insertResponse.json();
      
      if (insertResult.success) {
        syncedCount += batch.length;
        console.log(`Synced batch of ${batch.length} entries`);
      } else {
        console.error('D1 insert error:', insertResult.errors);
      }
    }

    console.log(`Successfully synced ${syncedCount} audit entries to Cloudflare D1`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        message: `Synced ${syncedCount} audit entries to Cloudflare D1`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in audit-d1-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
