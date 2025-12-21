-- Create blocked_visitors table for blocking malicious visitors
CREATE TABLE IF NOT EXISTS public.blocked_visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(visitor_id)
);

-- Enable RLS
ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked visitors
CREATE POLICY "Admins can manage blocked visitors"
ON public.blocked_visitors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster lookups
CREATE INDEX idx_blocked_visitors_visitor_id ON public.blocked_visitors(visitor_id);
CREATE INDEX idx_blocked_visitors_expires_at ON public.blocked_visitors(expires_at) WHERE expires_at IS NOT NULL;

-- Add comment
COMMENT ON TABLE public.blocked_visitors IS 'Tracks blocked visitors by visitor_id to prevent access';

-- Create data_retention_config table for configurable retention periods
CREATE TABLE IF NOT EXISTS public.data_retention_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL DEFAULT 365,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention config
CREATE POLICY "Admins can manage retention config"
ON public.data_retention_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention periods (1 year = 365 days)
INSERT INTO public.data_retention_config (table_name, retention_days, description) VALUES
  ('page_views', 365, 'Visitor analytics and page view tracking'),
  ('security_audit_log', 365, 'Security audit trail'),
  ('login_attempts', 90, 'Failed/successful login attempts'),
  ('notification_queue', 90, 'Processed notifications'),
  ('tessie_drives', 365, 'Vehicle drive telemetry data')
ON CONFLICT (table_name) DO NOTHING;