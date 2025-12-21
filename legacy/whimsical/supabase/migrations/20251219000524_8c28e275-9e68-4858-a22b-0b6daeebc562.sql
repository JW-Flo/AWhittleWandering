-- Fix infinite recursion in RLS policies by using security definer functions

-- Function to check if user owns a journey (without triggering RLS)
CREATE OR REPLACE FUNCTION public.is_journey_owner(p_journey_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM journeys
    WHERE id = p_journey_id AND user_id = p_user_id
  )
$$;

-- Function to check if user is an approved follower of a journey
CREATE OR REPLACE FUNCTION public.is_approved_follower(p_journey_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM journey_followers
    WHERE journey_id = p_journey_id 
    AND follower_user_id = p_user_id 
    AND approved = true
  )
$$;

-- Function to check if a journey is public
CREATE OR REPLACE FUNCTION public.is_journey_public(p_journey_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_public FROM journeys WHERE id = p_journey_id),
    false
  )
$$;

-- Drop problematic policies on journey_followers
DROP POLICY IF EXISTS "Journey owners can view followers" ON journey_followers;
DROP POLICY IF EXISTS "Journey owners can manage followers" ON journey_followers;

-- Recreate journey_followers policies using security definer function
CREATE POLICY "Journey owners can view followers"
  ON journey_followers FOR SELECT
  USING (
    follower_user_id = auth.uid()
    OR public.is_journey_owner(journey_id, auth.uid())
  );

CREATE POLICY "Journey owners can manage followers"
  ON journey_followers FOR UPDATE
  USING (public.is_journey_owner(journey_id, auth.uid()));

-- Drop problematic policies on journeys
DROP POLICY IF EXISTS "Authenticated users can view followed public journeys" ON journeys;
DROP POLICY IF EXISTS "Users can view their own journeys" ON journeys;

-- Recreate journeys SELECT policy without recursion
CREATE POLICY "Users can view accessible journeys"
  ON journeys FOR SELECT
  USING (
    user_id = auth.uid()
    OR (is_public = true AND public.is_approved_follower(id, auth.uid()))
  );

-- Drop and recreate policies on drive_data, charging_sessions, journal_entries
DROP POLICY IF EXISTS "Approved followers can view journey drive data" ON drive_data;
DROP POLICY IF EXISTS "Approved followers can view journey charging" ON charging_sessions;
DROP POLICY IF EXISTS "Approved followers can view journey entries" ON journal_entries;

CREATE POLICY "Users can view accessible drive data"
  ON drive_data FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      public.is_journey_public(journey_id)
      AND public.is_approved_follower(journey_id, auth.uid())
      AND recorded_at < (NOW() - INTERVAL '24 hours')
    )
  );

CREATE POLICY "Users can view accessible charging sessions"
  ON charging_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      public.is_journey_public(journey_id)
      AND public.is_approved_follower(journey_id, auth.uid())
      AND started_at < (NOW() - INTERVAL '24 hours')
    )
  );

CREATE POLICY "Users can view accessible journal entries"
  ON journal_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      public.is_journey_public(journey_id)
      AND public.is_approved_follower(journey_id, auth.uid())
    )
  );

-- Fix journey_media policy if it exists
DROP POLICY IF EXISTS "Approved followers can view journey media" ON journey_media;

CREATE POLICY "Users can view accessible journey media"
  ON journey_media FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      public.is_journey_public(journey_id)
      AND public.is_approved_follower(journey_id, auth.uid())
    )
  );