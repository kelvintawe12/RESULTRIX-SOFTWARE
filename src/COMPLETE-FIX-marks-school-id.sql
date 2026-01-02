
-- COMPLETE FIX for marks entry issues
-- This file contains all necessary fixes for the marks table

-- =====================================================
-- FIX 1: Auto-fill school_id trigger (secure & automatic)
-- =====================================================

CREATE OR REPLACE FUNCTION auto_fill_marks_school_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Derive school_id from enrollment → student
  SELECT s.school_id INTO NEW.school_id
  FROM enrollments e
  JOIN students s ON e.student_id = s.id
  WHERE e.id = NEW.enrollment_id;
  
  -- Fallback to submitted_by's school (safety)
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id
    FROM users
    WHERE id = NEW.submitted_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_auto_fill_marks_school_id ON marks;

-- Create the trigger
CREATE TRIGGER trg_auto_fill_marks_school_id
  BEFORE INSERT ON marks
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_marks_school_id();

COMMENT ON FUNCTION auto_fill_marks_school_id() IS 'Automatically fills school_id from enrollment->student relationship';
COMMENT ON TRIGGER trg_auto_fill_marks_school_id ON marks IS 'Auto-fills school_id before insert - no need to send from frontend';

-- =====================================================
-- FIX 2: Fixed audit trigger (no more ambiguous "key" error)
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID := get_current_user_id();
  v_school_id UUID;
  v_action_type VARCHAR(50);
  v_details JSONB;
  v_changed_fields JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action_type := TG_TABLE_NAME || '_created';
    v_details := to_jsonb(NEW);
    v_school_id := COALESCE(NEW.school_id, (SELECT school_id FROM users WHERE id = v_user_id));
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := TG_TABLE_NAME || '_updated';
    
    -- Fixed: Use explicit alias to avoid ambiguous "key" reference
    SELECT jsonb_object_agg(k.key, k.value)
    INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW)) k
    WHERE to_jsonb(NEW)->>k.key IS DISTINCT FROM to_jsonb(OLD)->>k.key;
    
    v_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', COALESCE(v_changed_fields, '{}'::jsonb)
    );
    v_school_id := COALESCE(NEW.school_id, OLD.school_id, (SELECT school_id FROM users WHERE id = v_user_id));
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := TG_TABLE_NAME || '_deleted';
    v_details := to_jsonb(OLD);
    v_school_id := COALESCE(OLD.school_id, (SELECT school_id FROM users WHERE id = v_user_id));
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (v_user_id, v_school_id, v_action_type, v_details, CURRENT_TIMESTAMP);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event() IS 'Fixed audit function - no more ambiguous key error';

-- =====================================================
-- FIX 3: Re-enable audit trigger on marks table
-- =====================================================

DROP TRIGGER IF EXISTS audit_marks ON marks;

CREATE TRIGGER audit_marks
  AFTER INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

COMMENT ON TRIGGER audit_marks ON marks IS 'Audit trigger with fixed function - tracks all mark changes';

-- =====================================================
-- Verification
-- =====================================================

-- Check that triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'marks'
ORDER BY trigger_name;

-- Test insert (should work without school_id in payload)
-- INSERT INTO marks (enrollment_id, sequence_id, score, out_of, submitted_by, approved)
-- VALUES ('some-enrollment-id', 'some-sequence-id', 15, 20, 'some-user-id', false);
-- SELECT school_id FROM marks WHERE id = (SELECT id FROM marks ORDER BY created_at DESC LIMIT 1);
-- Should show school_id was auto-filled!
