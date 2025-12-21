-- Add archival columns to journeys table
ALTER TABLE public.journeys 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archive_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS export_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS export_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient archived journey queries
CREATE INDEX IF NOT EXISTS idx_journeys_archived ON public.journeys(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journeys_archive_expires ON public.journeys(archive_expires_at) WHERE archive_expires_at IS NOT NULL;

-- Track user activity for determining archive retention
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for activity tracking
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at);

-- Function to update last_active_at on user activity
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_active_at = now() 
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on journeys to track activity
DROP TRIGGER IF EXISTS track_journey_activity ON public.journeys;
CREATE TRIGGER track_journey_activity
AFTER INSERT OR UPDATE ON public.journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_user_last_active();

-- Comment for documentation
COMMENT ON COLUMN public.journeys.archived_at IS 'Timestamp when journey was archived. NULL means active.';
COMMENT ON COLUMN public.journeys.archive_expires_at IS 'When archived data will be permanently deleted. 1 year for active users, 90 days for inactive.';
COMMENT ON COLUMN public.profiles.last_active_at IS 'Last activity timestamp for determining archive retention (active = 1yr, inactive = 90 days)';