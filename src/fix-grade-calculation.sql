
-- Fix grade calculation to use percentage instead of raw average
-- The issue: grades were null because we need to calculate percentage, not just average score

CREATE OR REPLACE FUNCTION recalc_grades_and_averages()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score DECIMAL(10, 2);
  v_total_out_of DECIMAL(10, 2);
  v_percentage DECIMAL(5, 2);
  v_grade VARCHAR(2);
  v_grade_point DECIMAL(3, 2);
BEGIN
  -- Calculate total score and total out_of for this enrollment
  SELECT 
    COALESCE(SUM(m.score), 0),
    COALESCE(SUM(m.out_of), 0)
  INTO v_total_score, v_total_out_of
  FROM marks m
  WHERE m.enrollment_id = NEW.enrollment_id;
  
  -- Calculate percentage
  IF v_total_out_of > 0 THEN
    v_percentage := (v_total_score / v_total_out_of) * 100;
  ELSE
    v_percentage := 0;
  END IF;
  
  -- Determine letter grade and grade point based on percentage
  IF v_percentage >= 90 THEN
    v_grade := 'A';
    v_grade_point := 4.0;
  ELSIF v_percentage >= 80 THEN
    v_grade := 'B';
    v_grade_point := 3.0;
  ELSIF v_percentage >= 70 THEN
    v_grade := 'C';
    v_grade_point := 2.0;
  ELSIF v_percentage >= 60 THEN
    v_grade := 'D';
    v_grade_point := 1.0;
  ELSE
    v_grade := 'F';
    v_grade_point := 0.0;
  END IF;
  
  -- Update the enrollments table
  UPDATE enrollments
  SET 
    total_marks = v_total_score,
    average_marks = v_percentage,  -- Store percentage as average
    grade = v_grade,
    grade_point = v_grade_point,
    updated_at = NOW()
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing enrollments with correct grades
DO $$
DECLARE
  enrollment_record RECORD;
  v_total_score DECIMAL(10, 2);
  v_total_out_of DECIMAL(10, 2);
  v_percentage DECIMAL(5, 2);
  v_grade VARCHAR(2);
  v_grade_point DECIMAL(3, 2);
BEGIN
  FOR enrollment_record IN SELECT id FROM enrollments LOOP
    SELECT 
      COALESCE(SUM(m.score), 0),
      COALESCE(SUM(m.out_of), 0)
    INTO v_total_score, v_total_out_of
    FROM marks m
    WHERE m.enrollment_id = enrollment_record.id;
    
    -- Calculate percentage
    IF v_total_out_of > 0 THEN
      v_percentage := (v_total_score / v_total_out_of) * 100;
    ELSE
      v_percentage := 0;
    END IF;
    
    -- Determine grade
    IF v_percentage >= 90 THEN
      v_grade := 'A';
      v_grade_point := 4.0;
    ELSIF v_percentage >= 80 THEN
      v_grade := 'B';
      v_grade_point := 3.0;
    ELSIF v_percentage >= 70 THEN
      v_grade := 'C';
      v_grade_point := 2.0;
    ELSIF v_percentage >= 60 THEN
      v_grade := 'D';
      v_grade_point := 1.0;
    ELSE
      v_grade := 'F';
      v_grade_point := 0.0;
    END IF;
    
    UPDATE enrollments
    SET 
      total_marks = v_total_score,
      average_marks = v_percentage,
      grade = v_grade,
      grade_point = v_grade_point
    WHERE id = enrollment_record.id;
  END LOOP;
END $$;

-- Verify the results
SELECT 
  e.id,
  s.full_name as student_name,
  sub.name as subject_name,
  e.total_marks,
  e.average_marks as percentage,
  e.grade,
  e.grade_point
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN subjects sub ON e.subject_id = sub.id
WHERE e.total_marks > 0
ORDER BY s.full_name, sub.name
LIMIT 20;
