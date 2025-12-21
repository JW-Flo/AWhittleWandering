-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add unique constraint for tessie_drive_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tessie_drives_tessie_drive_id_key'
  ) THEN
    ALTER TABLE public.tessie_drives ADD CONSTRAINT tessie_drives_tessie_drive_id_key UNIQUE (tessie_drive_id);
  END IF;
END $$;