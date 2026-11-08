-- Reservations for NOVA venues. Only staff-authenticated APIs may list or update these records.
CREATE TABLE IF NOT EXISTS reservations (
 id TEXT PRIMARY KEY NOT NULL,
 venue TEXT NOT NULL CHECK (venue IN ('zyb','pob','east')),
 guest_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 booking_date TEXT NOT NULL,
 booking_time TEXT NOT NULL,
 guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 16),
 comment TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','cancelled','completed','no_show')),
 source TEXT NOT NULL DEFAULT 'website',
 consent_at TEXT NOT NULL,
 telegram_sent_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nova_reservations_date ON reservations(booking_date,booking_time);
CREATE INDEX IF NOT EXISTS idx_nova_reservations_venue_status ON reservations(venue,status,booking_date);
CREATE INDEX IF NOT EXISTS idx_nova_reservations_created ON reservations(created_at);
CREATE TABLE IF NOT EXISTS reservation_rate_limits (
 ip_hash TEXT PRIMARY KEY NOT NULL,
 window_started INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reservation_audit (
 id TEXT PRIMARY KEY NOT NULL,
 reservation_id TEXT NOT NULL,
 from_status TEXT NOT NULL,
 to_status TEXT NOT NULL,
 changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nova_reservation_audit ON reservation_audit(reservation_id,changed_at);
