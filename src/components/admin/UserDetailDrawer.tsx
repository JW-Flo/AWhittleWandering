import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, MapPin, Image, Bell, Shield, Activity, Calendar, Mail, 
  Car, Download, Clock, Eye, FileText, ScrollText 
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
}

interface UserDetails {
  profile: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    last_active_at: string | null;
    default_location_privacy: string | null;
    default_media_visibility: string | null;
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
  recentActivity: { id: string; action: string; resource_type: string; created_at: string }[];
}

export function UserDetailDrawer({ user, open, onOpenChange, onExportData }: UserDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (user && open) {
      fetchUserDetails();
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, journeysRes, vehiclesRes, mediaRes, prefsRes, activityRes] = await Promise.all([
        supabase.from('profiles').select('display_name, bio, avatar_url, last_active_at, default_location_privacy, default_media_visibility').eq('user_id', user.id).single(),
        supabase.from('journeys').select('id, name, start_date, total_miles, is_public').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vehicles').select('id, nickname, make, model, year').eq('user_id', user.id),
        supabase.from('journey_media').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notification_preferences').select('email_enabled, sms_enabled, push_enabled, phone_number').eq('user_id', user.id).single(),
        supabase.from('security_audit_log').select('id, action, resource_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      setDetails({
        profile: profileRes.data,
        journeys: journeysRes.data || [],
        vehicles: vehiclesRes.data || [],
        mediaCount: mediaRes.count || 0,
        notificationPrefs: prefsRes.data,
        recentActivity: activityRes.data || []
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
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
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
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

              <Button variant="outline" className="w-full" onClick={() => onExportData(user.id, user.email)}>
                <Download className="w-4 h-4 mr-2" /> Export User Data
              </Button>
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
