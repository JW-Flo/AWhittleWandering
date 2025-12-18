import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PrivacySettings from '@/components/settings/PrivacySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import IntegrationsSettings from '@/components/settings/IntegrationsSettings';
import VehiclesSettings from '@/components/settings/VehiclesSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Bell, Lock, MailX, CheckCircle2, Link2, Car, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [unsubscribeHandled, setUnsubscribeHandled] = useState(false);
  const [processingUnsubscribe, setProcessingUnsubscribe] = useState(false);
  const [spotifyCallbackHandled, setSpotifyCallbackHandled] = useState(false);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      const spotifyCallback = searchParams.get('spotify_callback');
      const code = searchParams.get('code');
      
      if (spotifyCallback === 'true' && code && !spotifyCallbackHandled && user) {
        setSpotifyCallbackHandled(true);
        
        try {
          const { data, error } = await supabase.functions.invoke('spotify-auth', {
            body: { action: 'exchange_code', code }
          });
          
          if (error) throw error;
          
          toast({
            title: 'Spotify Connected!',
            description: data.display_name 
              ? `Connected as ${data.display_name}` 
              : 'Your Spotify account has been connected.',
          });
          
          // Clean up URL params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('spotify_callback');
          newParams.delete('code');
          newParams.delete('state');
          setSearchParams(newParams, { replace: true });
        } catch (error: any) {
          console.error('Spotify callback error:', error);
          toast({
            title: 'Spotify Connection Failed',
            description: 'Unable to complete Spotify connection. Please try again.',
            variant: 'destructive'
          });
        }
      }
    };

    handleSpotifyCallback();
  }, [searchParams, user, spotifyCallbackHandled, toast, setSearchParams]);

  // Handle unsubscribe from URL params
  useEffect(() => {
    const handleUnsubscribe = async () => {
      const unsubscribe = searchParams.get('unsubscribe');
      const userId = searchParams.get('uid');
      
      if (unsubscribe === 'true' && !unsubscribeHandled) {
        setProcessingUnsubscribe(true);
        
        try {
          // If user is logged in, use their ID. Otherwise, use the uid param
          const targetUserId = user?.id || userId;
          
          if (targetUserId) {
            const { error } = await supabase
              .from('notification_preferences')
              .upsert({
                user_id: targetUserId,
                email_enabled: false,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });

            if (error) throw error;

            toast({
              title: 'Unsubscribed Successfully',
              description: 'You have been unsubscribed from email notifications.',
            });
          }
        } catch (error: any) {
          console.error('Unsubscribe error:', error);
          toast({
            title: 'Unsubscribe Failed',
            description: 'Please try again or contact support.',
            variant: 'destructive'
          });
        } finally {
          setUnsubscribeHandled(true);
          setProcessingUnsubscribe(false);
        }
      }
    };

    handleUnsubscribe();
  }, [searchParams, user, unsubscribeHandled, toast]);

  useEffect(() => {
    if (!loading && !user) {
      // Allow unsubscribe without auth
      const unsubscribe = searchParams.get('unsubscribe');
      if (unsubscribe !== 'true') {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate, searchParams]);

  // Show unsubscribe confirmation for unauthenticated users
  if (!user && searchParams.get('unsubscribe') === 'true') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {processingUnsubscribe ? (
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            ) : unsubscribeHandled ? (
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            ) : (
              <MailX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            )}
            <CardTitle>
              {processingUnsubscribe ? 'Processing...' : 'Unsubscribed'}
            </CardTitle>
            <CardDescription>
              {unsubscribeHandled 
                ? 'You have been unsubscribed from AWW email notifications.'
                : 'Processing your unsubscribe request...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You can manage your notification preferences anytime by signing in.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const defaultTab = searchParams.get('unsubscribe') === 'true' 
    ? 'notifications' 
    : searchParams.get('spotify_callback') === 'true'
      ? 'integrations'
      : searchParams.get('tab') || 'account';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Show unsubscribe banner if just unsubscribed */}
        {unsubscribeHandled && (
          <Card className="mb-6 border-success/30 bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-success">Email Notifications Disabled</p>
                <p className="text-sm text-muted-foreground">You can re-enable them in the Notifications tab below.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehiclesSettings />
          </TabsContent>

          <TabsContent value="security">
            <TwoFactorSettings />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
