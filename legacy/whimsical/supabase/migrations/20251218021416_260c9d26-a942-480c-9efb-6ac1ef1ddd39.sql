-- Remove public access policies that allow unauthenticated viewing
-- Only authenticated users can view "public" journeys (except flagship which is separate table)

-- 1. Update drive_data: public journey access requires authentication
DROP POLICY IF EXISTS "Users can view public journey drive data with delay" ON public.drive_data;
CREATE POLICY "Authenticated users can view public journey drive data with delay"
ON public.drive_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = drive_data.journey_id
    AND journeys.is_public = true
    AND drive_data.recorded_at < (now() - interval '24 hours')
  )
);

-- 2. Update charging_sessions: public journey access requires authentication
DROP POLICY IF EXISTS "Users can view public journey charging with delay" ON public.charging_sessions;
CREATE POLICY "Authenticated users can view public journey charging with delay"
ON public.charging_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = charging_sessions.journey_id
    AND journeys.is_public = true
    AND charging_sessions.started_at < (now() - interval '24 hours')
  )
);

-- 3. Update journal_entries: public journey access requires authentication
DROP POLICY IF EXISTS "Users can view public journey journal" ON public.journal_entries;
CREATE POLICY "Authenticated users can view public journey journal"
ON public.journal_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = journal_entries.journey_id
    AND journeys.is_public = true
  )
);

-- 4. Update states_visited: public journey access requires authentication  
DROP POLICY IF EXISTS "Users can view public journey states" ON public.states_visited;
CREATE POLICY "Authenticated users can view public journey states"
ON public.states_visited
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = states_visited.journey_id
    AND journeys.is_public = true
  )
);

-- 5. Update journey_tracks: public journey access requires authentication
DROP POLICY IF EXISTS "Public journey tracks are viewable" ON public.journey_tracks;
CREATE POLICY "Authenticated users can view public journey tracks"
ON public.journey_tracks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = journey_tracks.journey_id
    AND journeys.is_public = true
  )
);

-- 6. Update journey_media: restrict public visibility to authenticated only
DROP POLICY IF EXISTS "Users can view media based on visibility" ON public.journey_media;
CREATE POLICY "Users can view media based on visibility"
ON public.journey_media
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) 
  OR (visibility = 'public'::media_visibility)
  OR (
    visibility = 'followers'::media_visibility 
    AND EXISTS (
      SELECT 1 FROM journey_followers jf
      WHERE jf.journey_id = journey_media.journey_id
      AND jf.follower_user_id = auth.uid()
      AND jf.approved = true
    )
  )
);

-- 7. Lock down tessie_drives - ensure only admin can view (no public access)
-- Already has proper policies, but let's verify by dropping any potential public access
DROP POLICY IF EXISTS "Users can view their own tessie drives" ON public.tessie_drives;
CREATE POLICY "Vehicle owners can view their tessie drives"
ON public.tessie_drives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vehicles v
    WHERE v.vin = tessie_drives.vin
    AND v.user_id = auth.uid()
  )
);

-- 8. Ensure api_providers requires authentication for viewing
DROP POLICY IF EXISTS "Authenticated users can view active API providers" ON public.api_providers;
CREATE POLICY "Authenticated users can view active API providers"
ON public.api_providers
FOR SELECT
TO authenticated
USING (is_active = true);