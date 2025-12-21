-- Add missing API providers: Rivian, Ford Pass, GM OnStar
INSERT INTO api_providers (name, display_name, description, auth_type, supported_makes, is_active)
VALUES 
  ('rivian', 'Rivian API', 'Official Rivian API for R1T and R1S vehicles', 'oauth', ARRAY['Rivian'], false),
  ('ford_pass', 'Ford Pass', 'FordPass Connect for Ford EVs including F-150 Lightning and Mustang Mach-E', 'oauth', ARRAY['Ford'], false),
  ('gm_onstar', 'GM OnStar', 'OnStar API for Chevrolet, GMC, and Cadillac EVs including Bolt and Hummer EV', 'oauth', ARRAY['Chevrolet', 'GMC', 'Cadillac'], false)
ON CONFLICT (name) DO NOTHING;