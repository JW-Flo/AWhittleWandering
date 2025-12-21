-- Create table to store raw Tessie drive data for secure long-term storage
CREATE TABLE public.tessie_drives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tessie_drive_id bigint UNIQUE NOT NULL,
  vin text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone NOT NULL,
  starting_latitude numeric NOT NULL,
  starting_longitude numeric NOT NULL,
  starting_location text,
  starting_odometer numeric,
  starting_battery integer,
  ending_latitude numeric NOT NULL,
  ending_longitude numeric NOT NULL,
  ending_location text,
  ending_odometer numeric,
  ending_battery integer,
  odometer_distance numeric,
  energy_used numeric,
  average_speed numeric,
  max_speed numeric,
  average_inside_temp numeric,
  average_outside_temp numeric,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for curated flagship waypoints (the 50-60 highlighted stops)
CREATE TABLE public.flagship_waypoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  waypoint_number integer NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  arrived_at timestamp with time zone NOT NULL,
  departed_at timestamp with time zone,
  dwell_minutes integer,
  odometer_miles integer,
  battery_on_arrival integer,
  waypoint_type text NOT NULL DEFAULT 'stop', -- 'stop', 'park', 'friend', 'family', 'landmark'
  description text,
  people_met text[],
  is_highlight boolean DEFAULT false,
  state_code char(2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tessie_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagship_waypoints ENABLE ROW LEVEL SECURITY;

-- Tessie drives: only admins can manage, service role for sync
CREATE POLICY "Admins can manage tessie drives"
  ON public.tessie_drives FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Flagship waypoints: public read for the showcase, admin write
CREATE POLICY "Anyone can view flagship waypoints"
  ON public.flagship_waypoints FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage flagship waypoints"
  ON public.flagship_waypoints FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient queries
CREATE INDEX idx_tessie_drives_vin_started ON public.tessie_drives(vin, started_at DESC);
CREATE INDEX idx_tessie_drives_tessie_id ON public.tessie_drives(tessie_drive_id);
CREATE INDEX idx_flagship_waypoints_number ON public.flagship_waypoints(waypoint_number);
CREATE INDEX idx_flagship_waypoints_arrived ON public.flagship_waypoints(arrived_at);