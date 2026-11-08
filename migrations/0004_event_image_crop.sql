-- Preserve the original image URL and save a presentation-only crop per event.
ALTER TABLE events ADD COLUMN image_crop TEXT NOT NULL DEFAULT '50,50,100';
