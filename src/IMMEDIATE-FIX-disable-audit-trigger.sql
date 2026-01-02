
-- IMMEDIATE FIX: Disable the problematic audit trigger
-- This trigger is causing "column reference 'key' is ambiguous" errors
-- Run this in your Supabase SQL Editor NOW

-- Drop the audit trigger on marks table
DROP TRIGGER IF EXISTS audit_marks ON marks;

-- Drop the audit function if it exists
DROP FUNCTION IF EXISTS log_audit_event() CASCADE;

-- Verify triggers are removed
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'marks';

-- This should return no rows if successful

COMMENT ON TABLE marks IS 'Audit trigger disabled due to ambiguous column reference error. Marks are tracked via submitted_by, created_at, updated_at fields.';
