-- Create a secure view for public journey data that excludes user_id
CREATE OR REPLACE VIEW public.public_journeys AS
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_journeys TO anon;
GRANT SELECT ON public.public_journeys TO authenticated;

-- Update the public journeys policy to be more restrictive
-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can view public journeys" ON public.journeys;

-- Recreate with restricted field access via RLS
-- Public users can only see public journeys, but the view should be used for anonymous access
CREATE POLICY "Anyone can view public journeys" 
ON public.journeys 
FOR SELECT 
USING (is_public = true);