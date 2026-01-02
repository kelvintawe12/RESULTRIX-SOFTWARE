
-- SIMPLE FIX: Disable the recalc_grades trigger
-- The enrollments table doesn't have total_marks/average_marks columns
-- So this trigger is trying to update columns that don't exist

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_recalc_grades ON marks;

-- Optionally drop the function too (it's not needed if the columns don't exist)
DROP FUNCTION IF EXISTS recalc_grades_and_averages() CASCADE;

-- Verify only the essential trigger remains
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'marks'
ORDER BY trigger_name, event_manipulation;

-- Expected output (only the school_id auto-fill trigger):
-- trg_auto_fill_marks_school_id | INSERT | BEFORE | EXECUTE FUNCTION auto_fill_marks_school_id()

COMMENT ON TABLE marks IS 'Grade recalculation trigger disabled - enrollments table does not have total_marks/average_marks columns';
