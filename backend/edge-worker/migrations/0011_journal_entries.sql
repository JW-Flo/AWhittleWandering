-- Journal entries for the journey narrative
-- Writable by authenticated users; publicly readable

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id TEXT NOT NULL DEFAULT 'continental-usa-2025',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT,
  mood TEXT DEFAULT 'neutral',
  entry_type TEXT DEFAULT 'manual',
  auto_generated INTEGER DEFAULT 0,
  author_id TEXT,
  is_public INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_journey
  ON journal_entries(journey_id, created_at DESC);
