-- Drop and recreate view with SECURITY INVOKER to use caller's permissions
DROP VIEW IF EXISTS public.public_journeys;

CREATE VIEW public.public_journeys 
WITH (security_invoker = true) AS
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

-- Grant SELECT on the view
GRANT SELECT ON public.public_journeys TO anon;
GRANT SELECT ON public.public_journeys TO authenticated;