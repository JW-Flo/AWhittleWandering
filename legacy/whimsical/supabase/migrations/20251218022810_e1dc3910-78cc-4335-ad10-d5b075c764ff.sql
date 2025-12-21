-- Add more detailed tracking columns to page_views
ALTER TABLE public.page_views 
ADD COLUMN IF NOT EXISTS screen_width integer,
ADD COLUMN IF NOT EXISTS screen_height integer,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS session_duration_ms integer,
ADD COLUMN IF NOT EXISTS scroll_depth_percent integer,
ADD COLUMN IF NOT EXISTS time_on_page_ms integer,
ADD COLUMN IF NOT EXISTS is_bounce boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS exit_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS browser text,
ADD COLUMN IF NOT EXISTS browser_version text,
ADD COLUMN IF NOT EXISTS os text,
ADD COLUMN IF NOT EXISTS os_version text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS connection_type text,
ADD COLUMN IF NOT EXISTS is_returning_visitor boolean DEFAULT false;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON public.page_views(device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_browser ON public.page_views(browser);
CREATE INDEX IF NOT EXISTS idx_page_views_utm ON public.page_views(utm_source, utm_medium, utm_campaign);