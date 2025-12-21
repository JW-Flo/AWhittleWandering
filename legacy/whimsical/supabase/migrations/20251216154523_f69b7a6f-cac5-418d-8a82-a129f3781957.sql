-- Account status tracking for incident remediation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'locked', 'suspended', 'pending_review')),
ADD COLUMN IF NOT EXISTS locked_at timestamptz,
ADD COLUMN IF NOT EXISTS locked_reason text,
ADD COLUMN IF NOT EXISTS locked_by uuid;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- Incident log table for tracking all account actions
CREATE TABLE IF NOT EXISTS public.incident_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  incident_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  action_taken text,
  notification_sent boolean DEFAULT false,
  notification_channels text[],
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.incident_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage incidents
CREATE POLICY "Admins can manage incidents"
ON public.incident_log
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_incident_log_user_created ON public.incident_log(user_id, created_at DESC);
CREATE INDEX idx_incident_log_resolved ON public.incident_log(resolved, created_at DESC);