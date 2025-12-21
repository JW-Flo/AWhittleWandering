-- Add voice/audio support to journal_entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS transcription_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS waypoint_id uuid;

-- Add index for waypoint association
CREATE INDEX IF NOT EXISTS idx_journal_entries_waypoint_id ON journal_entries(waypoint_id);

-- Add notify_daily_memory option to notification_preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS notify_daily_memory boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_memory_time time DEFAULT '20:00:00';

COMMENT ON COLUMN journal_entries.audio_url IS 'Storage path to original voice recording';
COMMENT ON COLUMN journal_entries.transcription_source IS 'How content was created: manual, voice, or ai_assisted';
COMMENT ON COLUMN journal_entries.waypoint_id IS 'Optional link to specific waypoint';
COMMENT ON COLUMN notification_preferences.notify_daily_memory IS 'Send daily reminder to capture memories';
COMMENT ON COLUMN notification_preferences.daily_memory_time IS 'Time to send daily memory reminder';