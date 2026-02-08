-- Migration 0010: Add opaque public IDs to journeys
-- Reasoning: Public-facing URLs should use opaque numeric IDs instead of
-- human-readable slugs to avoid leaking journey names and simplify cross-component references.

ALTER TABLE journeys ADD COLUMN public_id INTEGER UNIQUE;

-- Populate existing journey with public_id = 1
UPDATE journeys SET public_id = 1 WHERE id = 'continental-usa-2025';

-- Create index for fast public_id lookups
CREATE INDEX IF NOT EXISTS idx_journeys_public_id ON journeys(public_id);
