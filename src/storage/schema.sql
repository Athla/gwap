PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS notifications (
	event_id TEXT NOT NULL,
	notification_time  INTEGER NOT NULL,
	sent_at TEXT NOT NULL,
	PRIMARY KEY (event_id, notification_time)
);

CREATE INDEX IF NOT EXISTS idx_sent_at ON notifications(sent_at);
