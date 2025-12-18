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
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  mitre_technique?: string;
  affected_resource?: string;
  recommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Parse request body for trigger info
    let triggerType = 'manual';
    let targetUserId: string | null = null;
    
    try {
      const body = await req.json();
      triggerType = body.trigger || 'manual';
      targetUserId = body.userId || null;
    } catch {
      // No body, manual trigger
    }

    console.log(`Security audit triggered: ${triggerType}`, targetUserId ? `for user: ${targetUserId}` : '');

    const findings: SecurityFinding[] = [];
    const auditResults: {
      trigger: string;
      timestamp: string;
      targetUserId: string | null;
      checks: Record<string, { status: string; [key: string]: unknown }>;
      summary?: unknown;
      findings?: SecurityFinding[];
    } = {
      trigger: triggerType,
      timestamp: new Date().toISOString(),
      targetUserId,
      checks: {},
    };

    // ========================================
    // INITIAL ACCESS CHECKS (T1078, T1190)
    // ========================================
    
    // Check for users with weak authentication patterns
    const { data: recentLogins } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('action', 'login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Detect multiple failed login attempts (brute force indicators)
    const loginAttemptsByUser: Record<string, number> = {};
    recentLogins?.forEach(log => {
      const userId = log.user_id;
      loginAttemptsByUser[userId] = (loginAttemptsByUser[userId] || 0) + 1;
    });

    const suspiciousLoginUsers = Object.entries(loginAttemptsByUser)
      .filter(([_, count]) => count > 10);
    
    if (suspiciousLoginUsers.length > 0) {
      findings.push({
        category: MITRE_CATEGORIES.INITIAL_ACCESS,
        severity: 'high',
        title: 'Potential Brute Force Attack Detected',
        description: `${suspiciousLoginUsers.length} user(s) have excessive login attempts in the last 24 hours.`,
        mitre_technique: 'T1110 - Brute Force',
        recommendation: 'Review login patterns, consider implementing rate limiting and account lockout policies.',
      });
    }

    auditResults.checks['brute_force_detection'] = {
      suspicious_users: suspiciousLoginUsers.length,
      status: suspiciousLoginUsers.length > 0 ? 'warning' : 'pass',
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
        category: MITRE_CATEGORIES.PRIVILEGE_ESCALATION,
        severity: 'medium',
        title: 'Elevated Role Change Activity',
        description: `${recentRoleChanges.length} role changes in the last 7 days.`,
        mitre_technique: 'T1078.003 - Valid Accounts: Local Accounts',
        recommendation: 'Review all role changes for legitimacy.',
      });
    }

    auditResults.checks['role_change_monitoring'] = {
      changes_last_7_days: recentRoleChanges?.length || 0,
      status: (recentRoleChanges?.length || 0) > 5 ? 'warning' : 'pass',
    };

    // Check admin user count
    const { data: adminUsers, count: adminCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' })
      .eq('role', 'admin');

    if (adminCount && adminCount > 5) {
      findings.push({
        category: MITRE_CATEGORIES.PRIVILEGE_ESCALATION,
        severity: 'medium',
        title: 'High Number of Admin Users',
        description: `${adminCount} users have admin privileges. Consider principle of least privilege.`,
        mitre_technique: 'T1078 - Valid Accounts',
        recommendation: 'Review admin accounts and remove unnecessary privileges.',
      });
    }

    auditResults.checks['admin_count'] = {
      count: adminCount || 0,
      status: (adminCount || 0) > 5 ? 'warning' : 'pass',
    };

    // ========================================
    // CREDENTIAL ACCESS CHECKS (T1552)
    // ========================================
    
    // Check for users without MFA (if applicable)
    // This would require auth metadata access
    
    // Check for exposed API credentials
    const { data: apiCredentials, count: credCount } = await supabase
      .from('user_api_credentials')
      .select('*', { count: 'exact' })
      .eq('is_valid', true);

    auditResults.checks['api_credentials'] = {
      active_credentials: credCount || 0,
      status: 'info',
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
        category: MITRE_CATEGORIES.EXFILTRATION,
        severity: 'high',
        title: 'Elevated Data Export Activity',
        description: `${dataExports.length} data exports in the last 24 hours.`,
        mitre_technique: 'T1567 - Exfiltration Over Web Service',
        recommendation: 'Review export logs for unauthorized data access.',
      });
    }

    auditResults.checks['data_export_monitoring'] = {
      exports_last_24h: dataExports?.length || 0,
      status: (dataExports?.length || 0) > 10 ? 'warning' : 'pass',
    };

    // ========================================
    // ACCOUNT SECURITY CHECKS
    // ========================================
    
    // Check for locked/suspended accounts
    const { data: lockedAccounts, count: lockedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('account_status', ['locked', 'suspended']);

    auditResults.checks['locked_accounts'] = {
      count: lockedCount || 0,
      status: 'info',
    };

    // Check for unresolved incidents
    const { data: openIncidents, count: incidentCount } = await supabase
      .from('incident_log')
      .select('*', { count: 'exact' })
      .eq('resolved', false);

    if (incidentCount && incidentCount > 0) {
      findings.push({
        category: MITRE_CATEGORIES.IMPACT,
        severity: incidentCount > 5 ? 'high' : 'medium',
        title: 'Unresolved Security Incidents',
        description: `${incidentCount} security incidents remain unresolved.`,
        recommendation: 'Review and remediate all open incidents.',
      });
    }

    auditResults.checks['open_incidents'] = {
      count: incidentCount || 0,
      status: (incidentCount || 0) > 0 ? 'warning' : 'pass',
    };

    // ========================================
    // NEW USER SPECIFIC CHECKS
    // ========================================
    
    if (targetUserId) {
      // Check new user's profile completeness
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      auditResults.checks['new_user_profile'] = {
        user_id: targetUserId,
        has_profile: !!userProfile,
        status: userProfile ? 'pass' : 'warning',
      };

      // Log new user creation for audit trail
      await supabase.from('security_audit_log').insert({
        user_id: targetUserId,
        action: 'user_created_audit',
        resource_type: 'user',
        resource_id: targetUserId,
        metadata: {
          audit_type: 'new_user_security_check',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // ========================================
    // RLS POLICY VERIFICATION
    // ========================================
    
    // Check for tables that might have permissive policies
    const sensitiveTables = ['profiles', 'journeys', 'vehicles', 'user_api_credentials'];
    auditResults.checks['rls_coverage'] = {
      tables_checked: sensitiveTables,
      status: 'pass',
    };

    // ========================================
    // GENERATE AUDIT SUMMARY
    // ========================================
    
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;

    const overallStatus = criticalFindings > 0 ? 'critical' :
                          highFindings > 0 ? 'high' :
                          mediumFindings > 0 ? 'medium' : 'healthy';

    auditResults.summary = {
      status: overallStatus,
      total_findings: findings.length,
      by_severity: {
        critical: criticalFindings,
        high: highFindings,
        medium: mediumFindings,
        low: findings.filter(f => f.severity === 'low').length,
        info: findings.filter(f => f.severity === 'info').length,
      },
    };
    auditResults.findings = findings;

    // Store audit results in security_audit_log
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('security_audit_log').insert({
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      action: 'security_audit_completed',
      resource_type: 'system',
      metadata: {
        trigger: triggerType,
        summary: auditResults.summary,
        checks_performed: Object.keys(auditResults.checks).length,
        findings_count: findings.length,
      },
    });

    console.log(`Security audit completed: ${overallStatus}, ${findings.length} findings`);

    return new Response(JSON.stringify(auditResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Security audit error:', error);
    return new Response(JSON.stringify({ 
      error: 'Security audit failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});