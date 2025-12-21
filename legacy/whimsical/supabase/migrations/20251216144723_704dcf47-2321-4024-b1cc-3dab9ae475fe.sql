-- Add SMS consent tracking columns to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS sms_consent_given boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_consent_timestamp timestamptz,
ADD COLUMN IF NOT EXISTS sms_consent_ip text,
ADD COLUMN IF NOT EXISTS sms_opt_out_timestamp timestamptz;

-- Create SMS consent log table for compliance audit trail
CREATE TABLE IF NOT EXISTS public.sms_consent_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  action text NOT NULL, -- 'opt_in', 'opt_out', 'update_number'
  consent_given boolean NOT NULL,
  consent_timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_consent_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own consent logs
CREATE POLICY "Users can view own consent logs"
ON public.sms_consent_log
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own consent logs
CREATE POLICY "Users can insert own consent logs"
ON public.sms_consent_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sms_consent_log_user_id ON public.sms_consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_consent_log_phone ON public.sms_consent_log(phone_number);