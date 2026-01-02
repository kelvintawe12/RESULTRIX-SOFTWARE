
-- CLEAN IMPLEMENTATION: Drop old functions and create new ones
-- Run this to fix the "function name not unique" error

-- 1. Drop any existing compute_student_report functions
DROP FUNCTION IF EXISTS compute_student_report(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS compute_student_report(UUID, UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_class_reports(UUID, UUID, UUID, UUID) CASCADE;

-- 2. Create the main report generation function
CREATE OR REPLACE FUNCTION compute_student_report(
    p_student_id UUID,
    p_sequence_id UUID DEFAULT NULL,
    p_term_id UUID DEFAULT NULL,
    p_academic_year_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_report_id UUID;
    v_scope report_scope_type;
    v_student_record RECORD;
    v_class_id UUID;
    v_school_id UUID;
    v_subjects JSONB;
    v_final_average NUMERIC(5, 2);
    v_rank INTEGER;
    v_class_size INTEGER;
    v_attendance_percentage NUMERIC(5, 2);
    v_letter_grade VARCHAR(2);
    v_total_score NUMERIC(10, 2);
    v_total_out_of NUMERIC(10, 2);
    v_total_attendance_present INTEGER;
    v_total_attendance_total INTEGER;
BEGIN
    -- Determine scope
    IF p_sequence_id IS NOT NULL THEN
        v_scope := 'sequence';
    ELSIF p_term_id IS NOT NULL THEN
        v_scope := 'term';
    ELSIF p_academic_year_id IS NOT NULL THEN
        v_scope := 'year';
    ELSE
        RAISE EXCEPTION 'Must provide sequence_id, term_id, or academic_year_id';
    END IF;

    -- Get student info
    SELECT s.*, s.class_id, s.school_id
    INTO v_student_record
    FROM students s
    WHERE s.id = p_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    v_class_id := v_student_record.class_id;
    v_school_id := v_student_record.school_id;

    -- Build subjects array with marks
    SELECT jsonb_agg(
        jsonb_build_object(
            'subject_id', sub.id,
            'name', sub.name,
            'coefficient', sub.coefficient,
            'score', COALESCE(marks_agg.total_score, 0),
            'out_of', COALESCE(marks_agg.total_out_of, 0),
            'percentage', CASE 
                WHEN COALESCE(marks_agg.total_out_of, 0) > 0 
                THEN (COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100
                ELSE 0
            END,
            'comments', marks_agg.latest_comment,
            'attendance_present', COALESCE(marks_agg.attendance_present, 0),
            'attendance_total', COALESCE(marks_agg.attendance_total, 0)
        )
        ORDER BY sub.name
    )
    INTO v_subjects
    FROM enrollments e
    JOIN subjects sub ON e.subject_id = sub.id
    LEFT JOIN LATERAL (
        SELECT 
            SUM(m.score) as total_score,
            SUM(m.out_of) as total_out_of,
            SUM(m.attendance_present) as attendance_present,
            SUM(m.attendance_total) as attendance_total,
            (ARRAY_AGG(m.comments ORDER BY m.created_at DESC))[1] as latest_comment
        FROM marks m
        WHERE m.enrollment_id = e.id
            AND (
                (v_scope = 'sequence' AND m.sequence_id = p_sequence_id) OR
                (v_scope = 'term' AND m.sequence_id IN (
                    SELECT id FROM sequences WHERE term_id = p_term_id
                )) OR
                (v_scope = 'year' AND m.sequence_id IN (
                    SELECT s.id FROM sequences s
                    JOIN terms t ON s.term_id = t.id
                    WHERE t.academic_year_id = p_academic_year_id
                ))
            )
    ) marks_agg ON true
    WHERE e.student_id = p_student_id;

    -- Calculate weighted average
    SELECT 
        SUM(
            CASE 
                WHEN (subj->>'out_of')::NUMERIC > 0 
                THEN ((subj->>'score')::NUMERIC / (subj->>'out_of')::NUMERIC) * 100 * (subj->>'coefficient')::NUMERIC
                ELSE 0
            END
        ) / NULLIF(SUM((subj->>'coefficient')::NUMERIC), 0),
        SUM((subj->>'score')::NUMERIC),
        SUM((subj->>'out_of')::NUMERIC),
        SUM((subj->>'attendance_present')::INTEGER),
        SUM((subj->>'attendance_total')::INTEGER)
    INTO v_final_average, v_total_score, v_total_out_of, v_total_attendance_present, v_total_attendance_total
    FROM jsonb_array_elements(v_subjects) subj;

    -- Calculate attendance percentage
    IF v_total_attendance_total > 0 THEN
        v_attendance_percentage := (v_total_attendance_present::NUMERIC / v_total_attendance_total) * 100;
    ELSE
        v_attendance_percentage := 0;
    END IF;

    -- Determine letter grade
    IF v_final_average >= 90 THEN
        v_letter_grade := 'A';
    ELSIF v_final_average >= 80 THEN
        v_letter_grade := 'B';
    ELSIF v_final_average >= 70 THEN
        v_letter_grade := 'C';
    ELSIF v_final_average >= 60 THEN
        v_letter_grade := 'D';
    ELSE
        v_letter_grade := 'F';
    END IF;

    -- Calculate rank within class
    WITH class_averages AS (
        SELECT 
            s.id as student_id,
            SUM(
                CASE 
                    WHEN marks_data.total_out_of > 0 
                    THEN (marks_data.total_score / marks_data.total_out_of) * 100 * sub.coefficient
                    ELSE 0
                END
            ) / NULLIF(SUM(sub.coefficient), 0) as weighted_avg
        FROM students s
        JOIN enrollments e ON e.student_id = s.id
        JOIN subjects sub ON e.subject_id = sub.id
        LEFT JOIN LATERAL (
            SELECT 
                SUM(m.score) as total_score,
                SUM(m.out_of) as total_out_of
            FROM marks m
            WHERE m.enrollment_id = e.id
                AND (
                    (v_scope = 'sequence' AND m.sequence_id = p_sequence_id) OR
                    (v_scope = 'term' AND m.sequence_id IN (
                        SELECT id FROM sequences WHERE term_id = p_term_id
                    )) OR
                    (v_scope = 'year' AND m.sequence_id IN (
                        SELECT seq.id FROM sequences seq
                        JOIN terms t ON seq.term_id = t.id
                        WHERE t.academic_year_id = p_academic_year_id
                    ))
                )
        ) marks_data ON true
        WHERE s.class_id = v_class_id
        GROUP BY s.id
    ),
    ranked AS (
        SELECT 
            student_id,
            weighted_avg,
            RANK() OVER (ORDER BY weighted_avg DESC) as rank
        FROM class_averages
        WHERE weighted_avg IS NOT NULL
    )
    SELECT rank, COUNT(*) OVER ()
    INTO v_rank, v_class_size
    FROM ranked
    WHERE student_id = p_student_id;

    -- Delete existing report if any
    DELETE FROM report_cards
    WHERE student_id = p_student_id
        AND scope = v_scope
        AND (
            (v_scope = 'sequence' AND sequence_id = p_sequence_id) OR
            (v_scope = 'term' AND term_id = p_term_id) OR
            (v_scope = 'year' AND academic_year_id = p_academic_year_id)
        );

    -- Insert new report card
    INSERT INTO report_cards (
        student_id,
        scope,
        sequence_id,
        term_id,
        academic_year_id,
        data
    )
    VALUES (
        p_student_id,
        v_scope,
        p_sequence_id,
        p_term_id,
        p_academic_year_id,
        jsonb_build_object(
            'subjects', v_subjects,
            'final_average', v_final_average,
            'total_score', v_total_score,
            'total_out_of', v_total_out_of,
            'rank', v_rank,
            'class_size', v_class_size,
            'attendance_percentage', v_attendance_percentage,
            'attendance_present', v_total_attendance_present,
            'attendance_total', v_total_attendance_total,
            'letter_grade', v_letter_grade,
            'student_name', v_student_record.full_name,
            'admission_number', v_student_record.admission_number,
            'class_id', v_class_id,
            'generated_at', NOW()
        )
    )
    RETURNING id INTO v_report_id;

    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_student_report IS 'Generates a complete report card for a student for a given scope (sequence/term/year)';

-- 3. Bulk generation helper function
CREATE OR REPLACE FUNCTION generate_class_reports(
    p_class_id UUID,
    p_sequence_id UUID DEFAULT NULL,
    p_term_id UUID DEFAULT NULL,
    p_academic_year_id UUID DEFAULT NULL
)
RETURNS TABLE(student_id UUID, report_id UUID, success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_student RECORD;
BEGIN
    FOR v_student IN 
        SELECT id FROM students WHERE class_id = p_class_id ORDER BY full_name
    LOOP
        BEGIN
            RETURN QUERY SELECT 
                v_student.id,
                compute_student_report(v_student.id, p_sequence_id, p_term_id, p_academic_year_id),
                true,
                NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                v_student.id,
                NULL::UUID,
                false,
                SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_class_reports IS 'Bulk generates report cards for all students in a class';

-- 4. Verify the functions were created
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname IN ('compute_student_report', 'generate_class_reports')
ORDER BY p.proname, p.oid;
