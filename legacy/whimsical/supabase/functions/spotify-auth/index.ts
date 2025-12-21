import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.awhittlewandering.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code } = await req.json();

    if (action === 'get_auth_url') {
      if (!SPOTIFY_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: 'Spotify not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scopes = [
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-library-read',
      ].join(' ');

      const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${SITE_URL}/settings?spotify_callback=true`,
        scope: scopes,
        state: user.id,
      });

      return new Response(
        JSON.stringify({ url: `https://accounts.spotify.com/authorize?${params}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchange_code') {
      if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Spotify not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${SITE_URL}/settings?spotify_callback=true`,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Spotify token error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();

      // Get Spotify user info
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });

      let spotifyUser = null;
      if (userResponse.ok) {
        spotifyUser = await userResponse.json();
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Upsert connection
      const { error: upsertError } = await supabase
        .from('spotify_connections')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          spotify_user_id: spotifyUser?.id,
          display_name: spotifyUser?.display_name,
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error saving Spotify connection:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Spotify connected for user ${user.id}`);
      return new Response(
        JSON.stringify({ success: true, display_name: spotifyUser?.display_name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh_token') {
      const { data: connection, error: connError } = await supabase
        .from('spotify_connections')
        .select('refresh_token')
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ error: 'No connection found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase
        .from('spotify_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          expires_at: expiresAt,
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_recent_tracks') {
      const { data: connection, error: connError } = await supabase
        .from('spotify_connections')
        .select('access_token, expires_at')
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Spotify' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
        headers: { 'Authorization': `Bearer ${connection.access_token}` },
      });

      if (!tracksResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tracks' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await tracksResponse.json();
      const tracks = data.items.map((item: any) => ({
        spotify_track_id: item.track.id,
        track_name: item.track.name,
        artist_name: item.track.artists.map((a: any) => a.name).join(', '),
        album_name: item.track.album.name,
        album_art_url: item.track.album.images[0]?.url,
        preview_url: item.track.preview_url,
        played_at: item.played_at,
      }));

      return new Response(
        JSON.stringify({ tracks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Spotify auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
