-- Create vehicle_makes reference table
CREATE TABLE public.vehicle_makes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create api_providers reference table  
CREATE TABLE public.api_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  setup_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'api_key', -- api_key, oauth
  supported_makes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_api_credentials table for storing user tokens
CREATE TABLE public.user_api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.api_providers(id),
  encrypted_token TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

-- Enable RLS on all tables
ALTER TABLE public.vehicle_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_credentials ENABLE ROW LEVEL SECURITY;

-- Vehicle makes are public (read-only for everyone)
CREATE POLICY "Anyone can view vehicle makes" 
ON public.vehicle_makes 
FOR SELECT 
USING (true);

-- API providers are public (read-only for everyone)
CREATE POLICY "Anyone can view API providers" 
ON public.api_providers 
FOR SELECT 
USING (true);

-- User credentials - only owner can access
CREATE POLICY "Users can view own credentials" 
ON public.user_api_credentials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" 
ON public.user_api_credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" 
ON public.user_api_credentials 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" 
ON public.user_api_credentials 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add make and api_provider columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS make TEXT,
ADD COLUMN IF NOT EXISTS api_provider_id UUID REFERENCES public.api_providers(id),
ADD COLUMN IF NOT EXISTS api_credential_id UUID REFERENCES public.user_api_credentials(id);

-- Seed initial vehicle makes
INSERT INTO public.vehicle_makes (name, logo_url) VALUES
('Tesla', '/vehicle-logos/tesla.svg'),
('Rivian', '/vehicle-logos/rivian.svg'),
('Ford', '/vehicle-logos/ford.svg'),
('Chevrolet', '/vehicle-logos/chevrolet.svg'),
('BMW', '/vehicle-logos/bmw.svg'),
('Mercedes', '/vehicle-logos/mercedes.svg'),
('Volkswagen', '/vehicle-logos/volkswagen.svg'),
('Audi', '/vehicle-logos/audi.svg'),
('Porsche', '/vehicle-logos/porsche.svg'),
('Hyundai', '/vehicle-logos/hyundai.svg'),
('Kia', '/vehicle-logos/kia.svg'),
('Lucid', '/vehicle-logos/lucid.svg'),
('Polestar', '/vehicle-logos/polestar.svg');

-- Seed initial API providers (Tesla + Smartcar first)
INSERT INTO public.api_providers (name, display_name, description, setup_url, auth_type, supported_makes) VALUES
('tessie', 'Tessie', 'Best for Tesla vehicles - full telemetry, commands, and real-time data', 'https://my.tessie.com/settings/api', 'api_key', ARRAY['Tesla']),
('smartcar', 'Smartcar', 'Universal EV connector - works with 30+ brands', 'https://dashboard.smartcar.com/', 'oauth', ARRAY['Tesla', 'Rivian', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Volkswagen', 'Audi', 'Porsche', 'Hyundai', 'Kia', 'Lucid', 'Polestar']),
('tesla_fleet', 'Tesla Fleet API', 'Official Tesla API - requires developer account', 'https://developer.tesla.com/', 'oauth', ARRAY['Tesla']);

-- Add trigger for updated_at on user_api_credentials
CREATE TRIGGER update_user_api_credentials_updated_at
BEFORE UPDATE ON public.user_api_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add has_viewed_flagship column to profiles for gating consumer features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_viewed_flagship BOOLEAN DEFAULT false;