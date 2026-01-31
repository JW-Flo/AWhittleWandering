-- Migration: Transform tessie_drives to canonical drives table
-- Date: 2026-01-30
-- Purpose: Populate drives table from raw Tessie telemetry
-- Note: This migration is a no-op if tessie_drives table doesn't exist
--       It will be executed manually when the tessie_drives data is imported

-- This migration is intentionally empty in the automated migration process.
-- When tessie_drives table is created and populated, run this transformation manually:
-- 
-- INSERT OR IGNORE INTO drives (...)
-- SELECT ... FROM tessie_drives td
-- WHERE td.tessie_drive_id NOT IN (SELECT tessie_id FROM drives WHERE tessie_id IS NOT NULL);
-- 
-- Then update journey aggregates and populate states_visited.

-- No-op: Ensures migration can be run multiple times without error