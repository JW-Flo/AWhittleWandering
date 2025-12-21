import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Mail, Globe, Clock, Download, Trash2, Loader2, Shield, History, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: null,
    full_name: null,
    bio: null,
    avatar_url: null
  });
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [activityTracking, setActivityTracking] = useState(true);
  const [dataRetention, setDataRetention] = useState('1year');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, full_name, bio, avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          full_name: profile.full_name,
          bio: profile.bio
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    toast.info('Preparing your data export...');
    
    try {
      // Fetch all user data
      const [profileRes, journeysRes, vehiclesRes, prefsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('journeys').select('*').eq('user_id', user?.id),
        supabase.from('vehicles').select('*').eq('user_id', user?.id),
        supabase.from('notification_preferences').select('*').eq('user_id', user?.id).single()
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user?.email,
        profile: profileRes.data,
        journeys: journeysRes.data,
        vehicles: vehiclesRes.data,
        notification_preferences: prefsRes.data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aww-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Log the deletion request
      await supabase.from('security_audit_log').insert({
        user_id: user?.id,
        action: 'account_deletion_requested',
        resource_type: 'account',
        metadata: { requested_at: new Date().toISOString() }
      });

      // Delete profile (cascades to related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Account deletion initiated');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account. Please contact support.');
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
      {/* Profile Information */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your public profile and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={profile.display_name || ''}
                onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
                placeholder="Your public username"
              />
              <p className="text-xs text-muted-foreground">Shown on leaderboards and public journeys</p>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name || ''}
                onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Input
              value={profile.bio || ''}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="A short bio about yourself"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2">
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <Badge variant="outline" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Session & Activity */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Session & Activity
          </CardTitle>
          <CardDescription>
            Control your session behavior and activity tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
            </div>
            <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Activity Tracking</Label>
                <p className="text-sm text-muted-foreground">Track your login history and actions</p>
              </div>
            </div>
            <Switch checked={activityTracking} onCheckedChange={setActivityTracking} />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label>Data Retention</Label>
                <p className="text-sm text-muted-foreground">How long to keep your journey data</p>
              </div>
            </div>
            <Select value={dataRetention} onValueChange={setDataRetention}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 months</SelectItem>
                <SelectItem value="1year">1 year</SelectItem>
                <SelectItem value="2years">2 years</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="card-tesla">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Download className="w-5 h-5 text-success" />
              </div>
              <div>
                <Label>Export Your Data</Label>
                <p className="text-sm text-muted-foreground">Download all your data as JSON</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-3">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All journeys and drive data</li>
                          <li>All media and photos</li>
                          <li>Vehicle configurations</li>
                          <li>Notification preferences</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
