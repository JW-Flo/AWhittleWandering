-- Create journey_tracks table for Spotify music tagging
CREATE TABLE public.journey_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  waypoint_id UUID REFERENCES public.flagship_waypoints(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_art_url TEXT,
  preview_url TEXT,
  played_at TIMESTAMP WITH TIME ZONE,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_tracks ENABLE ROW LEVEL SECURITY;

-- Users can view tracks on public journeys
CREATE POLICY "Public journey tracks are viewable"
ON public.journey_tracks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.journeys 
    WHERE journeys.id = journey_tracks.journey_id 
    AND journeys.is_public = true
  )
);

-- Users can manage their own tracks
CREATE POLICY "Users can manage their own tracks"
ON public.journey_tracks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create spotify_connections table for OAuth tokens
CREATE TABLE public.spotify_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spotify_user_id TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotify_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connection
CREATE POLICY "Users can manage their own Spotify connection"
ON public.spotify_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_spotify_connections_updated_at
BEFORE UPDATE ON public.spotify_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_journey_tracks_journey ON public.journey_tracks(journey_id);
CREATE INDEX idx_journey_tracks_waypoint ON public.journey_tracks(waypoint_id);