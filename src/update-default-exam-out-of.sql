
-- Update default_exam_out_of from 100 to 20 for all schools
-- This aligns with the common grading system where exams are out of 20

-- Update the default value in the schools table
ALTER TABLE schools 
ALTER COLUMN default_exam_out_of SET DEFAULT 20;

-- Update existing schools to use 20 if they're still using 100
UPDATE schools 
SET default_exam_out_of = 20 
WHERE default_exam_out_of = 100;

-- Verify the change
-- SELECT id, name, default_exam_out_of FROM schools;
