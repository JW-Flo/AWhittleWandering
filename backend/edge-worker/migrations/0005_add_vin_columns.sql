-- Add vin column to drives and charges tables to fix data ingestion errors
-- This addresses the "table drives has no column named vin" errors

-- Add vin column to drives table
ALTER TABLE drives ADD COLUMN vin TEXT;

-- Add vin column to charges table  
ALTER TABLE charges ADD COLUMN vin TEXT;

-- Create indexes for the new vin columns
CREATE INDEX IF NOT EXISTS idx_drives_vin ON drives(vin);
CREATE INDEX IF NOT EXISTS idx_charges_vin ON charges(vin);
