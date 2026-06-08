-- Migration: add schools.auto_update_periods
--
-- The Academic Management page lets an admin toggle automatic advancement of
-- the current academic year / term / sequence. That toggle reads and writes
-- schools.auto_update_periods, which was missing from the base schema and
-- caused a 400 (Bad Request) on the schools query.
--
-- Run this once against the database (e.g. in the Supabase SQL editor).

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS auto_update_periods BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN schools.auto_update_periods IS
  'When true, scheduled jobs/triggers may automatically advance the current academic year, term, and sequence as periods end.';
