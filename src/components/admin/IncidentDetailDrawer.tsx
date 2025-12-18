import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldAlert, User, Clock, Bell, CheckCircle, XCircle, 
  Lock, Unlock, Ban, RefreshCw, FileText, Activity, Send,
  AlertTriangle, Eye, History
} from 'lucide-react';

interface Incident {
  id: string;
  user_id: string;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string | null;
  notification_sent: boolean;
  notification_channels: string[];
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  created_by?: string;
}

interface IncidentDetailDrawerProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

interface UserInfo {
  email: string;
  full_name: string | null;
  account_status: string;
}

interface RelatedActivity {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  ip_address: string | null;
}

export function IncidentDetailDrawer({ incident, open, onOpenChange, onRefresh }: IncidentDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [relatedActivity, setRelatedActivity] = useState<RelatedActivity[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (incident && open) {
      fetchDetails();
    }
  }, [incident, open]);

  const fetchDetails = async () => {
    if (!incident) return;
    setLoading(true);
    try {
      // Fetch user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, account_status')
        .eq('user_id', incident.user_id)
        .single();

      // Fetch user email via admin function
      const { data: userData } = await supabase.functions.invoke('admin-users', {
        body: { action: 'getUser', userId: incident.user_id }
      });

      setUserInfo({
        email: userData?.email || 'Unknown',
        full_name: profile?.full_name || null,
        account_status: profile?.account_status || 'unknown'
      });

      // Fetch related activity
      const { data: activity } = await supabase
        .from('security_audit_log')
        .select('id, action, resource_type, created_at, ip_address')
        .eq('user_id', incident.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRelatedActivity(activity || []);
    } catch (error) {
      console.error('Error fetching incident details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!incident) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('incident_log')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          action_taken: resolutionNotes || 'Marked as resolved by admin'
        })
        .eq('id', incident.id);

      if (error) throw error;

      // Log the resolution
      await supabase.from('security_audit_log').insert({
        user_id: incident.user_id,
        action: 'incident_resolved',
        resource_type: 'incident',
        resource_id: incident.id,
        metadata: { resolution_notes: resolutionNotes }
      });

      toast({ title: 'Incident Resolved', description: 'The incident has been marked as resolved.' });
      onRefresh?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error resolving incident:', error);
      toast({ title: 'Error', description: 'Failed to resolve incident', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccountAction = async (action: 'lock' | 'unlock' | 'suspend') => {
    if (!incident) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('incident-remediation', {
        body: {
          action,
          userId: incident.user_id,
          reason: `Remediation for incident: ${incident.incident_type}`,
          severity: incident.severity,
          sendNotifications: true
        }
      });

      if (error) throw error;

      toast({ 
        title: `Account ${action.charAt(0).toUpperCase() + action.slice(1)}ed`, 
        description: `User account has been ${action}ed.` 
      });
      fetchDetails();
      onRefresh?.();
    } catch (error) {
      console.error('Error performing account action:', error);
      toast({ title: 'Error', description: 'Failed to perform action', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive/80 text-destructive-foreground';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return '';
    }
  };

  if (!incident) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              incident.resolved ? 'bg-success/20' : 'bg-destructive/20'
            }`}>
              <ShieldAlert className={`w-6 h-6 ${incident.resolved ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <SheetTitle className="text-left flex items-center gap-2">
                Security Incident
                {incident.resolved && <CheckCircle className="w-4 h-4 text-success" />}
              </SheetTitle>
              <SheetDescription className="text-left">
                {incident.incident_type.replace(/_/g, ' ')}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getSeverityColor(incident.severity)}>
              {incident.severity.toUpperCase()}
            </Badge>
            <Badge variant={incident.resolved ? 'outline' : 'destructive'}>
              {incident.resolved ? 'Resolved' : 'Open'}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              ID: {incident.id.slice(0, 8)}...
            </span>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Incident Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Incident Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {incident.resolved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{format(new Date(incident.resolved_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                <Separator />
                <div>
                  <span className="text-muted-foreground block mb-1">Description</span>
                  <p>{incident.description || 'No description provided'}</p>
                </div>
                {incident.action_taken && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Action Taken</span>
                    <p>{incident.action_taken}</p>
                  </div>
                )}
                {incident.notification_sent && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span>Notified via: {incident.notification_channels?.join(', ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Affected User */}
            {userInfo && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" /> Affected User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{userInfo.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{userInfo.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Status</span>
                    <Badge variant={userInfo.account_status === 'active' ? 'outline' : 'destructive'}>
                      {userInfo.account_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remediation Actions */}
            {!incident.resolved && (
              <Card className="border-amber-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-4 h-4" /> Remediation Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {userInfo?.account_status === 'locked' || userInfo?.account_status === 'suspended' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="col-span-3 border-success/50 text-success hover:bg-success/10"
                        onClick={() => handleAccountAction('unlock')}
                        disabled={actionLoading}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Unlock Account
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAccountAction('lock')}
                          disabled={actionLoading}
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          Lock
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-amber-500/50 text-amber-500"
                          onClick={() => handleAccountAction('suspend')}
                          disabled={actionLoading}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Resolution Notes</label>
                    <Textarea 
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Document the remediation steps taken..."
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-success hover:bg-success/90"
                    onClick={handleResolve}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    Mark as Resolved
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Related Activity */}
            {relatedActivity.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent User Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {relatedActivity.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-center justify-between text-xs p-2 bg-secondary/30 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{activity.action}</span>
                          <span className="text-muted-foreground">{activity.resource_type}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
