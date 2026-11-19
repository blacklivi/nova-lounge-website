-- Telegram groups are linked to NOVA venues after an admin enters the setup code.
-- No bot token or other credentials are stored in D1 or in source control.
CREATE TABLE IF NOT EXISTS telegram_venue_chats (
 venue TEXT PRIMARY KEY NOT NULL CHECK(venue IN ('zyb','pob','east')),
 chat_id TEXT NOT NULL UNIQUE,
 linked_by TEXT NOT NULL,
 linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE reservations ADD COLUMN telegram_chat_id TEXT;
ALTER TABLE reservations ADD COLUMN telegram_message_id INTEGER;
