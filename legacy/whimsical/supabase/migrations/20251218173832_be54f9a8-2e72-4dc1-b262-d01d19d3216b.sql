-- Create beta testers table for pre-launch access
CREATE TABLE public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  access_code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(100),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage beta testers
CREATE POLICY "Admins can manage beta testers"
ON public.beta_testers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow public to verify access codes (for login)
CREATE POLICY "Anyone can verify access codes"
ON public.beta_testers
FOR SELECT
TO anon
USING (true);

-- Insert initial beta testers with unique access codes
INSERT INTO public.beta_testers (email, access_code, name) VALUES
  ('tester1@beta.aww', 'AWW-BETA-Kj9mN2xL4pQr', 'Beta Tester 1'),
  ('tester2@beta.aww', 'AWW-BETA-Th7vB5cF8wYz', 'Beta Tester 2'),
  ('tester3@beta.aww', 'AWW-BETA-Rx3nD6gH1sUa', 'Beta Tester 3'),
  ('tester4@beta.aww', 'AWW-BETA-Wm4pE9jK2tVb', 'Beta Tester 4'),
  ('tester5@beta.aww', 'AWW-BETA-Lc8qF3hN5yXd', 'Beta Tester 5'),
  ('friend1@beta.aww', 'AWW-BETA-Zn6sG7rM4wPe', 'Friend Access 1'),
  ('friend2@beta.aww', 'AWW-BETA-Qk2tH8vJ5xUf', 'Friend Access 2'),
  ('agent1@beta.aww', 'AWW-BETA-Yb9wL3cN6pRg', 'Agent Auditor 1'),
  ('agent2@beta.aww', 'AWW-BETA-Xf5mS1dK7qTh', 'Agent Auditor 2'),
  ('agent3@beta.aww', 'AWW-BETA-Ua4nV2eP8rWi', 'Agent Auditor 3');