import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type LocationPrivacy = 'exact' | 'city' | 'region' | 'state';
type MediaVisibility = 'public' | 'followers' | 'private';

interface PrivacySettingsData {
  default_location_privacy: LocationPrivacy;
  default_media_visibility: MediaVisibility;
  anonymize_username: boolean;
  display_name: string | null;
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettingsData>({
    default_location_privacy: 'city',
    default_media_visibility: 'followers',
    anonymize_username: false,
    display_name: null
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
          display_name: data.display_name
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
    <Card className="card-tesla">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control how your location and media are shared with others
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anonymize Username */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-base">Anonymize Profile</Label>
              <p className="text-sm text-muted-foreground">
                Hide your real name, show display name instead
              </p>
            </div>
          </div>
          <Switch
            checked={settings.anonymize_username}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, anonymize_username: checked }))}
          />
        </div>

        {settings.anonymize_username && (
          <div className="pl-4 border-l-2 border-primary/20">
            <Label>Display Name</Label>
            <Input
              value={settings.display_name || ''}
              onChange={(e) => setSettings(s => ({ ...s, display_name: e.target.value }))}
              placeholder="Enter a display name..."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will be shown publicly instead of your real name
            </p>
          </div>
        )}

        {/* Location Privacy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Label>Default Location Privacy</Label>
          </div>
          <Select
            value={settings.default_location_privacy}
            onValueChange={(value: LocationPrivacy) => setSettings(s => ({ ...s, default_location_privacy: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">
                <div className="flex items-center gap-2">
                  <span>Exact Location</span>
                  <Badge variant="outline" className="text-xs">Full GPS</Badge>
                </div>
              </SelectItem>
              <SelectItem value="city">
                <div className="flex items-center gap-2">
                  <span>City Level</span>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
              </SelectItem>
              <SelectItem value="region">
                <div className="flex items-center gap-2">
                  <span>Region (~50mi blur)</span>
                  <Badge variant="outline" className="text-xs">More Private</Badge>
                </div>
              </SelectItem>
              <SelectItem value="state">
                <div className="flex items-center gap-2">
                  <span>State Only</span>
                  <Badge variant="outline" className="text-xs">Most Private</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            You can override this per-post when sharing
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
  );
}
