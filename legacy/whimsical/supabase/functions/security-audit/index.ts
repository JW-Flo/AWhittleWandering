import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MITRE ATT&CK framework categories for security auditing
const MITRE_CATEGORIES = {
  INITIAL_ACCESS: 'initial_access',
  EXECUTION: 'execution',
  PERSISTENCE: 'persistence',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  DEFENSE_EVASION: 'defense_evasion',
  CREDENTIAL_ACCESS: 'credential_access',
  DISCOVERY: 'discovery',
  LATERAL_MOVEMENT: 'lateral_movement',
  COLLECTION: 'collection',
  EXFILTRATION: 'exfiltration',
  IMPACT: 'impact',
};

interface SecurityFinding {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  mitre_technique?: string;
  affected_resource?: string;
  recommendation: string;
  auto_remediation_available: boolean;
  remediated?: boolean;
}

interface RemediationAction {
  finding_id: string;
  action: string;
  success: boolean;
  details: string;
}

// Send email notification for critical/high findings
async function sendSecurityAlert(
  findings: SecurityFinding[],
  summary: Record<string, unknown>,
  scanId: string | null
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  const criticalAndHigh = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  if (criticalAndHigh.length === 0) {
    console.log('No critical or high severity findings, skipping email notification');
    return;
  }

  const resend = new Resend(resendApiKey);
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.awhittlewandering.com';

  const findingsHtml = criticalAndHigh.map(f => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; background-color: ${f.severity === 'critical' ? '#fef2f2' : '#fefce8'};">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: white; background-color: ${f.severity === 'critical' ? '#dc2626' : '#f59e0b'};">
          ${f.severity.toUpperCase()}
        </span>
      </td>
      <td style="padding: 12px;">
        <strong>${f.title}</strong><br/>
        <span style="color: #6b7280; font-size: 14px;">${f.description}</span>
      </td>
      <td style="padding: 12px; color: #6b7280; font-size: 14px;">
        ${f.mitre_technique || 'N/A'}
      </td>
      <td style="padding: 12px; font-size: 14px;">
        ${f.recommendation}
      </td>
    </tr>
  `).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Security Alert</h1>
          <p style="color: #fecaca; margin: 10px 0 0 0;">A Whittle Wandering Platform</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <strong style="color: #dc2626;">Security scan detected ${criticalAndHigh.length} critical/high severity finding(s)</strong>
            <p style="margin: 5px 0 0 0; color: #991b1b;">Immediate attention required. Review and remediate these issues as soon as possible.</p>
          </div>

          <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Summary</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${(summary as any).by_severity?.critical || 0}</div>
              <div style="color: #991b1b; font-size: 12px;">Critical</div>
            </div>
            <div style="background: #fefce8; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${(summary as any).by_severity?.high || 0}</div>
              <div style="color: #92400e; font-size: 12px;">High</div>
            </div>
            <div style="background: #fff7ed; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #ea580c;">${(summary as any).by_severity?.medium || 0}</div>
              <div style="color: #9a3412; font-size: 12px;">Medium</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${(summary as any).by_severity?.low || 0}</div>
              <div style="color: #166534; font-size: 12px;">Low</div>
            </div>
          </div>

          <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Critical & High Severity Findings</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Severity</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Finding</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">MITRE ATT&CK</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${findingsHtml}
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${siteUrl}/admin" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
              View Security Dashboard →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Scan ID: ${scanId || 'N/A'}<br/>
            Timestamp: ${new Date().toISOString()}<br/>
            This is an automated security notification from A Whittle Wandering.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: 'AWW Security <security@awhittlewandering.com>',
      to: ['admin@awhittlewandering.com'],
      subject: `🚨 [SECURITY ALERT] ${criticalAndHigh.length} Critical/High Finding(s) Detected`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send security alert email:', error);
    } else {
      console.log('Security alert email sent successfully');
    }
  } catch (err) {
    console.error('Error sending security alert email:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  let scanResultId: string | null = null;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse request body for trigger info
    let triggerType = 'manual';
    let targetUserId: string | null = null;
    let autoRemediate = false;
    let scanType = 'full';
    let sendEmailAlerts = true;
    
    try {
      const body = await req.json();
      triggerType = body.trigger || 'manual';
      targetUserId = body.userId || null;
      autoRemediate = body.autoRemediate || false;
      scanType = body.scanType || 'full';
      sendEmailAlerts = body.sendEmailAlerts !== false;
    } catch {
      // No body, manual trigger
    }

    console.log(`Security audit triggered: ${triggerType}, autoRemediate: ${autoRemediate}, sendEmailAlerts: ${sendEmailAlerts}`);

    const findings: SecurityFinding[] = [];
    const remediationActions: RemediationAction[] = [];
    const checks: Record<string, { status: string; details?: unknown; [key: string]: unknown }> = {};

    // ========================================
    // INITIAL ACCESS CHECKS (T1078, T1190)
    // ========================================
    
    // Check for failed login attempts (brute force indicators)
    const { data: failedLogins } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const failedLoginsByEmail: Record<string, number> = {};
    const failedLoginsByIP: Record<string, number> = {};
    failedLogins?.forEach(log => {
      failedLoginsByEmail[log.email] = (failedLoginsByEmail[log.email] || 0) + 1;
      if (log.ip_address) {
        failedLoginsByIP[log.ip_address] = (failedLoginsByIP[log.ip_address] || 0) + 1;
      }
    });

    const suspiciousEmails = Object.entries(failedLoginsByEmail)
      .filter(([_, count]) => count >= 5);
    
    const suspiciousIPs = Object.entries(failedLoginsByIP)
      .filter(([_, count]) => count >= 10);
    
    if (suspiciousEmails.length > 0) {
      const findingId = 'bf_email_' + Date.now();
      findings.push({
        id: findingId,
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: suspiciousEmails.some(([_, count]) => count >= 20) ? 'critical' : 'high',
        title: 'Potential Brute Force Attack Detected (By Email)',
        description: `${suspiciousEmails.length} account(s) have 5+ failed login attempts in the last 24 hours: ${suspiciousEmails.map(([email, count]) => `${email.substring(0, 3)}*** (${count}x)`).join(', ')}`,
        mitre_technique: 'T1110 - Brute Force',
        recommendation: 'Review login patterns, implement CAPTCHA, and consider IP-based rate limiting.',
        auto_remediation_available: true,
      });

      // Auto-remediation: Lock accounts with excessive failed attempts
      if (autoRemediate) {
        for (const [email, count] of suspiciousEmails.filter(([_, c]) => c >= 10)) {
          const { error } = await supabase
            .from('account_lockouts')
            .upsert({
              email,
              locked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour lockout
              lock_reason: `Auto-locked: ${count} failed login attempts`,
              failed_attempts: count
            }, { onConflict: 'email' });

          remediationActions.push({
            finding_id: findingId,
            action: `Lock account: ${email.substring(0, 3)}***`,
            success: !error,
            details: error ? error.message : 'Account locked for 1 hour'
          });
        }
      }
    }

    if (suspiciousIPs.length > 0) {
      findings.push({
        id: 'bf_ip_' + Date.now(),
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: suspiciousIPs.some(([_, count]) => count >= 50) ? 'critical' : 'high',
        title: 'Potential Brute Force Attack Detected (By IP)',
        description: `${suspiciousIPs.length} IP address(es) have 10+ failed login attempts: ${suspiciousIPs.map(([ip, count]) => `${ip.substring(0, 8)}*** (${count}x)`).join(', ')}`,
        mitre_technique: 'T1110 - Brute Force',
        recommendation: 'Consider blocking suspicious IPs at the firewall level.',
        auto_remediation_available: false,
      });
    }

    checks['brute_force_detection'] = {
      status: suspiciousEmails.length > 0 || suspiciousIPs.length > 0 ? 'warning' : 'pass',
      suspicious_accounts: suspiciousEmails.length,
      suspicious_ips: suspiciousIPs.length,
      total_failed_attempts: failedLogins?.length || 0
    };

    // Check for geographic anomalies in logins
    const { data: recentLogins } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('success', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const loginsByCountry: Record<string, number> = {};
    recentLogins?.forEach(log => {
      if (log.country_code) {
        loginsByCountry[log.country_code] = (loginsByCountry[log.country_code] || 0) + 1;
      }
    });

    const unusualCountries = Object.entries(loginsByCountry)
      .filter(([country]) => !['US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR'].includes(country));

    if (unusualCountries.length > 0 && unusualCountries.some(([_, count]) => count >= 3)) {
      findings.push({
        id: 'geo_' + Date.now(),
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: 'medium',
        title: 'Unusual Geographic Login Activity',
        description: `Successful logins from unexpected countries: ${unusualCountries.map(([c, n]) => `${c} (${n}x)`).join(', ')}`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Verify these logins are legitimate. Consider geo-blocking if necessary.',
        auto_remediation_available: false,
      });
    }

    checks['geographic_monitoring'] = {
      status: unusualCountries.length > 0 ? 'info' : 'pass',
      countries_detected: Object.keys(loginsByCountry).length,
      unusual_countries: unusualCountries.length
    };

    // ========================================
    // PRIVILEGE ESCALATION CHECKS (T1078.003)
    // ========================================
    
    // Check for recent role changes
    const { data: recentRoleChanges } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('action', 'role_change')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentRoleChanges && recentRoleChanges.length > 5) {
      findings.push({
        id: 'role_' + Date.now(),
        category: MITRE_CATEGORIES.PRIVILEGE_ESCALATION,
        severity: recentRoleChanges.length > 20 ? 'high' : 'medium',
        title: 'Elevated Role Change Activity',
        description: `${recentRoleChanges.length} role changes in the last 7 days. Review for unauthorized privilege escalation.`,
        mitre_technique: 'T1078.003 - Valid Accounts: Local Accounts',
        recommendation: 'Review all role changes for legitimacy and implement approval workflows.',
        auto_remediation_available: false,
      });
    }

    checks['role_change_monitoring'] = {
      status: (recentRoleChanges?.length || 0) > 5 ? 'warning' : 'pass',
      changes_last_7_days: recentRoleChanges?.length || 0
    };

    // Check admin user count
    const { data: adminUsers, count: adminCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' })
      .eq('role', 'admin');

    if (adminCount && adminCount > 3) {
      findings.push({
        id: 'admin_' + Date.now(),
        category: MITRE_CATEGORIES.PRIVILEGE_ESCALATION,
        severity: adminCount > 10 ? 'high' : 'medium',
        title: 'High Number of Admin Users',
        description: `${adminCount} users have admin privileges. Principle of least privilege recommends minimizing admin access.`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Review admin accounts and remove unnecessary privileges.',
        auto_remediation_available: false,
      });
    }

    checks['admin_count'] = {
      status: (adminCount || 0) > 3 ? 'warning' : 'pass',
      count: adminCount || 0
    };

    // ========================================
    // CREDENTIAL ACCESS CHECKS (T1552)
    // ========================================
    
    // Check for stale API credentials
    const { data: staleCredentials } = await supabase
      .from('user_api_credentials')
      .select('id, user_id, last_verified_at, is_valid')
      .lt('last_verified_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (staleCredentials && staleCredentials.length > 0) {
      const findingId = 'cred_stale_' + Date.now();
      findings.push({
        id: findingId,
        category: MITRE_CATEGORIES.CREDENTIAL_ACCESS,
        severity: 'low',
        title: 'Stale API Credentials Detected',
        description: `${staleCredentials.length} API credentials haven't been verified in 30+ days.`,
        mitre_technique: 'T1552 - Unsecured Credentials',
        recommendation: 'Review and re-validate stale credentials or remove unused ones.',
        auto_remediation_available: true,
      });

      // Auto-remediation: Mark stale credentials as invalid
      if (autoRemediate) {
        const { error } = await supabase
          .from('user_api_credentials')
          .update({ is_valid: false, error_message: 'Auto-invalidated: stale credential (30+ days)' })
          .in('id', staleCredentials.map(c => c.id));

        remediationActions.push({
          finding_id: findingId,
          action: `Invalidate ${staleCredentials.length} stale credentials`,
          success: !error,
          details: error ? error.message : 'Credentials marked as invalid for re-verification'
        });
      }
    }

    // Check for credentials with errors
    const { data: errorCredentials } = await supabase
      .from('user_api_credentials')
      .select('id, user_id, error_message')
      .eq('is_valid', false)
      .not('error_message', 'is', null);

    if (errorCredentials && errorCredentials.length > 5) {
      findings.push({
        id: 'cred_err_' + Date.now(),
        category: MITRE_CATEGORIES.CREDENTIAL_ACCESS,
        severity: 'low',
        title: 'Multiple Invalid API Credentials',
        description: `${errorCredentials.length} API credentials are marked invalid with errors. This could indicate configuration issues or token theft attempts.`,
        mitre_technique: 'T1552 - Unsecured Credentials',
        recommendation: 'Review credential errors and help users reconfigure if legitimate.',
        auto_remediation_available: false,
      });
    }

    checks['api_credentials'] = {
      status: (staleCredentials?.length || 0) > 0 ? 'info' : 'pass',
      stale_credentials: staleCredentials?.length || 0,
      error_credentials: errorCredentials?.length || 0
    };

    // ========================================
    // DATA EXFILTRATION CHECKS (T1567)
    // ========================================
    
    // Check for large data exports
    const { data: dataExports } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('action', 'data_export')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (dataExports && dataExports.length > 10) {
      findings.push({
        id: 'export_' + Date.now(),
        category: MITRE_CATEGORIES.EXFILTRATION,
        severity: dataExports.length > 50 ? 'critical' : 'high',
        title: 'Elevated Data Export Activity',
        description: `${dataExports.length} data exports in the last 24 hours. Potential data exfiltration.`,
        mitre_technique: 'T1567 - Exfiltration Over Web Service',
        recommendation: 'Review export logs for unauthorized data access. Consider export rate limiting.',
        auto_remediation_available: false,
      });
    }

    checks['data_export_monitoring'] = {
      status: (dataExports?.length || 0) > 10 ? 'warning' : 'pass',
      exports_last_24h: dataExports?.length || 0
    };

    // ========================================
    // ACCOUNT SECURITY CHECKS
    // ========================================
    
    // Check for locked/suspended accounts
    const { data: lockedProfiles, count: lockedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('account_status', ['locked', 'suspended']);

    checks['locked_accounts'] = {
      status: (lockedCount || 0) > 10 ? 'warning' : 'info',
      count: lockedCount || 0
    };

    // Check for unresolved incidents
    const { data: openIncidents, count: incidentCount } = await supabase
      .from('incident_log')
      .select('*', { count: 'exact' })
      .eq('resolved', false);

    if (incidentCount && incidentCount > 0) {
      const criticalIncidents = openIncidents?.filter(i => i.severity === 'critical').length || 0;
      findings.push({
        id: 'incident_' + Date.now(),
        category: MITRE_CATEGORIES.IMPACT,
        severity: criticalIncidents > 0 ? 'critical' : (incidentCount > 5 ? 'high' : 'medium'),
        title: 'Unresolved Security Incidents',
        description: `${incidentCount} security incidents remain unresolved (${criticalIncidents} critical).`,
        recommendation: 'Review and remediate all open incidents immediately.',
        auto_remediation_available: false,
      });
    }

    checks['open_incidents'] = {
      status: (incidentCount || 0) > 0 ? 'warning' : 'pass',
      count: incidentCount || 0
    };

    // ========================================
    // SESSION SECURITY CHECKS
    // ========================================
    
    // Check for expired lockouts that should be cleared
    const { data: expiredLockouts } = await supabase
      .from('account_lockouts')
      .select('*')
      .lt('locked_until', new Date().toISOString());

    if (expiredLockouts && expiredLockouts.length > 0 && autoRemediate) {
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .lt('locked_until', new Date().toISOString());

      remediationActions.push({
        finding_id: 'cleanup_lockouts',
        action: `Clear ${expiredLockouts.length} expired lockouts`,
        success: !error,
        details: error ? error.message : 'Expired lockouts cleared'
      });
    }

    // Check for suspicious trusted devices
    const { data: trustedDevices } = await supabase
      .from('trusted_devices')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const newDevicesPerUser: Record<string, number> = {};
    trustedDevices?.forEach(d => {
      newDevicesPerUser[d.user_id] = (newDevicesPerUser[d.user_id] || 0) + 1;
    });

    const usersWithManyNewDevices = Object.entries(newDevicesPerUser)
      .filter(([_, count]) => count >= 3);

    if (usersWithManyNewDevices.length > 0) {
      findings.push({
        id: 'devices_' + Date.now(),
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: 'medium',
        title: 'Suspicious Device Registration Activity',
        description: `${usersWithManyNewDevices.length} user(s) registered 3+ new devices in 24 hours. Could indicate credential sharing or compromise.`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Review device registrations and contact users to verify.',
        auto_remediation_available: false,
      });
    }

    checks['session_security'] = {
      status: usersWithManyNewDevices.length > 0 ? 'warning' : 'pass',
      expired_lockouts_cleared: expiredLockouts?.length || 0,
      new_trusted_devices: trustedDevices?.length || 0,
      suspicious_device_activity: usersWithManyNewDevices.length
    };

    // ========================================
    // LOGIN ALERT CHECKS
    // ========================================
    
    // Check for unacknowledged login alerts
    const { data: unackedAlerts, count: alertCount } = await supabase
      .from('login_alerts')
      .select('*', { count: 'exact' })
      .eq('acknowledged', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (alertCount && alertCount > 10) {
      findings.push({
        id: 'alerts_' + Date.now(),
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: alertCount > 50 ? 'high' : 'medium',
        title: 'High Volume of Unacknowledged Login Alerts',
        description: `${alertCount} login alerts remain unacknowledged in the last 7 days.`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Review login alerts for signs of account compromise.',
        auto_remediation_available: false,
      });
    }

    checks['login_alerts'] = {
      status: (alertCount || 0) > 10 ? 'warning' : 'pass',
      unacknowledged_count: alertCount || 0
    };

    // ========================================
    // STORAGE SECURITY CHECKS
    // ========================================
    
    // Check for orphaned media files (media without journey)
    const { data: orphanedMedia } = await supabase
      .from('journey_media')
      .select('id, journey_id')
      .is('journey_id', null);

    if (orphanedMedia && orphanedMedia.length > 0) {
      findings.push({
        id: 'orphan_' + Date.now(),
        category: MITRE_CATEGORIES.COLLECTION,
        severity: 'low',
        title: 'Orphaned Media Files',
        description: `${orphanedMedia.length} media files exist without associated journeys.`,
        recommendation: 'Review and clean up orphaned media files to reduce storage costs.',
        auto_remediation_available: false,
      });
    }

    checks['storage_security'] = {
      status: (orphanedMedia?.length || 0) > 0 ? 'info' : 'pass',
      orphaned_files: orphanedMedia?.length || 0
    };

    // ========================================
    // NOTIFICATION SECURITY CHECKS
    // ========================================
    
    // Check for SMS abuse patterns
    const { data: recentSmsLogs } = await supabase
      .from('sms_consent_log')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const smsActionsByUser: Record<string, number> = {};
    recentSmsLogs?.forEach(log => {
      smsActionsByUser[log.user_id] = (smsActionsByUser[log.user_id] || 0) + 1;
    });

    const smsAbusers = Object.entries(smsActionsByUser)
      .filter(([_, count]) => count >= 10);

    if (smsAbusers.length > 0) {
      findings.push({
        id: 'sms_abuse_' + Date.now(),
        category: MITRE_CATEGORIES.IMPACT,
        severity: 'medium',
        title: 'Potential SMS Consent Toggle Abuse',
        description: `${smsAbusers.length} user(s) have toggled SMS consent 10+ times in 24 hours. Could indicate testing for SMS bombing.`,
        recommendation: 'Rate limit SMS consent changes per user.',
        auto_remediation_available: false,
      });
    }

    checks['notification_security'] = {
      status: smsAbusers.length > 0 ? 'warning' : 'pass',
      sms_consent_changes: recentSmsLogs?.length || 0,
      potential_abusers: smsAbusers.length
    };

    // ========================================
    // DATA INTEGRITY CHECKS
    // ========================================
    
    // Check for journeys with suspicious data patterns
    const { data: recentJourneys } = await supabase
      .from('journeys')
      .select('id, user_id, total_miles, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const journeysPerUser: Record<string, number> = {};
    recentJourneys?.forEach(j => {
      journeysPerUser[j.user_id] = (journeysPerUser[j.user_id] || 0) + 1;
    });

    const excessiveJourneyCreators = Object.entries(journeysPerUser)
      .filter(([_, count]) => count >= 5);

    if (excessiveJourneyCreators.length > 0) {
      findings.push({
        id: 'journey_abuse_' + Date.now(),
        category: MITRE_CATEGORIES.IMPACT,
        severity: 'low',
        title: 'Excessive Journey Creation',
        description: `${excessiveJourneyCreators.length} user(s) created 5+ journeys in 7 days. Verify legitimate usage.`,
        recommendation: 'Review for potential abuse of journey quota system.',
        auto_remediation_available: false,
      });
    }

    checks['data_integrity'] = {
      status: excessiveJourneyCreators.length > 0 ? 'info' : 'pass',
      journeys_created_last_week: recentJourneys?.length || 0,
      excessive_creators: excessiveJourneyCreators.length
    };

    // ========================================
    // NEW USER SPECIFIC CHECKS
    // ========================================
    
    if (targetUserId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      checks['new_user_profile'] = {
        status: userProfile ? 'pass' : 'warning',
        user_id: targetUserId,
        has_profile: !!userProfile
      };

      await supabase.from('security_audit_log').insert({
        user_id: targetUserId,
        action: 'user_created_audit',
        resource_type: 'user',
        resource_id: targetUserId,
        metadata: { audit_type: 'new_user_security_check', timestamp: new Date().toISOString() }
      });
    }

    // ========================================
    // GENERATE AUDIT SUMMARY
    // ========================================
    
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;
    const lowFindings = findings.filter(f => f.severity === 'low').length;

    const overallStatus = criticalFindings > 0 ? 'critical' :
                          highFindings > 0 ? 'high' :
                          mediumFindings > 0 ? 'medium' : 'healthy';

    const summary = {
      status: overallStatus,
      total_findings: findings.length,
      by_severity: {
        critical: criticalFindings,
        high: highFindings,
        medium: mediumFindings,
        low: lowFindings,
        info: findings.filter(f => f.severity === 'info').length,
      },
      remediation_applied: autoRemediate,
      remediation_count: remediationActions.filter(r => r.success).length,
      checks_performed: Object.keys(checks).length
    };

    // Store scan results
    const { data: scanResult, error: insertError } = await supabase
      .from('security_scan_results')
      .insert({
        scan_type: scanType,
        status: 'completed',
        trigger_source: triggerType,
        total_findings: findings.length,
        critical_count: criticalFindings,
        high_count: highFindings,
        medium_count: mediumFindings,
        low_count: lowFindings,
        findings: findings,
        checks_performed: checks,
        summary: summary,
        remediation_applied: autoRemediate && remediationActions.length > 0,
        remediation_details: remediationActions.length > 0 ? remediationActions : null,
        started_at: startedAt,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error storing scan results:', insertError);
    } else {
      scanResultId = scanResult?.id;
    }

    // Log to security audit log
    await supabase.from('security_audit_log').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      action: 'security_scan_completed',
      resource_type: 'system',
      resource_id: scanResultId,
      metadata: {
        trigger: triggerType,
        summary,
        checks_performed: Object.keys(checks).length,
        findings_count: findings.length,
        auto_remediate: autoRemediate,
        email_alerts_enabled: sendEmailAlerts
      }
    });

    // Send email notification for critical/high findings
    if (sendEmailAlerts && (criticalFindings > 0 || highFindings > 0)) {
      await sendSecurityAlert(findings, summary, scanResultId);
    }

    console.log(`Security audit completed: ${overallStatus}, ${findings.length} findings, ${remediationActions.filter(r => r.success).length} remediations applied`);

    return new Response(JSON.stringify({
      scan_id: scanResultId,
      trigger: triggerType,
      timestamp: new Date().toISOString(),
      summary,
      findings,
      checks,
      remediation_actions: remediationActions,
      email_sent: sendEmailAlerts && (criticalFindings > 0 || highFindings > 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Security audit error:', error);
    
    // Try to store failed scan result
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      await supabase.from('security_scan_results').insert({
        scan_type: 'full',
        status: 'failed',
        trigger_source: 'unknown',
        total_findings: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        findings: [],
        checks_performed: {},
        summary: { error: error instanceof Error ? error.message : 'Unknown error' },
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch {}

    return new Response(JSON.stringify({ 
      error: 'Security audit failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
