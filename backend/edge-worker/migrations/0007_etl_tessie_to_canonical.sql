-- Migration: Transform tessie_drives to canonical drives table
-- Date: 2026-01-30
-- Purpose: Populate drives table from raw Tessie telemetry
-- Note: This migration is always skipped in automated migrations
--       It will be executed manually when the tessie_drives data is imported

-- Explicit no-op: This migration is intentionally skipped in automated migration runs.
-- The tessie_drives source table does not exist in the base schema.
-- When tessie_drives table is created and populated, run this transformation manually:
-- 
-- INSERT OR IGNORE INTO drives (...)
-- SELECT ... FROM tessie_drives td
-- WHERE td.tessie_drive_id NOT IN (SELECT tessie_id FROM drives WHERE tessie_id IS NOT NULL);
-- 
-- Then update journey aggregates and populate states_visited.

SELECT 1; -- Explicit no-op statement

-- No-op: Ensures migration can be run multiple times without error