-- Create journey_media table for photos/videos synced to GPS locations
CREATE TABLE public.journey_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo' CHECK (type IN ('photo', 'video')),
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  latitude NUMERIC,
  longitude NUMERIC,
  location_name TEXT,
  state_code CHAR(2),
  people_tagged TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journey_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own media" ON public.journey_media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journey media" ON public.journey_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journeys 
      WHERE journeys.id = journey_media.journey_id 
      AND journeys.is_public = true
    )
  );

CREATE POLICY "Users can insert own media" ON public.journey_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media" ON public.journey_media
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media" ON public.journey_media
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_journey_media_updated_at
  BEFORE UPDATE ON public.journey_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_journey_media_journey_id ON public.journey_media(journey_id);
CREATE INDEX idx_journey_media_state_code ON public.journey_media(state_code);
CREATE INDEX idx_journey_media_taken_at ON public.journey_media(taken_at);