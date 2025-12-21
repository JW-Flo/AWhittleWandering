-- Privacy and notification preferences enum types
CREATE TYPE public.location_privacy_level AS ENUM ('exact', 'city', 'region', 'state');
CREATE TYPE public.media_visibility AS ENUM ('public', 'followers', 'private');
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'push');

-- Journey followers table
CREATE TABLE public.journey_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  follower_user_id UUID NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (journey_id, follower_user_id)
);

ALTER TABLE public.journey_followers ENABLE ROW LEVEL SECURITY;

-- Followers can see their own follow status
CREATE POLICY "Users can view own follows"
  ON public.journey_followers FOR SELECT
  USING (auth.uid() = follower_user_id);

-- Journey owners can see followers
CREATE POLICY "Journey owners can view followers"
  ON public.journey_followers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.journeys 
    WHERE journeys.id = journey_followers.journey_id 
    AND journeys.user_id = auth.uid()
  ));

-- Users can follow public journeys
CREATE POLICY "Users can follow journeys"
  ON public.journey_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

-- Journey owners can approve/manage followers
CREATE POLICY "Journey owners can manage followers"
  ON public.journey_followers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.journeys 
    WHERE journeys.id = journey_followers.journey_id 
    AND journeys.user_id = auth.uid()
  ));

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON public.journey_followers FOR DELETE
  USING (auth.uid() = follower_user_id);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  phone_number TEXT,
  email_digest_frequency TEXT DEFAULT 'daily', -- 'realtime', 'daily', 'weekly'
  notify_new_waypoint BOOLEAN DEFAULT true,
  notify_charging_stop BOOLEAN DEFAULT false,
  notify_state_crossing BOOLEAN DEFAULT true,
  notify_photos BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add privacy fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS default_location_privacy location_privacy_level DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS default_media_visibility media_visibility DEFAULT 'followers',
  ADD COLUMN IF NOT EXISTS anonymize_username BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add visibility to journey_media
ALTER TABLE public.journey_media
  ADD COLUMN IF NOT EXISTS visibility media_visibility DEFAULT 'followers',
  ADD COLUMN IF NOT EXISTS location_privacy location_privacy_level DEFAULT 'city';

-- Update RLS for journey_media to respect visibility
DROP POLICY IF EXISTS "Users can view public journey media" ON public.journey_media;

CREATE POLICY "Users can view media based on visibility"
  ON public.journey_media FOR SELECT
  USING (
    auth.uid() = user_id 
    OR visibility = 'public'
    OR (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM public.journey_followers jf
      WHERE jf.journey_id = journey_media.journey_id
      AND jf.follower_user_id = auth.uid()
      AND jf.approved = true
    ))
  );

-- Notifications queue table for processing
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL,
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'waypoint', 'state_crossing', 'photo', 'charging'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['email']::notification_channel[],
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notification_queue FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Trigger to update updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();