import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Smartphone, Globe, MapPin, Zap, Camera, Loader2, CheckCircle2, Route, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Journey {
  id: string;
  name: string;
  is_public: boolean;
  is_complete: boolean;
  cover_image_url: string | null;
  user_id: string;
}

interface JourneyNotificationSetting {
  id?: string;
  journey_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  notify_new_waypoint: boolean;
  notify_state_crossing: boolean;
  notify_photos: boolean;
  notify_charging_stop: boolean;
}

export default function JourneyNotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [followedJourneys, setFollowedJourneys] = useState<Journey[]>([]);
  const [journeySettings, setJourneySettings] = useState<Record<string, JourneyNotificationSetting>>({});

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch journeys the user follows
      const { data: follows, error: followsError } = await supabase
        .from('journey_followers')
        .select(`
          journey_id,
          journeys:journey_id (
            id,
            name,
            is_public,
            is_complete,
            cover_image_url,
            user_id
          )
        `)
        .eq('follower_user_id', user?.id)
        .eq('approved', true);

      if (followsError) throw followsError;

      // Extract journey data
      const journeys = follows
        ?.map(f => f.journeys as unknown as Journey)
        .filter((j): j is Journey => j !== null && !j.is_complete) || [];
      
      setFollowedJourneys(journeys);

      // Fetch existing notification settings for these journeys
      if (journeys.length > 0) {
        const { data: settings, error: settingsError } = await supabase
          .from('journey_notification_settings')
          .select('*')
          .eq('user_id', user?.id)
          .in('journey_id', journeys.map(j => j.id));

        if (settingsError) throw settingsError;

        const settingsMap: Record<string, JourneyNotificationSetting> = {};
        
        // Initialize with defaults for all followed journeys
        journeys.forEach(j => {
          settingsMap[j.id] = {
            journey_id: j.id,
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            notify_new_waypoint: true,
            notify_state_crossing: true,
            notify_photos: true,
            notify_charging_stop: false,
          };
        });

        // Override with existing settings
        settings?.forEach(s => {
          settingsMap[s.journey_id] = {
            id: s.id,
            journey_id: s.journey_id,
            email_enabled: s.email_enabled ?? true,
            sms_enabled: s.sms_enabled ?? false,
            push_enabled: s.push_enabled ?? true,
            notify_new_waypoint: s.notify_new_waypoint ?? true,
            notify_state_crossing: s.notify_state_crossing ?? true,
            notify_photos: s.notify_photos ?? true,
            notify_charging_stop: s.notify_charging_stop ?? false,
          };
        });

        setJourneySettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching journey notification data:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveJourneySettings = async (journeyId: string) => {
    if (!user) return;
    setSaving(journeyId);

    const settings = journeySettings[journeyId];
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('journey_notification_settings')
        .upsert({
          user_id: user.id,
          journey_id: journeyId,
          email_enabled: settings.email_enabled,
          sms_enabled: settings.sms_enabled,
          push_enabled: settings.push_enabled,
          notify_new_waypoint: settings.notify_new_waypoint,
          notify_state_crossing: settings.notify_state_crossing,
          notify_photos: settings.notify_photos,
          notify_charging_stop: settings.notify_charging_stop,
        }, { onConflict: 'user_id,journey_id' });

      if (error) throw error;
      toast.success('Journey notification settings saved');
    } catch (error) {
      console.error('Error saving journey notification settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const updateSetting = (journeyId: string, key: keyof JourneyNotificationSetting, value: boolean) => {
    setJourneySettings(prev => ({
      ...prev,
      [journeyId]: {
        ...prev[journeyId],
        [key]: value,
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-tesla">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Per-Journey Notifications
        </CardTitle>
        <CardDescription>
          Configure notification preferences for each journey you follow. Completed journeys will no longer send notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {followedJourneys.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You're not following any active journeys</p>
            <p className="text-sm text-muted-foreground mt-1">
              Follow journeys on the Explore page to configure notifications
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {followedJourneys.map((journey) => {
                const settings = journeySettings[journey.id];
                if (!settings) return null;

                return (
                  <div key={journey.id} className="border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {journey.cover_image_url ? (
                          <img 
                            src={journey.cover_image_url} 
                            alt={journey.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Route className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold">{journey.name}</h4>
                          <div className="flex items-center gap-2">
                            {journey.is_public && (
                              <Badge variant="secondary" className="text-xs">Public</Badge>
                            )}
                            {journey.is_complete && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Channels */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <Mail className="w-4 h-4 text-primary" />
                        <Label className="text-xs">Email</Label>
                        <Switch
                          checked={settings.email_enabled}
                          onCheckedChange={(v) => updateSetting(journey.id, 'email_enabled', v)}
                          className="ml-auto scale-75"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <Smartphone className="w-4 h-4 text-sunset" />
                        <Label className="text-xs">SMS</Label>
                        <Switch
                          checked={settings.sms_enabled}
                          onCheckedChange={(v) => updateSetting(journey.id, 'sms_enabled', v)}
                          className="ml-auto scale-75"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <Globe className="w-4 h-4 text-forest" />
                        <Label className="text-xs">Push</Label>
                        <Switch
                          checked={settings.push_enabled}
                          onCheckedChange={(v) => updateSetting(journey.id, 'push_enabled', v)}
                          className="ml-auto scale-75"
                        />
                      </div>
                    </div>

                    {/* Notification Types */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">Waypoints</span>
                        </div>
                        <Switch
                          checked={settings.notify_new_waypoint}
                          onCheckedChange={(v) => updateSetting(journey.id, 'notify_new_waypoint', v)}
                          className="scale-75"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">State crossings</span>
                        </div>
                        <Switch
                          checked={settings.notify_state_crossing}
                          onCheckedChange={(v) => updateSetting(journey.id, 'notify_state_crossing', v)}
                          className="scale-75"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Camera className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">Photos</span>
                        </div>
                        <Switch
                          checked={settings.notify_photos}
                          onCheckedChange={(v) => updateSetting(journey.id, 'notify_photos', v)}
                          className="scale-75"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">Charging</span>
                        </div>
                        <Switch
                          checked={settings.notify_charging_stop}
                          onCheckedChange={(v) => updateSetting(journey.id, 'notify_charging_stop', v)}
                          className="scale-75"
                        />
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => saveJourneySettings(journey.id)}
                      disabled={saving === journey.id}
                    >
                      {saving === journey.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Save for {journey.name}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
