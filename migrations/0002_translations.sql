-- NOVA: persist English translations, so language switching never invokes AI for visitors.
CREATE TABLE IF NOT EXISTS site_content_en (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE events ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN description_en TEXT NOT NULL DEFAULT '';
