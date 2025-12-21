-- Fix login_attempts: Drop any permissive policies and ensure strict access
DROP POLICY IF EXISTS "Service role can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Require authentication for login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow authenticated read of login attempts" ON public.login_attempts;

-- Keep only these policies for login_attempts:
-- 1. Users view own by email (already exists)
-- 2. Admins view all (already exists)
-- 3. Admins can insert (for edge functions, they use service role which bypasses RLS anyway)

-- Fix page_views: Ensure only admins and journey owners can SELECT
DROP POLICY IF EXISTS "Anyone can view page views" ON public.page_views;
DROP POLICY IF EXISTS "Public can view page views" ON public.page_views;
DROP POLICY IF EXISTS "Allow public read of page views" ON public.page_views;

-- The existing policies are correct:
-- "Anyone can insert page views" - needed for tracking
-- "Admins can view all page views" - admin access
-- "Journey owners can view their page views" - owner access

-- Fix public_journeys view: Create proper RLS on the view
-- Note: Views inherit RLS from underlying tables, but public_journeys needs explicit protection
-- The view is SECURITY INVOKER so it respects caller's permissions on journeys table

-- However, if the view bypasses RLS, we need to recreate it with proper security
-- First check if it's a view or table
DROP VIEW IF EXISTS public.public_journeys CASCADE;

-- Recreate as a secure view that only shows public journeys without sensitive data
CREATE OR REPLACE VIEW public.public_journeys 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  name,
  description,
  start_date,
  end_date,
  total_miles,
  total_kwh,
  states_count,
  cover_image_url,
  created_at,
  updated_at
FROM public.journeys
WHERE is_public = true AND archived_at IS NULL;

-- Grant read access to authenticated and anon roles for the view
-- The WHERE clause ensures only public journeys are visible
GRANT SELECT ON public.public_journeys TO anon, authenticated;

-- Add comment explaining security model
COMMENT ON VIEW public.public_journeys IS 'Public view of journeys - only shows public, non-archived journeys. No user_id exposed. Security enforced by WHERE clause in view definition.';