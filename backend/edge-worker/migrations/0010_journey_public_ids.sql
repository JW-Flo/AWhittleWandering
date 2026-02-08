-- Migration 0010: Add opaque public IDs to journeys
-- Reasoning: Public-facing URLs should use opaque numeric IDs instead of
-- human-readable slugs to avoid leaking journey names and simplify cross-component references.
--
-- Uses a separate lookup table instead of ALTER TABLE ADD COLUMN because
-- SQLite ALTER TABLE ADD COLUMN is not idempotent and the CI migrations
-- check requires all migrations to be safely re-runnable.

CREATE TABLE IF NOT EXISTS journey_public_ids (
  journey_id TEXT PRIMARY KEY REFERENCES journeys(id),
  public_id INTEGER UNIQUE NOT NULL
);

INSERT OR IGNORE INTO journey_public_ids (journey_id, public_id)
VALUES ('continental-usa-2025', 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_public_ids_public_id
ON journey_public_ids(public_id);
