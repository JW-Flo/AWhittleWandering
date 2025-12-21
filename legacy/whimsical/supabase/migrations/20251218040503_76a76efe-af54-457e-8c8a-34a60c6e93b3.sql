-- Create login attempts table for rate limiting and suspicious login detection
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  country_code TEXT,
  city TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for rate limiting queries
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts(ip_address, created_at DESC);

-- Create account lockouts table
CREATE TABLE public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  lock_reason TEXT,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_lockouts_email ON public.account_lockouts(email);

-- Create trusted devices table for suspicious login detection
CREATE TABLE public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  country_code TEXT,
  city TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT true,
  UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_trusted_devices_user ON public.trusted_devices(user_id);

-- Create suspicious login alerts table
CREATE TABLE public.login_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'new_device', 'new_location', 'unusual_time', 'multiple_failures'
  ip_address TEXT,
  device_fingerprint TEXT,
  country_code TEXT,
  city TEXT,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_alerts_user ON public.login_alerts(user_id, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for login_attempts (service role only for inserts, admins can read)
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for account_lockouts
CREATE POLICY "Service role can manage lockouts"
ON public.account_lockouts FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for trusted_devices
CREATE POLICY "Users can view own trusted devices"
ON public.trusted_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
ON public.trusted_devices FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for login_alerts
CREATE POLICY "Users can view own login alerts"
ON public.login_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge own alerts"
ON public.login_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all alerts"
ON public.login_alerts FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Function to clean up old login attempts (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM public.account_lockouts WHERE locked_until < NOW();
END;
$$;