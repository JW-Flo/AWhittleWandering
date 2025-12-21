import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Unplug, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SpotifyConnection {
  id: string;
  spotify_user_id: string | null;
  display_name: string | null;
  expires_at: string;
}

export function SpotifyConnect() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<SpotifyConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('spotify_connections')
        .select('id, spotify_user_id, display_name, expires_at')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (err) {
      console.error('Error fetching Spotify connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error initiating Spotify auth:', err);
      toast.error('Failed to connect to Spotify');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('spotify_connections')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
      setConnection(null);
      toast.success('Disconnected from Spotify');
    } catch (err) {
      console.error('Error disconnecting Spotify:', err);
      toast.error('Failed to disconnect');
    }
  };

  const handleRefresh = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refresh_token' }
      });

      if (error) throw error;
      await fetchConnection();
      toast.success('Spotify connection refreshed');
    } catch (err) {
      console.error('Error refreshing token:', err);
      toast.error('Failed to refresh connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const isExpired = connection && new Date(connection.expires_at) < new Date();

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/10">
              <Music className="h-5 w-5 text-[#1DB954]" />
            </div>
            <div>
              <CardTitle className="text-base">Spotify</CardTitle>
              <CardDescription className="text-sm">
                Tag songs to your journey waypoints
              </CardDescription>
            </div>
          </div>
          {connection && (
            <Badge variant={isExpired ? "destructive" : "secondary"}>
              {isExpired ? "Expired" : "Connected"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connection ? (
          <div className="space-y-4">
            {connection.display_name && (
              <p className="text-sm text-muted-foreground">
                Connected as <span className="font-medium text-foreground">{connection.display_name}</span>
              </p>
            )}
            <div className="flex gap-2">
              {isExpired && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isConnecting}
                  className="gap-2"
                >
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="gap-2 bg-[#1DB954] hover:bg-[#1DB954]/90"
          >
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
            Connect Spotify
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
