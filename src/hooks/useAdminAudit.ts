import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AuditAction = 
  | 'admin_login'
  | 'admin_logout'
  | 'view_user_data'
  | 'export_user_data'
  | 'role_change'
  | 'account_lock'
  | 'account_unlock'
  | 'account_suspend'
  | 'incident_create'
  | 'incident_resolve'
  | 'dsar_view'
  | 'dsar_process'
  | 'settings_change'
  | 'analytics_view'
  | 'security_review';

interface AuditMetadata {
  target_user_id?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  severity?: string;
  ip_address?: string;
  [key: string]: unknown;
}

export function useAdminAudit() {
  const { user } = useAuth();

  const logAuditEvent = async (
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    metadata?: AuditMetadata
  ) => {
    if (!user) {
      console.warn('Cannot log audit event: no authenticated user');
      return;
    }

    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            admin_user_id: user.id
          }
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      } else {
        console.log(`[AUDIT] ${action} on ${resourceType}`, { resourceId, metadata });
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  };

  // Convenience methods for common admin actions
  const logRoleChange = (targetUserId: string, oldRole: string, newRole: string) =>
    logAuditEvent('role_change', 'user', targetUserId, {
      target_user_id: targetUserId,
      old_value: oldRole,
      new_value: newRole
    });

  const logAccountAction = (
    action: 'account_lock' | 'account_unlock' | 'account_suspend',
    targetUserId: string,
    reason?: string,
    severity?: string
  ) =>
    logAuditEvent(action, 'user', targetUserId, {
      target_user_id: targetUserId,
      reason,
      severity
    });

  const logDataExport = (targetUserId: string) =>
    logAuditEvent('export_user_data', 'user', targetUserId, {
      target_user_id: targetUserId
    });

  const logAdminAccess = (section: string) =>
    logAuditEvent('admin_login', 'admin_portal', undefined, {
      section
    });

  const logAnalyticsView = (dateRange: string) =>
    logAuditEvent('analytics_view', 'analytics', undefined, {
      date_range: dateRange
    });

  const logSecurityReview = (reviewType: string) =>
    logAuditEvent('security_review', 'security', undefined, {
      review_type: reviewType
    });

  return {
    logAuditEvent,
    logRoleChange,
    logAccountAction,
    logDataExport,
    logAdminAccess,
    logAnalyticsView,
    logSecurityReview
  };
}
