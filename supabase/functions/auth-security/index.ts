import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config
const MAX_ATTEMPTS_PER_EMAIL = 5; // Max attempts per email in time window
const MAX_ATTEMPTS_PER_IP = 10; // Max attempts per IP in time window
const RATE_LIMIT_WINDOW_MINUTES = 15; // Time window for rate limiting
const LOCKOUT_DURATION_MINUTES = 30; // Account lockout duration

interface LoginCheckRequest {
  action: 'check_rate_limit' | 'record_attempt' | 'check_device' | 'get_alerts' | 'acknowledge_alert';
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  success?: boolean;
  failureReason?: string;
  userId?: string;
  alertId?: string;
  honeypot?: string; // CAPTCHA honeypot field
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: LoginCheckRequest = await req.json();
    const { action, email, ipAddress, userAgent, deviceFingerprint, success, failureReason, userId, alertId, honeypot } = body;

    console.log(`[auth-security] Action: ${action}, Email: ${email?.substring(0, 5)}***, IP: ${ipAddress}`);

    // CAPTCHA honeypot check - if filled, it's a bot
    if (honeypot && honeypot.length > 0) {
      console.log(`[auth-security] Honeypot triggered - bot detected`);
      return new Response(JSON.stringify({ 
        allowed: false, 
        reason: 'suspicious_activity',
        message: 'Request blocked due to suspicious activity'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    if (action === 'check_rate_limit') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Check if account is locked
      const { data: lockout } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('email', email.toLowerCase())
        .gt('locked_until', new Date().toISOString())
        .single();

      if (lockout) {
        const remainingMinutes = Math.ceil((new Date(lockout.locked_until).getTime() - Date.now()) / 60000);
        console.log(`[auth-security] Account locked: ${email}, remaining: ${remainingMinutes}min`);
        return new Response(JSON.stringify({
          allowed: false,
          reason: 'account_locked',
          message: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
          lockedUntil: lockout.locked_until
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        });
      }

      // Check rate limit by email
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
      
      const { count: emailAttempts } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .eq('success', false)
        .gte('created_at', windowStart);

      if ((emailAttempts || 0) >= MAX_ATTEMPTS_PER_EMAIL) {
        console.log(`[auth-security] Email rate limit exceeded: ${email}`);
        return new Response(JSON.stringify({
          allowed: false,
          reason: 'rate_limit_email',
          message: `Too many failed attempts. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
          attemptsRemaining: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        });
      }

      // Check rate limit by IP
      if (ipAddress) {
        const { count: ipAttempts } = await supabase
          .from('login_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('ip_address', ipAddress)
          .eq('success', false)
          .gte('created_at', windowStart);

        if ((ipAttempts || 0) >= MAX_ATTEMPTS_PER_IP) {
          console.log(`[auth-security] IP rate limit exceeded: ${ipAddress}`);
          return new Response(JSON.stringify({
            allowed: false,
            reason: 'rate_limit_ip',
            message: 'Too many requests from this location. Please try again later.',
            attemptsRemaining: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          });
        }
      }

      return new Response(JSON.stringify({
        allowed: true,
        attemptsRemaining: MAX_ATTEMPTS_PER_EMAIL - (emailAttempts || 0)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'record_attempt') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Record the login attempt
      await supabase.from('login_attempts').insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
        device_fingerprint: deviceFingerprint,
        success: success || false,
        failure_reason: failureReason
      });

      // If failed, check if we need to lock the account
      if (!success) {
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
        
        const { count: recentFailures } = await supabase
          .from('login_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('email', email.toLowerCase())
          .eq('success', false)
          .gte('created_at', windowStart);

        if ((recentFailures || 0) >= MAX_ATTEMPTS_PER_EMAIL) {
          const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
          
          await supabase.from('account_lockouts').upsert({
            email: email.toLowerCase(),
            locked_until: lockedUntil,
            lock_reason: 'Too many failed login attempts',
            failed_attempts: recentFailures
          }, { onConflict: 'email' });

          console.log(`[auth-security] Account locked due to failed attempts: ${email}`);
        }
      }

      // If successful, check for suspicious login
      if (success && userId && deviceFingerprint) {
        const { data: existingDevice } = await supabase
          .from('trusted_devices')
          .select('*')
          .eq('user_id', userId)
          .eq('device_fingerprint', deviceFingerprint)
          .single();

        if (!existingDevice) {
          // New device detected - create alert
          console.log(`[auth-security] New device detected for user: ${userId}`);
          
          await supabase.from('login_alerts').insert({
            user_id: userId,
            alert_type: 'new_device',
            ip_address: ipAddress,
            device_fingerprint: deviceFingerprint,
            details: { userAgent, firstSeen: new Date().toISOString() }
          });

          // Add as trusted device
          await supabase.from('trusted_devices').insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: parseDeviceName(userAgent || ''),
            ip_address: ipAddress
          });

          return new Response(JSON.stringify({
            recorded: true,
            newDevice: true,
            message: 'Login from new device detected'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // Update last used
          await supabase
            .from('trusted_devices')
            .update({ last_used_at: new Date().toISOString(), ip_address: ipAddress })
            .eq('id', existingDevice.id);

          // Check if IP changed significantly (different location)
          if (existingDevice.ip_address && ipAddress !== existingDevice.ip_address) {
            console.log(`[auth-security] Login from new location for user: ${userId}`);
            
            await supabase.from('login_alerts').insert({
              user_id: userId,
              alert_type: 'new_location',
              ip_address: ipAddress,
              device_fingerprint: deviceFingerprint,
              details: { 
                previousIp: existingDevice.ip_address, 
                newIp: ipAddress,
                deviceName: existingDevice.device_name
              }
            });

            return new Response(JSON.stringify({
              recorded: true,
              newLocation: true,
              message: 'Login from new location detected'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // Clear any lockout on successful login
        await supabase
          .from('account_lockouts')
          .delete()
          .eq('email', email.toLowerCase());
      }

      return new Response(JSON.stringify({ recorded: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_alerts') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const { data: alerts } = await supabase
        .from('login_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({ alerts: alerts || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'acknowledge_alert') {
      if (!alertId || !userId) {
        return new Response(JSON.stringify({ error: 'Alert ID and User ID required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      await supabase
        .from('login_alerts')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', alertId)
        .eq('user_id', userId);

      return new Response(JSON.stringify({ acknowledged: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    console.error('[auth-security] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function parseDeviceName(userAgent: string): string {
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Linux')) return 'Linux';
  return 'Unknown Device';
}