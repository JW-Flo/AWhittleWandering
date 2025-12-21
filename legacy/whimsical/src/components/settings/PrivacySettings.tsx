import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Shield, MapPin, Eye, EyeOff, User, Loader2, Clock, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type LocationPrivacy = 'exact' | 'city' | 'region' | 'state';

const LOCATION_PRIVACY_INFO: Record<LocationPrivacy, { title: string; description: string; warning?: string }> = {
  exact: {
    title: 'Exact Location',
    description: 'Your precise GPS coordinates are shared with followers and on public journeys. This shows your exact real-time position.',
    warning: 'Not recommended for safety reasons. Others can see exactly where you are.'
  },
  city: {
    title: 'City Level',
    description: 'Your location is generalized to a ~5 mile radius. Followers see which city you\'re in without your exact position.',
  },
  region: {
    title: 'Region (~50mi blur)',
    description: 'Your location is blurred to a ~50 mile radius. This shows the general area without revealing specific locations.',
  },
  state: {
    title: 'State Only',
    description: 'Only the state you\'re currently in is shared. This provides maximum privacy while still allowing journey tracking.',
  }
};
type MediaVisibility = 'public' | 'followers' | 'private';

// Delay options in minutes
const DELAY_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
];

const formatDelay = (minutes: number): string => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? '1 hour' : `${hours} hours`;
};

interface PrivacySettingsData {
  default_location_privacy: LocationPrivacy;
  default_media_visibility: MediaVisibility;
  anonymize_username: boolean;
  display_name: string | null;
  location_delay_minutes: number;
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsData>({
    default_location_privacy: 'city',
    default_media_visibility: 'followers',
    anonymize_username: false,
    display_name: null,
    location_delay_minutes: 1440 // Default 24 hours
  });

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('default_location_privacy, default_media_visibility, anonymize_username, display_name')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          default_location_privacy: (data.default_location_privacy as LocationPrivacy) || 'city',
          default_media_visibility: (data.default_media_visibility as MediaVisibility) || 'followers',
          anonymize_username: data.anonymize_username || false,
          display_name: data.display_name,
          location_delay_minutes: 1440 // Store in profile when DB column added
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          default_location_privacy: settings.default_location_privacy,
          default_media_visibility: settings.default_media_visibility,
          anonymize_username: settings.anonymize_username,
          display_name: settings.display_name
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Privacy settings saved');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6">
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy & Tracking Settings
          </CardTitle>
          <CardDescription>
            Control how your location is shared and tracked during journeys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Tracking Privacy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Location Tracking Privacy</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Control how precisely your location is shared with followers and on public journeys
            </p>
            <Select
              value={settings.default_location_privacy}
              onValueChange={(value: LocationPrivacy) => setSettings(s => ({ ...s, default_location_privacy: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['exact', 'city', 'region', 'state'] as LocationPrivacy[]).map((level) => {
                  const info = LOCATION_PRIVACY_INFO[level];
                  return (
                    <HoverCard key={level} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <SelectItem value={level} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{info.title}</span>
                            {level === 'exact' && (
                              <Badge variant="destructive" className="text-xs">Full GPS visible</Badge>
                            )}
                            {level === 'city' && (
                              <Badge variant="secondary" className="text-xs">Recommended</Badge>
                            )}
                            {level === 'region' && (
                              <Badge variant="outline" className="text-xs">More Private</Badge>
                            )}
                            {level === 'state' && (
                              <Badge variant="outline" className="text-xs">Most Private</Badge>
                            )}
                            <Info className="w-3 h-3 text-muted-foreground ml-1" />
                          </div>
                        </SelectItem>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{info.title}</h4>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                          {info.warning && (
                            <p className="text-sm text-destructive font-medium">{info.warning}</p>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Display Name */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Label>Display Name (Username)</Label>
            </div>
            <Input
              value={settings.display_name || ''}
              onChange={(e) => setSettings(s => ({ ...s, display_name: e.target.value }))}
              placeholder="Your public username..."
            />
            <p className="text-xs text-muted-foreground">
              This name appears on leaderboards and public journeys. Choose something you're comfortable sharing.
            </p>
          </div>

          {/* Media Visibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label>Default Media Visibility</Label>
            </div>
            <Select
              value={settings.default_media_visibility}
              onValueChange={(value: MediaVisibility) => setSettings(s => ({ ...s, default_media_visibility: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Public - Anyone can view</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Followers Only - Approved followers</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    <span>Private - Only you</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Privacy Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Additional Privacy Controls */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-primary" />
            Advanced Privacy Controls
          </CardTitle>
          <CardDescription>
            Fine-tune your data sharing and visibility preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Anonymize on Leaderboards</Label>
                <p className="text-sm text-muted-foreground">Show as "Anonymous User" publicly</p>
              </div>
            </div>
            <Switch
              checked={settings.anonymize_username}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, anonymize_username: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Hide Exact Timestamps</Label>
                <p className="text-sm text-muted-foreground">Show dates only, not specific times</p>
              </div>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label>Location Delay for Public Journeys</Label>
                <p className="text-sm text-muted-foreground">
                  Public viewers see your location delayed by: <span className="font-medium text-foreground">{formatDelay(settings.location_delay_minutes)}</span>
                </p>
              </div>
            </div>
            <div className="px-2">
              <Slider
                value={[DELAY_OPTIONS.findIndex(o => o.value === settings.location_delay_minutes) >= 0 
                  ? DELAY_OPTIONS.findIndex(o => o.value === settings.location_delay_minutes)
                  : 6]}
                min={0}
                max={DELAY_OPTIONS.length - 1}
                step={1}
                onValueChange={(value) => {
                  setSettings(s => ({ ...s, location_delay_minutes: DELAY_OPTIONS[value[0]].value }));
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5 min</span>
                <span>12 hours</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Allow Profile Discovery</Label>
                <p className="text-sm text-muted-foreground">Others can find you via search</p>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <Button variant="outline" className="w-full" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Advanced Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
