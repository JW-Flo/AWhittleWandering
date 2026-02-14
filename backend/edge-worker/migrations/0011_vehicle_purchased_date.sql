-- Migration 0011: Add purchased_date column to vehicles table
-- Reasoning: When a vehicle is onboarded, we should capture when it was purchased/delivered
-- to provide a more accurate start date for historical drive data imports instead of
-- defaulting to 2012-06-01 (earliest Tesla Model S delivery).
--
-- This allows the system to:
-- 1. Avoid unnecessary API calls for data before the vehicle existed
-- 2. Improve performance during historical data ingestion
-- 3. Provide more accurate historical boundaries for analytics

-- Add purchased_date column to vehicles table
-- Using DATE type to store the purchase/delivery date of the vehicle
-- Nullable to allow existing vehicles without a known purchase date
ALTER TABLE vehicles ADD COLUMN purchased_date DATE;

-- Optionally set a default for the existing vehicle if known
-- This is commented out since we don't have the actual purchase date
-- UPDATE vehicles SET purchased_date = '2023-01-01' WHERE id = 'midnight-shadow';
