-- Per-journey notification settings table
CREATE TABLE public.journey_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  notify_new_waypoint BOOLEAN DEFAULT true,
  notify_state_crossing BOOLEAN DEFAULT true,
  notify_photos BOOLEAN DEFAULT true,
  notify_charging_stop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, journey_id)
);

ALTER TABLE public.journey_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journey notification settings"
ON public.journey_notification_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User follows table (follow users, not just journeys)
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_new_journey BOOLEAN DEFAULT true,
  notify_journey_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_user_id, followed_user_id),
  CHECK (follower_user_id != followed_user_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
ON public.user_follows FOR SELECT
USING (auth.uid() = follower_user_id OR auth.uid() = followed_user_id);

CREATE POLICY "Users can manage their following"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_user_id);

-- Add is_complete flag to journeys for notification cutoff
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;

-- Create trigger for journey_notification_settings updated_at
CREATE TRIGGER update_journey_notification_settings_updated_at
  BEFORE UPDATE ON public.journey_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix security: Remove broad admin policy from profiles, make it stricter
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Admins can only view profiles when necessary for admin functions
CREATE POLICY "Admins can view profiles for admin functions"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND (
    -- Only when querying specific users for incidents/moderation
    EXISTS (SELECT 1 FROM public.incident_log WHERE user_id = profiles.user_id)
    OR EXISTS (SELECT 1 FROM public.security_audit_log WHERE user_id = profiles.user_id)
  )
);

-- Public profile view for journey sharing (limited fields only via RPC)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id UUID)
RETURNS TABLE(display_name TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(display_name, 'Anonymous User') as display_name,
    avatar_url
  FROM public.profiles
  WHERE user_id = p_user_id
    AND account_status = 'active'
    AND anonymize_username = false
$$;

-- Fix notification_preferences: ensure phone_number only accessible by owner
-- (Already has proper RLS, but verify)

-- Add RLS to public_journeys view (views inherit from base table)
-- The view already filters is_public=true, but let's ensure consistency