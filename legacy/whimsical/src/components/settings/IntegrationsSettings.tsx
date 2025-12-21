import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Music, Instagram, Facebook, Twitter, CheckCircle2, ExternalLink, Unlink } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  username?: string;
  connectAction: () => void;
  disconnectAction?: () => void;
  comingSoon?: boolean;
}

export default function IntegrationsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyUsername, setSpotifyUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnections();
  }, [user]);

  const checkConnections = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('spotify_connections')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setSpotifyConnected(true);
        setSpotifyUsername(data.display_name);
      }
    } catch (err) {
      // No connection found
    } finally {
      setLoading(false);
    }
  };

  const connectSpotify = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'get_auth_url' }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to Spotify. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const disconnectSpotify = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('spotify_connections')
        .delete()
        .eq('user_id', user.id);
      
      setSpotifyConnected(false);
      setSpotifyUsername(null);
      
      toast({
        title: 'Disconnected',
        description: 'Spotify has been disconnected from your account.'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Spotify.',
        variant: 'destructive'
      });
    }
  };

  const integrations: Integration[] = [
    {
      id: 'spotify',
      name: 'Spotify',
      description: 'Tag songs to your journey waypoints and create trip playlists',
      icon: <Music className="w-5 h-5 text-green-500" />,
      connected: spotifyConnected,
      username: spotifyUsername || undefined,
      connectAction: connectSpotify,
      disconnectAction: disconnectSpotify,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Share journey photos directly to your Instagram feed',
      icon: <Instagram className="w-5 h-5 text-pink-500" />,
      connected: false,
      connectAction: () => {},
      comingSoon: true,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Share journey updates and milestones with friends',
      icon: <Facebook className="w-5 h-5 text-blue-600" />,
      connected: false,
      connectAction: () => {},
      comingSoon: true,
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      description: 'Auto-post journey highlights and state crossings',
      icon: <Twitter className="w-5 h-5" />,
      connected: false,
      connectAction: () => {},
      comingSoon: true,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Services</CardTitle>
        <CardDescription>
          Link external services to enhance your journey experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              integration.connected 
                ? 'border-success/30 bg-success/5' 
                : integration.comingSoon
                  ? 'border-border bg-muted/30 opacity-60'
                  : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                integration.connected ? 'bg-success/10' : 'bg-muted'
              }`}>
                {integration.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{integration.name}</h4>
                  {integration.connected && (
                    <Badge variant="outline" className="text-success border-success/30 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {integration.comingSoon && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                {integration.connected && integration.username && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected as: {integration.username}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={integration.disconnectAction}
                  className="text-destructive hover:text-destructive"
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              ) : !integration.comingSoon ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={integration.connectAction}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}