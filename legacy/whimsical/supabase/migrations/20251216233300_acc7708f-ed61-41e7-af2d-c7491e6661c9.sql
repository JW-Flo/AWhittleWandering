-- Create page_views table for analytics
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text NOT NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE,
  visitor_id text, -- Anonymous visitor fingerprint (no PII)
  user_agent text,
  referrer text,
  country_code text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (for anonymous tracking)
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Admins can view all page views
CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Journey owners can view their journey's page views
CREATE POLICY "Journey owners can view their page views"
ON public.page_views
FOR SELECT
USING (
  journey_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM journeys 
    WHERE journeys.id = page_views.journey_id 
    AND journeys.user_id = auth.uid()
  )
);

-- Create index for fast queries
CREATE INDEX idx_page_views_journey_id ON public.page_views(journey_id);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);

-- Create a view for aggregated stats (no PII exposed)
CREATE OR REPLACE VIEW public.page_view_stats AS
SELECT 
  page_path,
  journey_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  DATE_TRUNC('day', viewed_at) as view_date
FROM public.page_views
GROUP BY page_path, journey_id, DATE_TRUNC('day', viewed_at);