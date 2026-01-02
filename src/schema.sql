-- Full Ready-to-Use PostgreSQL Schema for School Management SaaS Platform

-- Step 1: Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'bursar', 'teacher');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE grading_scale_type AS ENUM ('out_of_20', 'percentage', 'gpa_4_0', 'gpa_5_0', 'custom');
CREATE TYPE subject_type AS ENUM ('core', 'elective');
CREATE TYPE payment_method_type AS ENUM ('cash', 'bank_transfer', 'credit_card', 'mobile_money', 'other');
CREATE TYPE report_scope_type AS ENUM ('sequence', 'term', 'year');

COMMENT ON TYPE user_role IS 'Defines user roles in the system hierarchy.';
COMMENT ON TYPE gender_type IS 'Gender options for student profiles.';
COMMENT ON TYPE grading_scale_type IS 'Supported grading scales for averages.';
COMMENT ON TYPE subject_type IS 'Categorizes subjects as core or elective.';
COMMENT ON TYPE payment_method_type IS 'Methods for recording fee payments.';
COMMENT ON TYPE report_scope_type IS 'Scopes for generating report cards.';

-- Step 3: Tables

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    logo_path VARCHAR(255),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency_code ~ '^[A-Z]{3}$'),
    grading_scale grading_scale_type NOT NULL DEFAULT 'percentage',
    default_exam_out_of INTEGER NOT NULL DEFAULT 100 CHECK (default_exam_out_of > 0),
    gpa_mapping JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE schools IS 'Core table for multi-tenant schools, storing configurations like currency and grading.';
COMMENT ON COLUMN schools.currency_code IS 'ISO 4217 currency code for all financial calculations in this school.';
COMMENT ON COLUMN schools.gpa_mapping IS 'JSONB object for custom GPA percentage-to-grade mappings (if grading_scale is gpa_4_0, gpa_5_0, or custom).';

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Users across all roles; school_id is NULL for super admins.';
COMMENT ON COLUMN users.school_id IS 'Links to school for non-super admins; enforces multi-tenancy.';

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date > start_date),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE academic_years IS 'Academic years per school; students are tied to these.';

-- Ensure only one academic year is current per school
CREATE UNIQUE INDEX idx_academic_years_current_school
ON academic_years (school_id) WHERE is_current = TRUE;

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date > start_date),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE terms IS 'Terms within an academic year; can have multiple sequences.';

CREATE UNIQUE INDEX idx_terms_current_year
ON terms (academic_year_id) WHERE is_current = TRUE;

CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    due_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sequences IS 'Sequences per term; marks and attendance are submitted here.';

CREATE UNIQUE INDEX idx_sequences_current_term
ON sequences (term_id) WHERE is_current = TRUE;

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE classes IS 'Persistent classes; reused across years.';

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency_code CHAR(3) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fee_structures IS 'Fee setups per class; used to initialize student fees.';

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    profile_photo_path VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    nationality VARCHAR(100),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    previous_school VARCHAR(255),
    admission_number VARCHAR(50),
    total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    remaining NUMERIC(10, 2) NOT NULL DEFAULT 0,
    medical_conditions TEXT,
    allergies TEXT,
    special_needs TEXT,
    blood_type VARCHAR(5),
    custom_fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE students IS 'Year-specific student records; archived at year-end.';
COMMENT ON COLUMN students.custom_fields IS 'JSONB for optional school-specific data.';

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    occupation VARCHAR(100),
    id_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE guardians IS 'Guardians per student; at least one required.';

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    method payment_method_type NOT NULL DEFAULT 'cash',
    notes TEXT,
    receipt_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payments IS 'Individual payments; triggers update student balances.';

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    coefficient NUMERIC(3, 1) NOT NULL DEFAULT 1.0 CHECK (coefficient > 0),
    subject_type subject_type DEFAULT 'core',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subjects IS 'Subjects; coefficients for weighting grades.';

CREATE TABLE subject_class_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (subject_id, class_id)
);

COMMENT ON TABLE subject_class_mappings IS 'Maps subjects to classes for availability.';

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, subject_id)
);

COMMENT ON TABLE enrollments IS 'Student-subject enrollments; supports specializations.';
COMMENT ON COLUMN enrollments.school_id IS 'Links enrollment to school for multi-tenancy and audit logging';

CREATE TABLE teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (teacher_id, subject_id, class_id)
);

COMMENT ON TABLE teacher_assignments IS 'Assigns teachers to specific subjects and classes.';
COMMENT ON COLUMN teacher_assignments.school_id IS 'Links teacher assignment to school for multi-tenancy and audit logging';

CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0),
    out_of INTEGER NOT NULL CHECK (out_of > 0),
    attendance_present INTEGER NOT NULL DEFAULT 0 CHECK (attendance_present >= 0),
    attendance_total INTEGER NOT NULL DEFAULT 0 CHECK (attendance_total >= attendance_present),
    comments TEXT,
    submitted_by UUID NOT NULL REFERENCES users(id),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE marks IS 'Marks per enrollment and sequence; includes attendance.';

CREATE TABLE class_averages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    average_score NUMERIC(5, 2) NOT NULL,
    total_students INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE class_averages IS 'Pre-computed averages per class/subject/sequence; updated via triggers.';

CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE report_templates IS 'JSONB configs for customizable report card templates.';

CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scope report_scope_type NOT NULL,
    sequence_id UUID REFERENCES sequences(id),
    term_id UUID REFERENCES terms(id),
    academic_year_id UUID REFERENCES academic_years(id),
    data JSONB NOT NULL,
    pdf_path VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE report_cards IS 'Stored generated reports with computed data.';

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    school_id UUID REFERENCES schools(id),
    action_type VARCHAR(50) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Logs all changes for security and compliance.';

-- Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    pinned_until TIMESTAMP WITH TIME ZONE,
    posted_by UUID NOT NULL REFERENCES users(id),
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    views_count INTEGER DEFAULT 0
);

COMMENT ON TABLE announcements IS 'School-wide, class-specific, or platform-wide announcements. NULL school_id = platform-wide (super admin only).';
COMMENT ON COLUMN announcements.school_id IS 'NULL = platform-wide announcement (super admin); UUID = school-specific announcement.';
COMMENT ON COLUMN announcements.class_id IS 'NULL = school-wide announcement; specific UUID = visible only to that class''s teachers and students.';
COMMENT ON COLUMN announcements.is_pinned IS 'Pinned announcements appear at the top.';

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    body_html_template TEXT NOT NULL,
    body_text_template TEXT,
    category VARCHAR(50),
    is_system_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, name)
);

COMMENT ON TABLE email_templates IS 'Reusable email templates with merge tags like {{student_name}}, {{due_amount}}';

-- Email Queue
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    context JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened', 'clicked')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    provider_message_id VARCHAR(255),
    opens_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE email_queue IS 'Background email sending queue. Processed by worker (Edge Function).';

-- Email Logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_queue_id UUID NOT NULL REFERENCES email_queue(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communication Preferences
CREATE TABLE communication_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    preferred_channels VARCHAR(50)[] DEFAULT '{email}',
    CONSTRAINT one_target CHECK (
        (user_id IS NOT NULL AND guardian_id IS NULL) OR
        (user_id IS NULL AND guardian_id IS NOT NULL)
    )
);

COMMENT ON TABLE communication_preferences IS 'Let parents/teachers opt in/out of email/SMS types.';

-- Step 4: Indexes

CREATE INDEX idx_schools_approved ON schools(approved);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_school ON users(role, school_id);
CREATE INDEX idx_academic_years_school_dates ON academic_years(school_id, start_date, end_date);
CREATE INDEX idx_terms_academic_year ON terms(academic_year_id);
CREATE INDEX idx_sequences_term ON sequences(term_id);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_fee_structures_class ON fee_structures(class_id);
CREATE INDEX idx_students_school_year_class ON students(school_id, academic_year_id, class_id);
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_guardians_student ON guardians(student_id);
CREATE INDEX idx_payments_student_date ON payments(student_id, date DESC);
CREATE INDEX idx_subjects_school ON subjects(school_id);
CREATE INDEX idx_subject_class_mappings_subject ON subject_class_mappings(subject_id);
CREATE INDEX idx_subject_class_mappings_class ON subject_class_mappings(class_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_subject ON enrollments(subject_id);
CREATE INDEX idx_enrollments_school_id ON enrollments(school_id);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject_class ON teacher_assignments(subject_id, class_id);
CREATE INDEX idx_teacher_assignments_school_id ON teacher_assignments(school_id);
CREATE INDEX idx_marks_enrollment_sequence ON marks(enrollment_id, sequence_id);
CREATE INDEX idx_marks_approved ON marks(approved);
CREATE INDEX idx_class_averages_class_subject_sequence ON class_averages(class_id, subject_id, sequence_id);
CREATE INDEX idx_report_templates_school ON report_templates(school_id);
CREATE INDEX idx_report_cards_student_scope ON report_cards(student_id, scope);
CREATE INDEX idx_audit_logs_user_school_timestamp ON audit_logs(user_id, school_id, timestamp DESC);
CREATE INDEX idx_announcements_school_posted ON announcements(school_id, posted_at DESC);
CREATE INDEX idx_announcements_class ON announcements(class_id, posted_at DESC);
CREATE INDEX idx_announcements_pinned ON announcements(school_id, is_pinned DESC, pinned_until DESC) WHERE is_pinned = TRUE;
CREATE INDEX idx_email_queue_status_school ON email_queue(status, school_id);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_email_logs_queue_event ON email_logs(email_queue_id, event_type);

-- Step 5: Triggers and Functions

-- Function and Trigger for Fee Updates
CREATE OR REPLACE FUNCTION update_student_fees()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students
    SET total_paid = total_paid + NEW.amount,
        remaining = total_fee - (total_paid + NEW.amount)
    WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fees
AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION update_student_fees();

COMMENT ON FUNCTION update_student_fees IS 'Automatically updates student fee balances on new payments.';

-- Current Academic Year/Term/Sequence Functions
CREATE OR REPLACE FUNCTION set_current_academic_year(p_year_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE academic_years
    SET is_current = FALSE
    WHERE school_id = (SELECT school_id FROM academic_years WHERE id = p_year_id)
      AND id != p_year_id;

    UPDATE academic_years
    SET is_current = TRUE
    WHERE id = p_year_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_current_term(p_term_id UUID)
RETURNS VOID AS $$
DECLARE
    v_year_id UUID;
BEGIN
    SELECT academic_year_id INTO v_year_id FROM terms WHERE id = p_term_id;

    UPDATE terms
    SET is_current = FALSE
    WHERE academic_year_id = v_year_id
      AND id != p_term_id;

    UPDATE terms
    SET is_current = TRUE
    WHERE id = p_term_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_current_sequence(p_sequence_id UUID)
RETURNS VOID AS $$
DECLARE
    v_term_id UUID;
BEGIN
    SELECT term_id INTO v_term_id FROM sequences WHERE id = p_sequence_id;

    UPDATE sequences
    SET is_current = FALSE
    WHERE term_id = v_term_id
      AND id != p_sequence_id;

    UPDATE sequences
    SET is_current = TRUE
    WHERE id = p_sequence_id;
END;
$$ LANGUAGE plpgsql;

-- Views for Current Academic Periods
CREATE OR REPLACE VIEW v_current_academic_year AS
SELECT ay.*
FROM academic_years ay
WHERE ay.is_current = TRUE;

CREATE OR REPLACE VIEW v_current_term AS
SELECT t.*
FROM terms t
JOIN v_current_academic_year cay ON t.academic_year_id = cay.id
WHERE t.is_current = TRUE;

CREATE OR REPLACE VIEW v_current_sequence AS
SELECT s.*
FROM sequences s
JOIN v_current_term ct ON s.term_id = ct.id
WHERE s.is_current = TRUE;