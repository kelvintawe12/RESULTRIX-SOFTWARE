
-- COMPREHENSIVE FIX: Fix ALL triggers causing ambiguous column errors
-- Run this in Supabase SQL Editor

-- 1. Drop the problematic recalc_grades trigger
DROP TRIGGER IF EXISTS trg_recalc_grades ON marks;

-- 2. Recreate the recalc_grades_and_averages function with proper column qualification
CREATE OR REPLACE FUNCTION recalc_grades_and_averages()
RETURNS TRIGGER AS $$
BEGIN
  -- Use NEW.enrollment_id explicitly to avoid ambiguity
  UPDATE enrollments
  SET 
    total_marks = (
      SELECT COALESCE(SUM(m.score), 0)
      FROM marks m
      WHERE m.enrollment_id = NEW.enrollment_id
    ),
    average_marks = (
      SELECT COALESCE(AVG(m.score), 0)
      FROM marks m
      WHERE m.enrollment_id = NEW.enrollment_id
    ),
    updated_at = NOW()
  WHERE enrollments.id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
CREATE TRIGGER trg_recalc_grades
  AFTER INSERT OR UPDATE ON marks
  FOR EACH ROW
  EXECUTE FUNCTION recalc_grades_and_averages();

-- 4. Verify all triggers on marks table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'marks'
ORDER BY trigger_name, event_manipulation;

-- Expected output:
-- trg_auto_fill_marks_school_id | INSERT | BEFORE | EXECUTE FUNCTION auto_fill_marks_school_id()
-- trg_recalc_grades             | INSERT | AFTER  | EXECUTE FUNCTION recalc_grades_and_averages()
-- trg_recalc_grades             | UPDATE | AFTER  | EXECUTE FUNCTION recalc_grades_and_averages()
