-- Venue-scoped staff users and revocable independent sessions.
-- There is exactly one owner credential, stored in Cloudflare secrets; site staff
-- can only be provisioned by that owner through the protected RESERVED API.
CREATE TABLE IF NOT EXISTS reservation_users (
 id TEXT PRIMARY KEY NOT NULL,
 username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL,
 venue TEXT NOT NULL CHECK (venue IN ('zyb','pob','east')),
 role TEXT NOT NULL CHECK (role IN ('manager','viewer')),
 salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reservation_users_venue ON reservation_users(venue,active);
CREATE TABLE IF NOT EXISTS reservation_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 user_id TEXT,
 expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reservation_sessions_user ON reservation_sessions(user_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_reservation_sessions_expiry ON reservation_sessions(expires_at);
CREATE TABLE IF NOT EXISTS reservation_staff_audit (
 id TEXT PRIMARY KEY NOT NULL,
 actor TEXT NOT NULL,
 target_user_id TEXT NOT NULL,
 action TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE reservation_audit ADD COLUMN actor TEXT NOT NULL DEFAULT 'legacy_owner';
