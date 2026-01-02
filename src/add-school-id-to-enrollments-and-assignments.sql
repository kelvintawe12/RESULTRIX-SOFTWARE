
-- =====================================================
-- Migration: Add school_id to enrollments and teacher_assignments
-- Purpose: Fix audit trigger errors by adding missing school_id columns
-- =====================================================

-- Add school_id to enrollments table
ALTER TABLE enrollments
ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

COMMENT ON COLUMN enrollments.school_id IS 'Links enrollment to school for multi-tenancy and audit logging';

-- Add school_id to teacher_assignments table
ALTER TABLE teacher_assignments
ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

COMMENT ON COLUMN teacher_assignments.school_id IS 'Links teacher assignment to school for multi-tenancy and audit logging';

-- Create indexes for better query performance
CREATE INDEX idx_enrollments_school_id ON enrollments(school_id);
CREATE INDEX idx_teacher_assignments_school_id ON teacher_assignments(school_id);

-- =====================================================
-- Backfill existing data with school_id
-- =====================================================

-- Backfill enrollments.school_id from students table
UPDATE enrollments e
SET school_id = s.school_id
FROM students s
WHERE e.student_id = s.id
  AND e.school_id IS NULL;

-- Backfill teacher_assignments.school_id from users table
UPDATE teacher_assignments ta
SET school_id = u.school_id
FROM users u
WHERE ta.teacher_id = u.id
  AND ta.school_id IS NULL;

-- =====================================================
-- Make school_id NOT NULL after backfill
-- =====================================================

-- Make school_id required for enrollments
ALTER TABLE enrollments
ALTER COLUMN school_id SET NOT NULL;

-- Make school_id required for teacher_assignments
ALTER TABLE teacher_assignments
ALTER COLUMN school_id SET NOT NULL;

-- =====================================================
-- Update audit trigger to handle school_id gracefully
-- =====================================================

-- Drop and recreate the audit trigger function with better error handling
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_school_id UUID;
  v_action_type VARCHAR(50);
  v_details JSONB;
BEGIN
  -- Get current user
  v_user_id := get_current_user_id();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action_type := TG_TABLE_NAME || '_created';
    v_details := to_jsonb(NEW);
    
    -- Try to get school_id from NEW record, fallback to related tables
    IF TG_TABLE_NAME = 'enrollments' THEN
      v_school_id := COALESCE(
        NEW.school_id,
        (SELECT school_id FROM students WHERE id = NEW.student_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSIF TG_TABLE_NAME = 'teacher_assignments' THEN
      v_school_id := COALESCE(
        NEW.school_id,
        (SELECT school_id FROM users WHERE id = NEW.teacher_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSE
      -- For other tables, try NEW.school_id or get from user
      BEGIN
        v_school_id := NEW.school_id;
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := TG_TABLE_NAME || '_updated';
    v_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key
      )
    );
    
    -- Try to get school_id from NEW/OLD record, fallback to related tables
    IF TG_TABLE_NAME = 'enrollments' THEN
      v_school_id := COALESCE(
        NEW.school_id,
        OLD.school_id,
        (SELECT school_id FROM students WHERE id = NEW.student_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSIF TG_TABLE_NAME = 'teacher_assignments' THEN
      v_school_id := COALESCE(
        NEW.school_id,
        OLD.school_id,
        (SELECT school_id FROM users WHERE id = NEW.teacher_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSE
      BEGIN
        v_school_id := COALESCE(NEW.school_id, OLD.school_id);
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := TG_TABLE_NAME || '_deleted';
    v_details := to_jsonb(OLD);
    
    -- Try to get school_id from OLD record, fallback to related tables
    IF TG_TABLE_NAME = 'enrollments' THEN
      v_school_id := COALESCE(
        OLD.school_id,
        (SELECT school_id FROM students WHERE id = OLD.student_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSIF TG_TABLE_NAME = 'teacher_assignments' THEN
      v_school_id := COALESCE(
        OLD.school_id,
        (SELECT school_id FROM users WHERE id = OLD.teacher_id LIMIT 1),
        (SELECT school_id FROM users WHERE id = v_user_id)
      );
    ELSE
      BEGIN
        v_school_id := OLD.school_id;
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
    END IF;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (v_user_id, v_school_id, v_action_type, v_details, CURRENT_TIMESTAMP);

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event() IS 'Updated audit trigger function with better school_id handling for enrollments and teacher_assignments tables';

-- =====================================================
-- Verification queries (run these to check the migration)
-- =====================================================

-- Check if school_id was added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('enrollments', 'teacher_assignments') 
-- AND column_name = 'school_id';

-- Check if all enrollments have school_id
-- SELECT COUNT(*) as total_enrollments, 
--        COUNT(school_id) as with_school_id,
--        COUNT(*) - COUNT(school_id) as missing_school_id
-- FROM enrollments;

-- Check if all teacher_assignments have school_id
-- SELECT COUNT(*) as total_assignments, 
--        COUNT(school_id) as with_school_id,
--        COUNT(*) - COUNT(school_id) as missing_school_id
-- FROM teacher_assignments;
