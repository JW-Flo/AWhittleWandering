-- Add Cloudflare D1 database tracking to journeys
ALTER TABLE public.journeys 
ADD COLUMN IF NOT EXISTS cloudflare_d1_id TEXT,
ADD COLUMN IF NOT EXISTS cloudflare_d1_name TEXT,
ADD COLUMN IF NOT EXISTS data_storage_type TEXT DEFAULT 'supabase';

-- Add index for D1 lookups
CREATE INDEX IF NOT EXISTS idx_journeys_d1_id ON public.journeys(cloudflare_d1_id) WHERE cloudflare_d1_id IS NOT NULL;

COMMENT ON COLUMN public.journeys.cloudflare_d1_id IS 'Cloudflare D1 database UUID for compartmentalized drive data storage';
COMMENT ON COLUMN public.journeys.data_storage_type IS 'Storage backend: supabase, cloudflare_d1, or user_provided';