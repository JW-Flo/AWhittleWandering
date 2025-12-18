-- Create table to store security scan results
CREATE TABLE public.security_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type TEXT NOT NULL DEFAULT 'scheduled',
  status TEXT NOT NULL DEFAULT 'completed',
  trigger_source TEXT NOT NULL DEFAULT 'cron',
  total_findings INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  findings JSONB DEFAULT '[]'::jsonb,
  checks_performed JSONB DEFAULT '{}'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  remediation_applied BOOLEAN DEFAULT false,
  remediation_details JSONB DEFAULT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_scan_results ENABLE ROW LEVEL SECURITY;

-- Only admins can view scan results
CREATE POLICY "Admins can view security scan results"
ON public.security_scan_results
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only system (service role) can insert/update
CREATE POLICY "Service role can manage scan results"
ON public.security_scan_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_security_scan_results_created_at ON public.security_scan_results(created_at DESC);
CREATE INDEX idx_security_scan_results_status ON public.security_scan_results(status);