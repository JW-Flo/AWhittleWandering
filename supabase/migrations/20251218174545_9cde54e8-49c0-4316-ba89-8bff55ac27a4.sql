-- =====================================================
-- FIX 1: FLAGSHIP_WAYPOINTS - Obfuscate public data
-- =====================================================

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view flagship waypoints" ON public.flagship_waypoints;

-- Create a security definer function for public access with obfuscated coordinates
-- Rounds GPS to ~11km precision (1 decimal place) for privacy
CREATE OR REPLACE FUNCTION public.get_public_flagship_waypoints()
RETURNS TABLE(
  id uuid,
  name text,
  waypoint_number integer,
  state_code char(2),
  waypoint_type text,
  is_highlight boolean,
  arrived_at timestamptz,
  -- Obfuscated coordinates (rounded to ~11km precision)
  latitude_approx numeric,
  longitude_approx numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fw.id,
    fw.name,
    fw.waypoint_number,
    fw.state_code,
    fw.waypoint_type,
    fw.is_highlight,
    fw.arrived_at,
    -- Round to 1 decimal place (~11km precision) for privacy
    ROUND(fw.latitude::numeric, 1) as latitude_approx,
    ROUND(fw.longitude::numeric, 1) as longitude_approx
  FROM public.flagship_waypoints fw
  ORDER BY fw.waypoint_number ASC;
$$;

-- Only admins can see full precise data
CREATE POLICY "Only admins can view full flagship waypoints"
ON public.flagship_waypoints
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 2: BETA_TESTERS - Ensure no public access
-- =====================================================

-- Revoke any remaining anon access
REVOKE ALL ON public.beta_testers FROM anon;
REVOKE ALL ON public.beta_testers FROM public;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Anyone can verify access codes" ON public.beta_testers;
DROP POLICY IF EXISTS "Only admins can select beta testers" ON public.beta_testers;

-- Recreate strict admin-only policy
CREATE POLICY "Admins only can access beta testers"
ON public.beta_testers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 3: LOGIN_ATTEMPTS - Restrict to owners and admins
-- =====================================================

-- Revoke anon access
REVOKE ALL ON public.login_attempts FROM anon;
REVOKE ALL ON public.login_attempts FROM public;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Admins can view all login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Admins can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Users can view own login attempts by email" ON public.login_attempts;

-- Only authenticated users can view their own login attempts
CREATE POLICY "Users can view own login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only service role / edge functions can insert (via security definer functions)
-- No direct insert for regular users
CREATE POLICY "Service can insert login attempts"
ON public.login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Admins can delete old records for cleanup
CREATE POLICY "Admins can delete login attempts"
ON public.login_attempts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));