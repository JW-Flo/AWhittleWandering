-- Make journey-photos bucket private (no public read access)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'journey-photos';

-- Drop all existing policies on storage.objects for journey-photos
DROP POLICY IF EXISTS "Anyone can view journey photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for journey photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create strict storage policies - only owner can read/write their files
CREATE POLICY "Owners can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update journey_media RLS to be owner + approved followers only
DROP POLICY IF EXISTS "Users can view media based on visibility" ON journey_media;
DROP POLICY IF EXISTS "Users can view own media" ON journey_media;

-- Only owner can view their own media directly
CREATE POLICY "Owners can view own media"
ON journey_media FOR SELECT
USING (auth.uid() = user_id);

-- Approved followers can view media for journeys they follow
CREATE POLICY "Approved followers can view journey media"
ON journey_media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM journey_followers jf
    WHERE jf.journey_id = journey_media.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
  )
);

-- Update public_journeys view policies - remove public access
DROP POLICY IF EXISTS "Anyone can view public journeys" ON journeys;

-- Only show public journeys to authenticated users who are approved followers
CREATE POLICY "Authenticated users can view followed public journeys"
ON journeys FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    is_public = true 
    AND EXISTS (
      SELECT 1 FROM journey_followers jf
      WHERE jf.journey_id = journeys.id
      AND jf.follower_user_id = auth.uid()
      AND jf.approved = true
    )
  )
);

-- Update drive_data RLS - owner + approved followers only
DROP POLICY IF EXISTS "Authenticated users can view public journey drive data with del" ON drive_data;

CREATE POLICY "Approved followers can view journey drive data"
ON drive_data FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM journey_followers jf
    JOIN journeys j ON j.id = jf.journey_id
    WHERE j.id = drive_data.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
    AND j.is_public = true
    AND drive_data.recorded_at < (NOW() - INTERVAL '24 hours')
  )
);

-- Update charging_sessions RLS - owner + approved followers only  
DROP POLICY IF EXISTS "Authenticated users can view public journey charging with delay" ON charging_sessions;

CREATE POLICY "Approved followers can view journey charging"
ON charging_sessions FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM journey_followers jf
    JOIN journeys j ON j.id = jf.journey_id
    WHERE j.id = charging_sessions.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
    AND j.is_public = true
    AND charging_sessions.started_at < (NOW() - INTERVAL '24 hours')
  )
);

-- Update states_visited RLS - owner + approved followers only
DROP POLICY IF EXISTS "Authenticated users can view public journey states" ON states_visited;

CREATE POLICY "Approved followers can view journey states"
ON states_visited FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM journey_followers jf
    JOIN journeys j ON j.id = jf.journey_id
    WHERE j.id = states_visited.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
    AND j.is_public = true
  )
);

-- Update journal_entries RLS - owner + approved followers only
DROP POLICY IF EXISTS "Authenticated users can view public journey journal" ON journal_entries;

CREATE POLICY "Approved followers can view journey journal"
ON journal_entries FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM journey_followers jf
    JOIN journeys j ON j.id = jf.journey_id
    WHERE j.id = journal_entries.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
    AND j.is_public = true
  )
);

-- Update journey_tracks RLS - owner + approved followers only
DROP POLICY IF EXISTS "Authenticated users can view public journey tracks" ON journey_tracks;

CREATE POLICY "Approved followers can view journey tracks"
ON journey_tracks FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM journey_followers jf
    JOIN journeys j ON j.id = jf.journey_id
    WHERE j.id = journey_tracks.journey_id
    AND jf.follower_user_id = auth.uid()
    AND jf.approved = true
    AND j.is_public = true
  )
);