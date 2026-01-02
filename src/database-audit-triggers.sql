-- =====================================================
-- COMPREHENSIVE AUDIT LOGGING SYSTEM
-- Automatically tracks all critical database changes
-- =====================================================

-- Helper function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Try to get user from auth.uid() (Supabase Auth)
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit logging function
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
    v_school_id := COALESCE(NEW.school_id, (SELECT school_id FROM users WHERE id = v_user_id));
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

-- =====================================================
-- APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- =====================================================

-- 1. SCHOOLS TABLE
DROP TRIGGER IF EXISTS audit_schools ON schools;
CREATE TRIGGER audit_schools
  AFTER INSERT OR UPDATE OR DELETE ON schools
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 2. USERS TABLE (track user creation, updates, role changes)
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 3. STUDENTS TABLE
DROP TRIGGER IF EXISTS audit_students ON students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 4. PAYMENTS TABLE (critical financial tracking)
DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 5. MARKS TABLE (academic integrity)
DROP TRIGGER IF EXISTS audit_marks ON marks;
CREATE TRIGGER audit_marks
  AFTER INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 6. ACADEMIC YEARS TABLE
DROP TRIGGER IF EXISTS audit_academic_years ON academic_years;
CREATE TRIGGER audit_academic_years
  AFTER INSERT OR UPDATE OR DELETE ON academic_years
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 7. TERMS TABLE
DROP TRIGGER IF EXISTS audit_terms ON terms;
CREATE TRIGGER audit_terms
  AFTER INSERT OR UPDATE OR DELETE ON terms
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 8. SEQUENCES TABLE
DROP TRIGGER IF EXISTS audit_sequences ON sequences;
CREATE TRIGGER audit_sequences
  AFTER INSERT OR UPDATE OR DELETE ON sequences
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 9. CLASSES TABLE
DROP TRIGGER IF EXISTS audit_classes ON classes;
CREATE TRIGGER audit_classes
  AFTER INSERT OR UPDATE OR DELETE ON classes
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 10. SUBJECTS TABLE
DROP TRIGGER IF EXISTS audit_subjects ON subjects;
CREATE TRIGGER audit_subjects
  AFTER INSERT OR UPDATE OR DELETE ON subjects
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 11. FEE STRUCTURES TABLE
DROP TRIGGER IF EXISTS audit_fee_structures ON fee_structures;
CREATE TRIGGER audit_fee_structures
  AFTER INSERT OR UPDATE OR DELETE ON fee_structures
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 12. ENROLLMENTS TABLE
DROP TRIGGER IF EXISTS audit_enrollments ON enrollments;
CREATE TRIGGER audit_enrollments
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 13. TEACHER ASSIGNMENTS TABLE
DROP TRIGGER IF EXISTS audit_teacher_assignments ON teacher_assignments;
CREATE TRIGGER audit_teacher_assignments
  AFTER INSERT OR UPDATE OR DELETE ON teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 14. GUARDIANS TABLE
DROP TRIGGER IF EXISTS audit_guardians ON guardians;
CREATE TRIGGER audit_guardians
  AFTER INSERT OR UPDATE OR DELETE ON guardians
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 15. REPORT CARDS TABLE
DROP TRIGGER IF EXISTS audit_report_cards ON report_cards;
CREATE TRIGGER audit_report_cards
  AFTER INSERT OR UPDATE OR DELETE ON report_cards
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 16. REPORT TEMPLATES TABLE
DROP TRIGGER IF EXISTS audit_report_templates ON report_templates;
CREATE TRIGGER audit_report_templates
  AFTER INSERT OR UPDATE OR DELETE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 17. EMAIL TEMPLATES TABLE (if exists)
DROP TRIGGER IF EXISTS audit_email_templates ON email_templates;
CREATE TRIGGER audit_email_templates
  AFTER INSERT OR UPDATE OR DELETE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 18. ANNOUNCEMENTS TABLE (if exists)
DROP TRIGGER IF EXISTS audit_announcements ON announcements;
CREATE TRIGGER audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- =====================================================
-- SPECIAL AUDIT FUNCTIONS FOR SPECIFIC EVENTS
-- =====================================================

-- Log authentication events
CREATE OR REPLACE FUNCTION log_user_login(p_user_id UUID, p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (
    p_user_id,
    p_school_id,
    'user_login',
    jsonb_build_object(
      'user_id', p_user_id,
      'timestamp', CURRENT_TIMESTAMP,
      'ip_address', inet_client_addr()
    ),
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log user logout
CREATE OR REPLACE FUNCTION log_user_logout(p_user_id UUID, p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (
    p_user_id,
    p_school_id,
    'user_logout',
    jsonb_build_object(
      'user_id', p_user_id,
      'timestamp', CURRENT_TIMESTAMP
    ),
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log bulk operations
CREATE OR REPLACE FUNCTION log_bulk_operation(
  p_user_id UUID,
  p_school_id UUID,
  p_operation_type VARCHAR(50),
  p_details JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (
    p_user_id,
    p_school_id,
    'bulk_' || p_operation_type,
    p_details,
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log report generation
CREATE OR REPLACE FUNCTION log_report_generation(
  p_user_id UUID,
  p_school_id UUID,
  p_report_type VARCHAR(50),
  p_details JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, school_id, action_type, details, timestamp)
  VALUES (
    p_user_id,
    p_school_id,
    'report_generated',
    jsonb_build_object(
      'report_type', p_report_type,
      'details', p_details,
      'timestamp', CURRENT_TIMESTAMP
    ),
    CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT LOG CLEANUP (Optional - for maintenance)
-- =====================================================

-- Function to archive old audit logs (older than 1 year)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- Create archive table if it doesn't exist
  CREATE TABLE IF NOT EXISTS audit_logs_archive (LIKE audit_logs INCLUDING ALL);
  
  -- Move old logs to archive
  WITH moved_logs AS (
    DELETE FROM audit_logs
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year'
    RETURNING *
  )
  INSERT INTO audit_logs_archive
  SELECT * FROM moved_logs;
  
  GET DIAGNOSTICS v_archived_count = ROW_COUNT;
  
  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Improve audit log query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_desc 
  ON audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school_timestamp 
  ON audit_logs(school_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
  ON audit_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type 
  ON audit_logs(action_type);

-- GIN index for JSONB details column (for searching within details)
CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin 
  ON audit_logs USING GIN (details);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION log_audit_event() IS 'Generic trigger function that logs all INSERT/UPDATE/DELETE operations to audit_logs table';
COMMENT ON FUNCTION log_user_login(UUID, UUID) IS 'Logs user login events';
COMMENT ON FUNCTION log_user_logout(UUID, UUID) IS 'Logs user logout events';
COMMENT ON FUNCTION log_bulk_operation(UUID, UUID, VARCHAR, JSONB) IS 'Logs bulk operations like bulk student imports';
COMMENT ON FUNCTION log_report_generation(UUID, UUID, VARCHAR, JSONB) IS 'Logs report generation events';
COMMENT ON FUNCTION archive_old_audit_logs() IS 'Archives audit logs older than 1 year to audit_logs_archive table';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- To manually log a custom event:
-- INSERT INTO audit_logs (user_id, school_id, action_type, details)
-- VALUES (
--   auth.uid(),
--   (SELECT school_id FROM users WHERE id = auth.uid()),
--   'custom_action',
--   '{"description": "Custom event description"}'::jsonb
-- );

-- To call bulk operation logging:
-- SELECT log_bulk_operation(
--   auth.uid(),
--   'school-uuid-here',
--   'student_import',
--   '{"count": 50, "source": "csv"}'::jsonb
-- );

-- To archive old logs (run periodically):
-- SELECT archive_old_audit_logs();
