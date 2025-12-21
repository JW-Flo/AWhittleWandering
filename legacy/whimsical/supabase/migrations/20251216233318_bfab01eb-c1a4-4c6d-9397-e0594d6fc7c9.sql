-- Fix: Drop the security definer view and use a function instead
DROP VIEW IF EXISTS public.page_view_stats;

-- Create a secure function to get page view stats (invoker rights)
CREATE OR REPLACE FUNCTION public.get_page_view_stats(p_page_path text DEFAULT NULL, p_journey_id uuid DEFAULT NULL)
RETURNS TABLE (
  page_path text,
  journey_id uuid,
  total_views bigint,
  unique_visitors bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    pv.page_path,
    pv.journey_id,
    COUNT(*)::bigint as total_views,
    COUNT(DISTINCT pv.visitor_id)::bigint as unique_visitors
  FROM public.page_views pv
  WHERE 
    (p_page_path IS NULL OR pv.page_path = p_page_path)
    AND (p_journey_id IS NULL OR pv.journey_id = p_journey_id)
  GROUP BY pv.page_path, pv.journey_id;
$$;

-- Create a public function to get flagship journey stats (no auth required)
CREATE OR REPLACE FUNCTION public.get_flagship_view_count()
RETURNS TABLE (
  total_views bigint,
  unique_visitors bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::bigint as total_views,
    COUNT(DISTINCT visitor_id)::bigint as unique_visitors
  FROM public.page_views
  WHERE page_path = '/explore';
$$;