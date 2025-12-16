import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Smartphone, Globe, MapPin, Zap, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SMSConsentDialog from './SMSConsentDialog';

interface NotificationPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  phone_number: string | null;
  email_digest_frequency: 'realtime' | 'daily' | 'weekly';
  notify_new_waypoint: boolean;
  notify_charging_stop: boolean;
  notify_state_crossing: boolean;
  notify_photos: boolean;
  sms_consent_given: boolean;
  sms_consent_timestamp: string | null;
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    phone_number: null,
    email_digest_frequency: 'daily',
    notify_new_waypoint: true,
    notify_charging_stop: false,
    notify_state_crossing: true,
    notify_photos: true,
    sms_consent_given: false,
    sms_consent_timestamp: null
  });

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setPrefs({
          email_enabled: data.email_enabled ?? true,
          sms_enabled: data.sms_enabled ?? false,
          push_enabled: data.push_enabled ?? true,
          phone_number: data.phone_number,
          email_digest_frequency: (data.email_digest_frequency as 'realtime' | 'daily' | 'weekly') ?? 'daily',
          notify_new_waypoint: data.notify_new_waypoint ?? true,
          notify_charging_stop: data.notify_charging_stop ?? false,
          notify_state_crossing: data.notify_state_crossing ?? true,
          notify_photos: data.notify_photos ?? true,
          sms_consent_given: data.sms_consent_given ?? false,
          sms_consent_timestamp: data.sms_consent_timestamp
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...prefs
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPrefs(p => ({ ...p, push_enabled: true }));
      toast.success('Push notifications enabled');
    } else {
      toast.error('Push notification permission denied');
    }
  };

  const handleSMSConsent = async (consented: boolean, timestamp: string, phoneNumber?: string) => {
    if (!user) return;

    if (consented && phoneNumber) {
      // Log consent for compliance
      try {
        await supabase.from('sms_consent_log').insert({
          user_id: user.id,
          phone_number: phoneNumber,
          action: 'opt_in',
          consent_given: true,
          consent_timestamp: timestamp,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Error logging SMS consent:', error);
      }

      // Update preferences with consent
      setPrefs(p => ({
        ...p,
        sms_enabled: true,
        phone_number: phoneNumber,
        sms_consent_given: true,
        sms_consent_timestamp: timestamp
      }));
      toast.success('SMS notifications enabled');
    } else {
      toast.info('SMS notifications not enabled');
    }
    setPendingPhoneNumber('');
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
          <Bell className="w-5 h-5 text-primary" />
          Journey Notification Settings
        </CardTitle>
        <CardDescription>
          Choose how you receive updates for journeys you follow. These apply per-journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Channels
          </h3>

          {/* Email */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, email_enabled: checked }))}
            />
          </div>

          {prefs.email_enabled && (
            <div className="pl-4 border-l-2 border-primary/20">
              <Label>Email Frequency</Label>
              <Select
                value={prefs.email_digest_frequency}
                onValueChange={(value: 'realtime' | 'daily' | 'weekly') => 
                  setPrefs(p => ({ ...p, email_digest_frequency: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time (instant)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* SMS */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sunset/10">
                <Smartphone className="w-5 h-5 text-sunset" />
              </div>
              <div>
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Major updates via text message
                  <Badge variant="outline" className="ml-2 text-xs">Premium</Badge>
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.sms_enabled}
              onCheckedChange={(checked) => {
                if (checked && !prefs.sms_consent_given) {
                  // Need consent first - prompt for phone number then show dialog
                  setPendingPhoneNumber(prefs.phone_number || '');
                  setShowConsentDialog(true);
                } else {
                  setPrefs(p => ({ ...p, sms_enabled: checked }));
                }
              }}
            />
          </div>

          {prefs.sms_enabled && (
            <div className="pl-4 border-l-2 border-sunset/20 space-y-3">
              {/* Consent Status */}
              {prefs.sms_consent_given && (
                <div className="flex items-center gap-2 text-sm text-forest">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Consent given {prefs.sms_consent_timestamp && 
                      `on ${new Date(prefs.sms_consent_timestamp).toLocaleDateString()}`
                    }
                  </span>
                </div>
              )}
              
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={prefs.phone_number || ''}
                  onChange={(e) => {
                    const newNumber = e.target.value;
                    // If phone number changed, require new consent
                    if (newNumber !== prefs.phone_number && prefs.sms_consent_given) {
                      setPendingPhoneNumber(newNumber);
                      setShowConsentDialog(true);
                    } else {
                      setPrefs(p => ({ ...p, phone_number: newNumber }));
                    }
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Standard messaging rates may apply. Reply STOP to opt out at any time.
              </p>
            </div>
          )}

          {/* Push */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-forest/10">
                <Globe className="w-5 h-5 text-forest" />
              </div>
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser/PWA notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!prefs.push_enabled && (
                <Button size="sm" variant="outline" onClick={requestPushPermission}>
                  Enable
                </Button>
              )}
              <Switch
                checked={prefs.push_enabled}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, push_enabled: checked }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            What to Notify
          </h3>

          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>New waypoints & stops</span>
              </div>
              <Switch
                checked={prefs.notify_new_waypoint}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, notify_new_waypoint: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-forest" />
                <span>State border crossings</span>
              </div>
              <Switch
                checked={prefs.notify_state_crossing}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, notify_state_crossing: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sunset" />
                <span>New photos & media</span>
              </div>
              <Switch
                checked={prefs.notify_photos}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, notify_photos: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Charging sessions</span>
              </div>
              <Switch
                checked={prefs.notify_charging_stop}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, notify_charging_stop: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Notification Settings'
          )}
        </Button>
      </CardContent>

      {/* SMS Consent Dialog */}
      <SMSConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        phoneNumber={pendingPhoneNumber || prefs.phone_number || ''}
        onConsent={handleSMSConsent}
      />
    </Card>
  );
}
