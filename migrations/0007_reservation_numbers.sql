-- Permanent, increasing public booking numbers for Telegram notifications.
-- Preserve historical reservation order and never reuse a number after deletion.
CREATE TABLE IF NOT EXISTS reservation_numbers (
 number INTEGER PRIMARY KEY AUTOINCREMENT,
 reservation_id TEXT NOT NULL UNIQUE
);
INSERT OR IGNORE INTO reservation_numbers(number,reservation_id)
 SELECT rowid,id FROM reservations ORDER BY rowid;
CREATE TRIGGER IF NOT EXISTS reservation_number_after_insert
 AFTER INSERT ON reservations
 BEGIN
  INSERT INTO reservation_numbers(reservation_id) VALUES(NEW.id);
 END;
