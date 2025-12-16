-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vin TEXT,
  nickname TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  color TEXT,
  tessie_vehicle_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create journeys table
CREATE TABLE public.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_public BOOLEAN DEFAULT false,
  total_miles NUMERIC(10,2) DEFAULT 0,
  total_kwh NUMERIC(10,2) DEFAULT 0,
  states_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create drive_data table for GPS telemetry
CREATE TABLE public.drive_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  elevation_ft NUMERIC(8,2),
  speed_mph NUMERIC(5,2),
  odometer NUMERIC(10,2),
  battery_level INTEGER,
  battery_range NUMERIC(6,2),
  outside_temp_f NUMERIC(5,2),
  inside_temp_f NUMERIC(5,2),
  power_kw NUMERIC(6,2),
  energy_used_kwh NUMERIC(8,4),
  heading INTEGER,
  is_charging BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create charging_sessions table
CREATE TABLE public.charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  location_name TEXT,
  charger_type TEXT,
  energy_added_kwh NUMERIC(8,4),
  cost_usd NUMERIC(8,2),
  max_charge_rate_kw NUMERIC(6,2),
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  title TEXT,
  content TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  location_name TEXT,
  state_code CHAR(2),
  mood TEXT,
  people_met TEXT[],
  photo_urls TEXT[],
  is_highlight BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create states_visited table
CREATE TABLE public.states_visited (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  state_code CHAR(2) NOT NULL,
  state_name TEXT NOT NULL,
  first_entered_at TIMESTAMP WITH TIME ZONE,
  is_gps_verified BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(journey_id, state_code)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states_visited ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "Users can view own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Journeys policies
CREATE POLICY "Users can view own journeys" ON public.journeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public journeys" ON public.journeys
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own journeys" ON public.journeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journeys" ON public.journeys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journeys" ON public.journeys
  FOR DELETE USING (auth.uid() = user_id);

-- Drive data policies
CREATE POLICY "Users can view own drive data" ON public.drive_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journey drive data" ON public.drive_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journeys WHERE id = journey_id AND is_public = true)
  );

CREATE POLICY "Users can insert own drive data" ON public.drive_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drive data" ON public.drive_data
  FOR DELETE USING (auth.uid() = user_id);

-- Charging sessions policies
CREATE POLICY "Users can view own charging sessions" ON public.charging_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journey charging" ON public.charging_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journeys WHERE id = journey_id AND is_public = true)
  );

CREATE POLICY "Users can insert own charging sessions" ON public.charging_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charging sessions" ON public.charging_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own charging sessions" ON public.charging_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journey journal" ON public.journal_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journeys WHERE id = journey_id AND is_public = true)
  );

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- States visited policies
CREATE POLICY "Users can view own states visited" ON public.states_visited
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journey states" ON public.states_visited
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.journeys WHERE id = journey_id AND is_public = true)
  );

CREATE POLICY "Users can insert own states visited" ON public.states_visited
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own states visited" ON public.states_visited
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own states visited" ON public.states_visited
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_drive_data_journey_id ON public.drive_data(journey_id);
CREATE INDEX idx_drive_data_recorded_at ON public.drive_data(recorded_at);
CREATE INDEX idx_drive_data_coords ON public.drive_data(latitude, longitude);
CREATE INDEX idx_charging_sessions_journey_id ON public.charging_sessions(journey_id);
CREATE INDEX idx_charging_sessions_started_at ON public.charging_sessions(started_at);
CREATE INDEX idx_journal_entries_journey_id ON public.journal_entries(journey_id);
CREATE INDEX idx_states_visited_journey_id ON public.states_visited(journey_id);
CREATE INDEX idx_journeys_user_id ON public.journeys(user_id);
CREATE INDEX idx_journeys_public ON public.journeys(is_public) WHERE is_public = true;