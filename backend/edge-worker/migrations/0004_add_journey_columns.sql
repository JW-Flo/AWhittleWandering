-- Add additional missing columns to journeys table
ALTER TABLE journeys ADD COLUMN total_drives INTEGER DEFAULT 0;
ALTER TABLE journeys ADD COLUMN last_updated TEXT;
