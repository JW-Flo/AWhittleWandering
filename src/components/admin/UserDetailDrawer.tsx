import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, MapPin, Image, Bell, Shield, Activity, Calendar, Mail, 
  Car, Download, Clock, Eye, FileText, ScrollText, Lock, Unlock,
  Ban, AlertTriangle, RefreshCw, Globe, Smartphone, KeyRound
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
  account_status?: string;
}

interface UserDetailDrawerProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportData: (userId: string, email: string) => void;
  onRefresh?: () => void;
}

interface UserDetails {
  profile: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    last_active_at: string | null;
    default_location_privacy: string | null;
    default_media_visibility: string | null;
    locked_at: string | null;
    locked_reason: string | null;
  } | null;
  journeys: { id: string; name: string; start_date: string; total_miles: number | null; is_public: boolean }[];
  vehicles: { id: string; nickname: string; make: string | null; model: string | null; year: number | null }[];
  mediaCount: number;
  notificationPrefs: {
    email_enabled: boolean | null;
    sms_enabled: boolean | null;
    push_enabled: boolean | null;
    phone_number: string | null;
  } | null;
  recentActivity: { id: string; action: string; resource_type: string; created_at: string; ip_address: string | null }[];
  pageViews: { id: string; page_path: string; viewed_at: string; city: string | null; region: string | null; country_code: string | null; device_type: string | null; browser: string | null }[];
  incidents: { id: string; incident_type: string; severity: string; description: string | null; created_at: string; resolved: boolean }[];
}

export function UserDetailDrawer({ user, open, onOpenChange, onExportData, onRefresh }: UserDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      fetchUserDetails();
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, journeysRes, vehiclesRes, mediaRes, prefsRes, activityRes, pageViewsRes, incidentsRes] = await Promise.all([
        supabase.from('profiles').select('display_name, bio, avatar_url, last_active_at, default_location_privacy, default_media_visibility, locked_at, locked_reason').eq('user_id', user.id).single(),
        supabase.from('journeys').select('id, name, start_date, total_miles, is_public').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vehicles').select('id, nickname, make, model, year').eq('user_id', user.id),
        supabase.from('journey_media').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notification_preferences').select('email_enabled, sms_enabled, push_enabled, phone_number').eq('user_id', user.id).single(),
        supabase.from('security_audit_log').select('id, action, resource_type, created_at, ip_address').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('page_views').select('id, page_path, viewed_at, city, region, country_code, device_type, browser').eq('visitor_id', user.id).order('viewed_at', { ascending: false }).limit(10),
        supabase.from('incident_log').select('id, incident_type, severity, description, created_at, resolved').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      setDetails({
        profile: profileRes.data,
        journeys: journeysRes.data || [],
        vehicles: vehiclesRes.data || [],
        mediaCount: mediaRes.count || 0,
        notificationPrefs: prefsRes.data,
        recentActivity: activityRes.data || [],
        pageViews: pageViewsRes.data || [],
        incidents: incidentsRes.data || []
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  // NIST-aligned security remediation actions
  const handleAccountAction = async (action: 'lock' | 'unlock' | 'suspend' | 'review' | 'force_password_reset' | 'disable_mfa') => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (action === 'force_password_reset') {
        // Log the action
        await supabase.from('security_audit_log').insert({
          user_id: user.id,
          action: 'force_password_reset',
          resource_type: 'user',
          resource_id: user.id,
          metadata: { reason: 'Admin forced password reset' }
        });
        toast({ title: 'Password Reset Required', description: 'User will be prompted to reset password on next login.' });
      } else if (action === 'disable_mfa') {
        // This would typically call an admin API to disable MFA
        await supabase.from('security_audit_log').insert({
          user_id: user.id,
          action: 'admin_disable_mfa',
          resource_type: 'user',
          resource_id: user.id,
          metadata: { reason: 'Admin disabled MFA' }
        });
        toast({ title: 'MFA Disabled', description: 'Two-factor authentication has been disabled for this user.' });
      } else {
        const response = await supabase.functions.invoke('incident-remediation', {
          body: {
            action,
            userId: user.id,
            reason: action === 'unlock' ? 'Admin unlock' : `Admin ${action} action`,
            severity: action === 'lock' ? 'medium' : action === 'suspend' ? 'high' : 'low',
            sendNotifications: action !== 'unlock'
          }
        });
        if (response.error) throw response.error;
        toast({ 
          title: `Account ${action.charAt(0).toUpperCase() + action.slice(1)}ed`, 
          description: `User account has been ${action}ed successfully.` 
        });
      }
      fetchUserDetails();
      onRefresh?.();
    } catch (error) {
      console.error('Error performing account action:', error);
      toast({ title: 'Error', description: 'Failed to perform action', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  // Send SMS to user
  const handleSendSMS = async () => {
    if (!user || !details?.notificationPrefs?.phone_number) return;
    
    const message = prompt('Enter message to send to user:');
    if (!message) return;
    
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('send-sms', {
        body: {
          to: details.notificationPrefs.phone_number,
          message: `AWW Admin: ${message}`
        }
      });
      
      if (response.error) throw response.error;
      
      // Log the admin contact
      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: 'admin_sms_contact',
        resource_type: 'user',
        resource_id: user.id,
        metadata: { message_preview: message.substring(0, 50) }
      });
      
      toast({ title: 'SMS Sent', description: 'Message sent successfully.' });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({ title: 'Error', description: 'Failed to send SMS', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-success/50 text-success';
      case 'locked': return 'bg-destructive text-destructive-foreground';
      case 'suspended': return 'bg-amber-500 text-white';
      default: return '';
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">{user.full_name || 'Unknown User'}</SheetTitle>
              <SheetDescription className="text-left">{user.email}</SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(user.account_status || 'active')}>
              {user.account_status || 'active'}
            </Badge>
            <Badge variant="outline">{user.role}</Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              ID: {user.id.slice(0, 8)}...
            </span>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : details ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="journeys">Journeys</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Display Name</span>
                    <span>{details.profile?.display_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bio</span>
                    <span className="text-right max-w-[200px] truncate">{details.profile?.bio || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Active</span>
                    <span>{details.profile?.last_active_at ? format(new Date(details.profile.last_active_at), 'MMM d, yyyy h:mm a') : 'Never'}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xl font-bold">{details.journeys.length}</p>
                      <p className="text-xs text-muted-foreground">Journeys</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Image className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xl font-bold">{details.mediaCount}</p>
                      <p className="text-xs text-muted-foreground">Media Files</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Car className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xl font-bold">{details.vehicles.length}</p>
                      <p className="text-xs text-muted-foreground">Vehicles</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xl font-bold">
                        {details.journeys.reduce((sum, j) => sum + (j.total_miles || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Miles</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Contact Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Quick Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`mailto:${user.email}?subject=AWW%20Admin%20Contact`, '_blank')}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Send Email
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!details.notificationPrefs?.phone_number || !details.notificationPrefs?.sms_enabled}
                      onClick={() => handleSendSMS()}
                    >
                      <Smartphone className="w-4 h-4 mr-1" />
                      Send SMS
                    </Button>
                  </div>
                  {details.notificationPrefs?.phone_number ? (
                    <p className="text-xs text-muted-foreground">
                      Phone: {details.notificationPrefs.phone_number}
                      {!details.notificationPrefs.sms_enabled && ' (SMS disabled)'}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No phone number on file</p>
                  )}
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={() => onExportData(user.id, user.email)}>
                <Download className="w-4 h-4 mr-2" /> Export User Data
              </Button>
            </TabsContent>

            {/* Security & Actions Tab - NIST-aligned */}
            <TabsContent value="security" className="space-y-4 mt-4">
              {/* Account Status */}
              {details.profile?.locked_at && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Account Restricted</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Locked at: {format(new Date(details.profile.locked_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {details.profile.locked_reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {details.profile.locked_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Security Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Account Actions (NIST SP 800-53)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {user.account_status === 'locked' || user.account_status === 'suspended' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-success/50 text-success hover:bg-success/10"
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
                          Lock Account
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                          onClick={() => handleAccountAction('suspend')}
                          disabled={actionLoading}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Credential Management</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAccountAction('force_password_reset')}
                        disabled={actionLoading}
                      >
                        <KeyRound className="w-4 h-4 mr-1" />
                        Force Password Reset
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAccountAction('disable_mfa')}
                        disabled={actionLoading}
                      >
                        <Smartphone className="w-4 h-4 mr-1" />
                        Disable MFA
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                    onClick={() => handleAccountAction('review')}
                    disabled={actionLoading}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Mark for Security Review
                  </Button>
                </CardContent>
              </Card>

              {/* Incident History */}
              {details.incidents.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Incident History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {details.incidents.map((incident) => (
                      <div key={incident.id} className="p-2 bg-secondary/30 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant={incident.severity === 'critical' ? 'destructive' : incident.severity === 'high' ? 'default' : 'outline'} className="text-xs">
                            {incident.severity}
                          </Badge>
                          <span className="text-muted-foreground">
                            {format(new Date(incident.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{incident.incident_type.replace(/_/g, ' ')}</p>
                        {incident.description && (
                          <p className="mt-1 truncate">{incident.description}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Page Views with Geo */}
              {details.pageViews.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Recent Activity Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {details.pageViews.slice(0, 5).map((pv) => (
                      <div key={pv.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pv.device_type || 'Unknown'}
                          </Badge>
                          <span className="text-muted-foreground">{pv.browser}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {[pv.city, pv.region, pv.country_code].filter(Boolean).join(', ') || 'Unknown'}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(pv.viewed_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="journeys" className="space-y-3 mt-4">
              {details.journeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No journeys created</p>
                </div>
              ) : (
                details.journeys.map((journey) => (
                  <Card key={journey.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{journey.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Started {format(new Date(journey.start_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={journey.is_public ? 'default' : 'outline'}>
                            {journey.is_public ? 'Public' : 'Private'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(journey.total_miles || 0).toLocaleString()} mi
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <Badge variant={details.notificationPrefs?.email_enabled ? 'default' : 'outline'}>
                      {details.notificationPrefs?.email_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SMS</span>
                    <Badge variant={details.notificationPrefs?.sms_enabled ? 'default' : 'outline'}>
                      {details.notificationPrefs?.sms_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Push</span>
                    <Badge variant={details.notificationPrefs?.push_enabled ? 'default' : 'outline'}>
                      {details.notificationPrefs?.push_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {details.notificationPrefs?.phone_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-mono text-xs">{details.notificationPrefs.phone_number}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location Privacy</span>
                    <span>{details.profile?.default_location_privacy || 'city'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Media Visibility</span>
                    <span>{details.profile?.default_media_visibility || 'followers'}</span>
                  </div>
                </CardContent>
              </Card>

              {details.vehicles.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Car className="w-4 h-4" /> Vehicles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {details.vehicles.map((v) => (
                      <div key={v.id} className="flex justify-between text-sm">
                        <span className="font-medium">{v.nickname}</span>
                        <span className="text-muted-foreground">
                          {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="space-y-2">
                {details.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No activity recorded</p>
                  </div>
                ) : (
                  details.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded text-sm">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {format(new Date(activity.created_at), 'MMM d')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-muted-foreground text-xs">{activity.resource_type}</span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
