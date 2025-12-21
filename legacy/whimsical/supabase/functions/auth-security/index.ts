import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config
const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 30;

interface LoginCheckRequest {
  action: 'check_rate_limit' | 'record_attempt' | 'check_device' | 'get_alerts' | 'acknowledge_alert' | 'revoke_device';
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  success?: boolean;
  failureReason?: string;
  userId?: string;
  alertId?: string;
  deviceId?: string;
  honeypot?: string;
}

// Send security alert email
async function sendSecurityAlertEmail(
  userEmail: string,
  alertType: 'new_device' | 'new_location',
  details: Record<string, any>
) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('[auth-security] RESEND_API_KEY not configured, skipping email');
    return;
  }

  const resend = new Resend(resendKey);
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.awhittlewandering.com';

  const alertTitle = alertType === 'new_device' 
    ? 'New Device Login Detected' 
    : 'Login From New Location';

  const alertMessage = alertType === 'new_device'
    ? `A new device "${details.deviceName || 'Unknown Device'}" was used to sign into your AWW account.`
    : `Your account was accessed from a new location${details.city ? ` (${details.city})` : ''}.`;

  try {
    await resend.emails.send({
      from: 'AWW Security <security@awhittlewandering.com>',
      to: [userEmail],
      subject: `⚠️ Security Alert: ${alertTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border-radius: 12px; overflow: hidden; border: 1px solid #30363d;">
            <div style="padding: 24px; background: linear-gradient(135deg, #d97706 0%, #92400e 100%);">
              <h1 style="margin: 0; color: white; font-size: 24px;">🛡️ Security Alert</h1>
            </div>
            <div style="padding: 24px;">
              <h2 style="color: #f0883e; margin-top: 0;">${alertTitle}</h2>
              <p style="font-size: 16px; line-height: 1.6;">${alertMessage}</p>
              
              <div style="background-color: #21262d; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                ${details.deviceName ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Device:</strong> ${details.deviceName}</p>` : ''}
                ${details.ip ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>IP Address:</strong> ${details.ip}</p>` : ''}
                ${details.city ? `<p style="margin: 0; font-size: 14px;"><strong>Location:</strong> ${details.city}</p>` : ''}
              </div>
              
              <p style="font-size: 14px; color: #8b949e;">If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately:</p>
              
              <div style="margin: 24px 0;">
                <a href="${siteUrl}/settings?tab=security" style="display: inline-block; background-color: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Review Security Settings</a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #30363d; margin: 24px 0;">
              
              <p style="font-size: 12px; color: #6e7681; margin: 0;">
                This is an automated security notification from A Whittle Wandering. 
                You received this because security alerts are enabled for your account.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`[auth-security] Security alert email sent to ${userEmail.substring(0, 5)}***`);
  } catch (error) {
    console.error('[auth-security] Failed to send security email:', error);
  }
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
    const { action, email, ipAddress, userAgent, deviceFingerprint, success, failureReason, userId, alertId, deviceId, honeypot } = body;

    console.log(`[auth-security] Action: ${action}, Email: ${email?.substring(0, 5)}***, IP: ${ipAddress}`);

    // CAPTCHA honeypot check
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
        // Get user email for notifications
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        const { data: existingDevice } = await supabase
          .from('trusted_devices')
          .select('*')
          .eq('user_id', userId)
          .eq('device_fingerprint', deviceFingerprint)
          .single();

        if (!existingDevice) {
          // New device detected
          console.log(`[auth-security] New device detected for user: ${userId}`);
          
          const deviceName = parseDeviceName(userAgent || '');
          
          await supabase.from('login_alerts').insert({
            user_id: userId,
            alert_type: 'new_device',
            ip_address: ipAddress,
            device_fingerprint: deviceFingerprint,
            details: { userAgent, deviceName, firstSeen: new Date().toISOString() }
          });

          // Add as trusted device
          await supabase.from('trusted_devices').insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: deviceName,
            ip_address: ipAddress
          });

          // Send email notification
          if (userEmail) {
            await sendSecurityAlertEmail(userEmail, 'new_device', {
              deviceName,
              ip: ipAddress
            });
          }

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

            // Send email notification
            if (userEmail) {
              await sendSecurityAlertEmail(userEmail, 'new_location', {
                deviceName: existingDevice.device_name,
                ip: ipAddress,
                previousIp: existingDevice.ip_address
              });
            }

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

    if (action === 'revoke_device') {
      if (!deviceId || !userId) {
        return new Response(JSON.stringify({ error: 'Device ID and User ID required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId)
        .eq('user_id', userId);

      console.log(`[auth-security] Device revoked: ${deviceId} for user: ${userId}`);

      return new Response(JSON.stringify({ revoked: true }), {
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