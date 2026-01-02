
-- Fix audit trigger with proper error handling
-- This ensures audit logging failures never block critical operations

-- Drop existing function
DROP FUNCTION IF EXISTS log_audit_event() CASCADE;

-- Create improved audit function with error handling
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_school_id UUID;
  v_action_type VARCHAR(50);
  v_details JSONB;
  v_changed_fields JSONB;
BEGIN
  -- Wrap everything in exception handler so errors don't block operations
  BEGIN
    -- Get current user
    v_user_id := get_current_user_id();
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
      v_action_type := TG_TABLE_NAME || '_created';
      v_details := to_jsonb(NEW);
      
      -- Try to get school_id from NEW record
      BEGIN
        v_school_id := NEW.school_id;
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
      
    ELSIF TG_OP = 'UPDATE' THEN
      v_action_type := TG_TABLE_NAME || '_updated';
      
      -- Build changed fields safely
      BEGIN
        SELECT jsonb_object_agg(field_key, field_value)
        INTO v_changed_fields
        FROM (
          SELECT key AS field_key, value AS field_value
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key
        ) AS changed_data;
      EXCEPTION
        WHEN OTHERS THEN
          v_changed_fields := NULL;
      END;
      
      v_details := jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'changed_fields', v_changed_fields
      );
      
      -- Try to get school_id from NEW/OLD record
      BEGIN
        v_school_id := COALESCE(NEW.school_id, OLD.school_id);
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
      
    ELSIF TG_OP = 'DELETE' THEN
      v_action_type := TG_TABLE_NAME || '_deleted';
      v_details := to_jsonb(OLD);
      
      -- Try to get school_id from OLD record
      BEGIN
        v_school_id := OLD.school_id;
      EXCEPTION
        WHEN undefined_column THEN
          v_school_id := (SELECT school_id FROM users WHERE id = v_user_id);
      END;
    END IF;

    -- Insert audit log (wrapped in its own exception handler)
    BEGIN
      INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
      VALUES (v_user_id, v_school_id, v_action_type, v_details, CURRENT_TIMESTAMP);
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the operation
        RAISE WARNING 'Audit log insert failed for % on %: %', TG_OP, TG_TABLE_NAME, SQLERRM;
    END;

  EXCEPTION
    WHEN OTHERS THEN
      -- If anything fails in audit logging, log warning but don't block the operation
      RAISE WARNING 'Audit logging failed for % on %: %', TG_OP, TG_TABLE_NAME, SQLERRM;
  END;

  -- Always return the appropriate record so the operation succeeds
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event() IS 'Audit trigger with comprehensive error handling - never blocks operations';

-- Recreate all audit triggers with the fixed function
-- The triggers will automatically use the new error-safe function

-- Re-enable audit trigger on marks table
DROP TRIGGER IF EXISTS audit_marks ON marks;
CREATE TRIGGER audit_marks
  AFTER INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

COMMENT ON TRIGGER audit_marks ON marks IS 'Audit trigger with error handling - will not block mark entry';
