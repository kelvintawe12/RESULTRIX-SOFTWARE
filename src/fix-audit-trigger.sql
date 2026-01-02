
-- Fix the ambiguous "key" reference in the audit trigger
-- This resolves the error: column reference "key" is ambiguous

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_school_id UUID;
  v_action_type VARCHAR(50);
  v_details JSONB;
  v_changed_fields JSONB;
BEGIN
  -- Get current user
  v_user_id := get_current_user_id();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action_type := TG_TABLE_NAME || '_created';
    v_details := to_jsonb(NEW);
    v_school_id := COALESCE(NEW.school_id, (SELECT school_id FROM users WHERE id = v_user_id));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := TG_TABLE_NAME || '_updated';
    
    -- Build changed fields object with explicit column references
    SELECT jsonb_object_agg(changed.key, changed.value)
    INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW)) AS changed
    WHERE to_jsonb(NEW)->>changed.key IS DISTINCT FROM to_jsonb(OLD)->>changed.key;
    
    v_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', v_changed_fields
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

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all triggers to use the fixed function
-- (The triggers will automatically use the new function definition)

COMMENT ON FUNCTION log_audit_event() IS 'Fixed: Generic trigger function that logs all INSERT/UPDATE/DELETE operations to audit_logs table without ambiguous column references';
