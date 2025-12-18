import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    try {
      const body = await req.json();
      triggerType = body.trigger || 'manual';
      targetUserId = body.userId || null;
      autoRemediate = body.autoRemediate || false;
      scanType = body.scanType || 'full';
    } catch {
      // No body, manual trigger
    }

    console.log(`Security audit triggered: ${triggerType}, autoRemediate: ${autoRemediate}`);

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
    failedLogins?.forEach(log => {
      failedLoginsByEmail[log.email] = (failedLoginsByEmail[log.email] || 0) + 1;
    });

    const suspiciousEmails = Object.entries(failedLoginsByEmail)
      .filter(([_, count]) => count >= 5);
    
    if (suspiciousEmails.length > 0) {
      const findingId = 'bf_' + Date.now();
      findings.push({
        id: findingId,
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: 'high',
        title: 'Potential Brute Force Attack Detected',
        description: `${suspiciousEmails.length} account(s) have 5+ failed login attempts in the last 24 hours: ${suspiciousEmails.map(([email]) => email.substring(0, 3) + '***').join(', ')}`,
        mitre_technique: 'T1110 - Brute Force',
        recommendation: 'Review login patterns and consider implementing additional rate limiting.',
        auto_remediation_available: true,
      });

      // Auto-remediation: Lock accounts with excessive failed attempts
      if (autoRemediate) {
        for (const [email] of suspiciousEmails.filter(([_, count]) => count >= 10)) {
          const { error } = await supabase
            .from('account_lockouts')
            .upsert({
              email,
              locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min lockout
              lock_reason: 'Auto-locked: excessive failed login attempts',
              failed_attempts: failedLoginsByEmail[email]
            }, { onConflict: 'email' });

          remediationActions.push({
            finding_id: findingId,
            action: `Lock account: ${email.substring(0, 3)}***`,
            success: !error,
            details: error ? error.message : 'Account locked for 30 minutes'
          });
        }
      }
    }

    checks['brute_force_detection'] = {
      status: suspiciousEmails.length > 0 ? 'warning' : 'pass',
      suspicious_accounts: suspiciousEmails.length,
      total_failed_attempts: failedLogins?.length || 0
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
        severity: 'medium',
        title: 'Elevated Role Change Activity',
        description: `${recentRoleChanges.length} role changes in the last 7 days.`,
        mitre_technique: 'T1078.003 - Valid Accounts: Local Accounts',
        recommendation: 'Review all role changes for legitimacy.',
        auto_remediation_available: false,
      });
    }

    checks['role_change_monitoring'] = {
      status: (recentRoleChanges?.length || 0) > 5 ? 'warning' : 'pass',
      changes_last_7_days: recentRoleChanges?.length || 0
    };

    // Check admin user count
    const { count: adminCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminCount && adminCount > 5) {
      findings.push({
        id: 'admin_' + Date.now(),
        category: MITRE_CATEGORIES.PRIVILEGE_ESCALATION,
        severity: 'medium',
        title: 'High Number of Admin Users',
        description: `${adminCount} users have admin privileges. Consider principle of least privilege.`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Review admin accounts and remove unnecessary privileges.',
        auto_remediation_available: false,
      });
    }

    checks['admin_count'] = {
      status: (adminCount || 0) > 5 ? 'warning' : 'pass',
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
      const findingId = 'cred_' + Date.now();
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
          .update({ is_valid: false, error_message: 'Auto-invalidated: stale credential' })
          .in('id', staleCredentials.map(c => c.id));

        remediationActions.push({
          finding_id: findingId,
          action: `Invalidate ${staleCredentials.length} stale credentials`,
          success: !error,
          details: error ? error.message : 'Credentials marked as invalid for re-verification'
        });
      }
    }

    checks['api_credentials'] = {
      status: (staleCredentials?.length || 0) > 0 ? 'info' : 'pass',
      stale_credentials: staleCredentials?.length || 0
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
        severity: 'high',
        title: 'Elevated Data Export Activity',
        description: `${dataExports.length} data exports in the last 24 hours.`,
        mitre_technique: 'T1567 - Exfiltration Over Web Service',
        recommendation: 'Review export logs for unauthorized data access.',
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
    const { count: lockedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('account_status', ['locked', 'suspended']);

    checks['locked_accounts'] = {
      status: 'info',
      count: lockedCount || 0
    };

    // Check for unresolved incidents
    const { data: openIncidents, count: incidentCount } = await supabase
      .from('incident_log')
      .select('*', { count: 'exact' })
      .eq('resolved', false);

    if (incidentCount && incidentCount > 0) {
      findings.push({
        id: 'incident_' + Date.now(),
        category: MITRE_CATEGORIES.IMPACT,
        severity: incidentCount > 5 ? 'high' : 'medium',
        title: 'Unresolved Security Incidents',
        description: `${incidentCount} security incidents remain unresolved.`,
        recommendation: 'Review and remediate all open incidents.',
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

    checks['session_security'] = {
      status: 'pass',
      expired_lockouts_cleared: expiredLockouts?.length || 0
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
        recommendation: 'Review and clean up orphaned media files.',
        auto_remediation_available: false,
      });
    }

    checks['storage_security'] = {
      status: (orphanedMedia?.length || 0) > 0 ? 'info' : 'pass',
      orphaned_files: orphanedMedia?.length || 0
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
      remediation_count: remediationActions.filter(r => r.success).length
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
        auto_remediate: autoRemediate
      }
    });

    console.log(`Security audit completed: ${overallStatus}, ${findings.length} findings, ${remediationActions.filter(r => r.success).length} remediations applied`);

    return new Response(JSON.stringify({
      scan_id: scanResultId,
      trigger: triggerType,
      timestamp: new Date().toISOString(),
      summary,
      findings,
      checks,
      remediation_actions: remediationActions
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
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
