
-- Add missing grade calculation columns to enrollments table
-- This will allow the trg_recalc_grades trigger to work properly

-- 1. Add the missing columns to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS total_marks DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_marks DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS grade VARCHAR(2),
ADD COLUMN IF NOT EXISTS grade_point DECIMAL(3, 2);

-- 2. Add helpful comments
COMMENT ON COLUMN enrollments.total_marks IS 'Sum of all marks for this enrollment across all sequences';
COMMENT ON COLUMN enrollments.average_marks IS 'Average of all marks for this enrollment';
COMMENT ON COLUMN enrollments.grade IS 'Letter grade (A, B, C, D, F) based on average';
COMMENT ON COLUMN enrollments.grade_point IS 'GPA equivalent (4.0 scale)';

-- 3. Create an improved recalc_grades_and_averages function
CREATE OR REPLACE FUNCTION recalc_grades_and_averages()
RETURNS TRIGGER AS $$
DECLARE
  v_total DECIMAL(10, 2);
  v_average DECIMAL(10, 2);
  v_grade VARCHAR(2);
  v_grade_point DECIMAL(3, 2);
BEGIN
  -- Calculate total and average marks for this enrollment
  SELECT 
    COALESCE(SUM(m.score), 0),
    COALESCE(AVG(m.score), 0)
  INTO v_total, v_average
  FROM marks m
  WHERE m.enrollment_id = NEW.enrollment_id;
  
  -- Determine letter grade and grade point based on average
  -- Assuming a standard grading scale (can be customized)
  IF v_average >= 90 THEN
    v_grade := 'A';
    v_grade_point := 4.0;
  ELSIF v_average >= 80 THEN
    v_grade := 'B';
    v_grade_point := 3.0;
  ELSIF v_average >= 70 THEN
    v_grade := 'C';
    v_grade_point := 2.0;
  ELSIF v_average >= 60 THEN
    v_grade := 'D';
    v_grade_point := 1.0;
  ELSE
    v_grade := 'F';
    v_grade_point := 0.0;
  END IF;
  
  -- Update the enrollments table with calculated values
  UPDATE enrollments
  SET 
    total_marks = v_total,
    average_marks = v_average,
    grade = v_grade,
    grade_point = v_grade_point,
    updated_at = NOW()
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS trg_recalc_grades ON marks;

CREATE TRIGGER trg_recalc_grades
  AFTER INSERT OR UPDATE ON marks
  FOR EACH ROW
  EXECUTE FUNCTION recalc_grades_and_averages();

-- 5. Backfill existing data (calculate grades for all existing enrollments)
DO $$
DECLARE
  enrollment_record RECORD;
  v_total DECIMAL(10, 2);
  v_average DECIMAL(10, 2);
  v_grade VARCHAR(2);
  v_grade_point DECIMAL(3, 2);
BEGIN
  FOR enrollment_record IN SELECT id FROM enrollments LOOP
    -- Calculate for each enrollment
    SELECT 
      COALESCE(SUM(m.score), 0),
      COALESCE(AVG(m.score), 0)
    INTO v_total, v_average
    FROM marks m
    WHERE m.enrollment_id = enrollment_record.id;
    
    -- Determine grade
    IF v_average >= 90 THEN
      v_grade := 'A';
      v_grade_point := 4.0;
    ELSIF v_average >= 80 THEN
      v_grade := 'B';
      v_grade_point := 3.0;
    ELSIF v_average >= 70 THEN
      v_grade := 'C';
      v_grade_point := 2.0;
    ELSIF v_average >= 60 THEN
      v_grade := 'D';
      v_grade_point := 1.0;
    ELSE
      v_grade := 'F';
      v_grade_point := 0.0;
    END IF;
    
    -- Update enrollment
    UPDATE enrollments
    SET 
      total_marks = v_total,
      average_marks = v_average,
      grade = v_grade,
      grade_point = v_grade_point
    WHERE id = enrollment_record.id;
  END LOOP;
END $$;

-- 6. Verify the setup
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'marks'
ORDER BY trigger_name, event_manipulation;

-- 7. Show sample of updated enrollments
SELECT 
  id,
  student_id,
  subject_id,
  total_marks,
  average_marks,
  grade,
  grade_point
FROM enrollments
LIMIT 10;
