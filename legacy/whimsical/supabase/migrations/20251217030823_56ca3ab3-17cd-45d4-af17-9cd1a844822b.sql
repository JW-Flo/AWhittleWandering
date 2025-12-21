-- Security improvements: Location privacy and remove redundant email column

-- 1. Remove email column from profiles table (redundant with auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Add location privacy delay for public journeys
-- Create a function that applies time delay to drive_data for public journeys
CREATE OR REPLACE FUNCTION public.get_public_drive_data_with_delay(p_journey_id uuid)
RETURNS TABLE(
  id uuid,
  journey_id uuid,
  latitude numeric,
  longitude numeric,
  recorded_at timestamptz,
  speed_mph numeric,
  battery_level integer,
  battery_range numeric,
  elevation_ft numeric,
  heading integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    dd.id,
    dd.journey_id,
    -- Apply location fuzzing: round to ~1km precision for public data
    ROUND(dd.latitude::numeric, 2) as latitude,
    ROUND(dd.longitude::numeric, 2) as longitude,
    dd.recorded_at,
    dd.speed_mph,
    dd.battery_level,
    dd.battery_range,
    dd.elevation_ft,
    dd.heading
  FROM public.drive_data dd
  JOIN public.journeys j ON j.id = dd.journey_id
  WHERE dd.journey_id = p_journey_id
    AND j.is_public = true
    -- 24-hour delay for public journey data
    AND dd.recorded_at < (NOW() - INTERVAL '24 hours')
  ORDER BY dd.recorded_at ASC
$$;

-- 3. Update the RLS policy for public journey drive data to enforce time delay
DROP POLICY IF EXISTS "Users can view public journey drive data" ON public.drive_data;

CREATE POLICY "Users can view public journey drive data with delay"
ON public.drive_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = drive_data.journey_id
      AND journeys.is_public = true
      -- 24-hour delay before data becomes public
      AND drive_data.recorded_at < (NOW() - INTERVAL '24 hours')
  )
);

-- 4. Similarly update charging_sessions for location privacy
DROP POLICY IF EXISTS "Users can view public journey charging" ON public.charging_sessions;

CREATE POLICY "Users can view public journey charging with delay"
ON public.charging_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = charging_sessions.journey_id
      AND journeys.is_public = true
      -- 24-hour delay before charging data becomes public
      AND charging_sessions.started_at < (NOW() - INTERVAL '24 hours')
  )
);

-- Add comments explaining the security controls
COMMENT ON POLICY "Users can view public journey drive data with delay" ON public.drive_data IS 
'Security: 24-hour delay prevents real-time location tracking of public journeys';

COMMENT ON POLICY "Users can view public journey charging with delay" ON public.charging_sessions IS 
'Security: 24-hour delay prevents revealing current charging locations';