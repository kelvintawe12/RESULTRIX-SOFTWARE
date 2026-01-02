
-- =====================================================
-- Migration: Create missing tables for teacher functionality
-- Purpose: Add attendance table and fix enrollment references
-- =====================================================

-- =====================================================
-- Create attendance table
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES users(id),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, class_id, subject_id, date)
);

COMMENT ON TABLE attendance IS 'Student attendance records';
COMMENT ON COLUMN attendance.status IS 'Attendance status: present, absent, late, or excused';
COMMENT ON COLUMN attendance.marked_by IS 'Teacher who marked the attendance';

-- Create indexes for attendance
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_school ON attendance(school_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- =====================================================
-- Add status column to teacher_assignments if not exists
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_assignments' AND column_name = 'status'
  ) THEN
    ALTER TABLE teacher_assignments
    ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked'));
    
    ALTER TABLE teacher_assignments
    ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN revoked_by UUID REFERENCES users(id),
    ADD COLUMN revocation_reason TEXT;
    
    CREATE INDEX idx_teacher_assignments_status ON teacher_assignments(status);
    
    COMMENT ON COLUMN teacher_assignments.status IS 'Assignment status: active or revoked';
  END IF;
END $$;

-- =====================================================
-- Enable RLS on attendance table
-- =====================================================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: School admins can manage all attendance in their school
CREATE POLICY attendance_school_admin_all ON attendance
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

-- Policy: Teachers can manage attendance for their assigned classes
CREATE POLICY attendance_teacher_manage ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = auth.uid()
        AND ta.class_id = attendance.class_id
        AND ta.subject_id = attendance.subject_id
        AND ta.status = 'active'
    )
  );

-- Policy: Bursars can view attendance
CREATE POLICY attendance_bursar_view ON attendance
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'bursar'
    )
  );

-- =====================================================
-- Create updated_at trigger for attendance
-- =====================================================

CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- =====================================================
-- Verification queries
-- =====================================================

-- Check if attendance table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'attendance'
-- );

-- Check if status column exists in teacher_assignments
-- SELECT EXISTS (
--   SELECT FROM information_schema.columns 
--   WHERE table_name = 'teacher_assignments' AND column_name = 'status'
-- );

-- Check attendance table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'attendance'
-- ORDER BY ordinal_position;
