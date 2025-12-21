-- Add beta_access_audit tracking columns
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS access_code_attempted TEXT;
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'password';

-- Add claimed_by to beta_testers to track which user claimed the code
ALTER TABLE beta_testers ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID;
ALTER TABLE beta_testers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;