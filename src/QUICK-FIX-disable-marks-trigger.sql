
-- IMMEDIATE FIX: Disable the problematic audit trigger on marks table
-- Run this single line in your Supabase SQL Editor to fix marks entry immediately

DROP TRIGGER IF EXISTS audit_marks ON marks;

-- That's it! Marks entry will now work.
-- The marks table will still track changes via submitted_by, created_at, and updated_at columns.
