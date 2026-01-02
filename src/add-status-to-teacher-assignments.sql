
-- =====================================================
-- Migration: Add status field to teacher_assignments
-- Purpose: Track active/revoked assignments
-- =====================================================

-- Add status column to teacher_assignments
ALTER TABLE teacher_assignments
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked'));

COMMENT ON COLUMN teacher_assignments.status IS 'Assignment status: active or revoked';

-- Add revoked_at and revoked_by columns for audit trail
ALTER TABLE teacher_assignments
ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN revoked_by UUID REFERENCES users(id),
ADD COLUMN revocation_reason TEXT;

COMMENT ON COLUMN teacher_assignments.revoked_at IS 'Timestamp when assignment was revoked';
COMMENT ON COLUMN teacher_assignments.revoked_by IS 'User who revoked the assignment';
COMMENT ON COLUMN teacher_assignments.revocation_reason IS 'Reason for revoking the assignment';

-- Create index for status queries
CREATE INDEX idx_teacher_assignments_status ON teacher_assignments(status);
CREATE INDEX idx_teacher_assignments_revoked_at ON teacher_assignments(revoked_at) WHERE revoked_at IS NOT NULL;

-- Update existing records to have 'active' status
UPDATE teacher_assignments
SET status = 'active'
WHERE status IS NULL;

-- =====================================================
-- Helper function to revoke an assignment
-- =====================================================

CREATE OR REPLACE FUNCTION revoke_teacher_assignment(
  p_assignment_id UUID,
  p_revoked_by UUID,
  p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE teacher_assignments
  SET 
    status = 'revoked',
    revoked_at = CURRENT_TIMESTAMP,
    revoked_by = p_revoked_by,
    revocation_reason = p_reason
  WHERE id = p_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_teacher_assignment IS 'Revokes a teacher assignment with audit trail';

-- =====================================================
-- Helper function to restore a revoked assignment
-- =====================================================

CREATE OR REPLACE FUNCTION restore_teacher_assignment(
  p_assignment_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE teacher_assignments
  SET 
    status = 'active',
    revoked_at = NULL,
    revoked_by = NULL,
    revocation_reason = NULL
  WHERE id = p_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_teacher_assignment IS 'Restores a revoked teacher assignment';

-- =====================================================
-- Verification queries
-- =====================================================

-- Check status distribution
-- SELECT status, COUNT(*) as count
-- FROM teacher_assignments
-- GROUP BY status;

-- Check revoked assignments
-- SELECT ta.*, 
--        u.full_name as revoked_by_name,
--        t.full_name as teacher_name,
--        s.name as subject_name,
--        c.name as class_name
-- FROM teacher_assignments ta
-- LEFT JOIN users u ON ta.revoked_by = u.id
-- LEFT JOIN users t ON ta.teacher_id = t.id
-- LEFT JOIN subjects s ON ta.subject_id = s.id
-- LEFT JOIN classes c ON ta.class_id = c.id
-- WHERE ta.status = 'revoked'
-- ORDER BY ta.revoked_at DESC;
