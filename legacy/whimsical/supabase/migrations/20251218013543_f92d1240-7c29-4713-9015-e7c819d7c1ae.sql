-- Fix: states_visited - Don't expose user_id to public, only allow journey owner access
DROP POLICY IF EXISTS "Users can view states for public journeys" ON public.states_visited;
DROP POLICY IF EXISTS "Public can view states for public journeys" ON public.states_visited;

-- Only journey owner can see states_visited data (no public access)
CREATE POLICY "Users can view their own states" 
ON public.states_visited 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix: journeys table - Create a more secure public view that excludes user_id
-- Update RLS to prevent user_id leakage for public journeys
DROP POLICY IF EXISTS "Public journeys are viewable" ON public.journeys;
DROP POLICY IF EXISTS "Anyone can view public journeys" ON public.journeys;

-- Users can only view their own journeys or public journeys (but user_id is exposed in raw table)
-- We'll restrict public reads to go through the view instead
CREATE POLICY "Users can view their own journeys" 
ON public.journeys 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all journeys
CREATE POLICY "Admins can view all journeys" 
ON public.journeys 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate public_journeys view with SECURITY INVOKER to be safer
DROP VIEW IF EXISTS public.public_journeys;
CREATE VIEW public.public_journeys WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  description,
  cover_image_url,
  start_date,
  end_date,
  total_miles,
  total_kwh,
  states_count,
  created_at,
  updated_at
FROM public.journeys
WHERE is_public = true;

-- Grant access to the view for anonymous users
GRANT SELECT ON public.public_journeys TO anon;
GRANT SELECT ON public.public_journeys TO authenticated;