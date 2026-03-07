-- Run this in Neon SQL Editor if booking fails with:
--   column "booking_source" of relation "booking" does not exist
-- Use the same Neon project/branch that your Render DATABASE_URL points to.

ALTER TABLE booking
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) NOT NULL DEFAULT 'turfstack';
