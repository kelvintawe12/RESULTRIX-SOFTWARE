-- ENHANCED REPORT GENERATION WITH COMPLETE SCHOOL AND STUDENT DATA
-- This version includes all necessary information for a professional report card

-- Drop existing function
DROP FUNCTION IF EXISTS compute_student_report(UUID, UUID, UUID, UUID) CASCADE;

-- Create enhanced report generation function
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
    v_class_record RECORD;
    v_school_record RECORD;
    v_period_record RECORD;
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
    v_weighted_total NUMERIC(10, 2);
    v_coefficient_sum NUMERIC(10, 2);
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

    -- Get complete student information
    SELECT 
        s.id,
        s.full_name,
        s.admission_number,
        s.class_id,
        s.school_id,
        s.date_of_birth,
        s.gender,
        s.profile_photo_path,
        s.email,
        s.phone,
        s.address
    INTO v_student_record
    FROM students s
    WHERE s.id = p_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    -- Get class information
    SELECT 
        c.id,
        c.name,
        c.description
    INTO v_class_record
    FROM classes c
    WHERE c.id = v_student_record.class_id;

    -- Get school information
    SELECT 
        sc.id,
        sc.name,
        sc.address,
        sc.logo_path
    INTO v_school_record
    FROM schools sc
    WHERE sc.id = v_student_record.school_id;

    -- Get period information and populate missing IDs
    IF v_scope = 'sequence' THEN
        SELECT 
            seq.id,
            seq.name,
            seq.due_date,
            t.start_date,
            t.end_date,
            seq.term_id,
            t.academic_year_id,
            t.name as term_name,
            t.start_date as term_start,
            t.end_date as term_end,
            ay.year_name as year_name,
            ay.start_date as year_start,
            ay.end_date as year_end
        INTO v_period_record
        FROM sequences seq
        JOIN terms t ON seq.term_id = t.id
        JOIN academic_years ay ON t.academic_year_id = ay.id
        WHERE seq.id = p_sequence_id;
        
        -- Populate term_id and academic_year_id from sequence
        IF v_period_record.term_id IS NOT NULL THEN
            p_term_id := v_period_record.term_id;
        END IF;
        IF v_period_record.academic_year_id IS NOT NULL THEN
            p_academic_year_id := v_period_record.academic_year_id;
        END IF;
    ELSIF v_scope = 'term' THEN
        SELECT 
            t.id,
            t.name,
            NULL::date as due_date,
            t.start_date,
            t.end_date,
            t.id as term_id,
            t.academic_year_id,
            t.name as term_name,
            t.start_date as term_start,
            t.end_date as term_end,
            ay.year_name as year_name,
            ay.start_date as year_start,
            ay.end_date as year_end
        INTO v_period_record
        FROM terms t
        JOIN academic_years ay ON t.academic_year_id = ay.id
        WHERE t.id = p_term_id;
        
        -- Populate academic_year_id from term
        IF v_period_record.academic_year_id IS NOT NULL THEN
            p_academic_year_id := v_period_record.academic_year_id;
        END IF;
    ELSE
        SELECT 
            ay.id,
            ay.year_name as name,
            NULL::date as due_date,
            ay.start_date,
            ay.end_date,
            NULL::uuid as term_id,
            ay.id as academic_year_id,
            NULL::text as term_name,
            NULL::date as term_start,
            NULL::date as term_end,
            ay.year_name as year_name,
            ay.start_date as year_start,
            ay.end_date as year_end
        INTO v_period_record
        FROM academic_years ay
        WHERE ay.id = p_academic_year_id;
    END IF;

    -- Build subjects array with complete marks data
    SELECT jsonb_agg(
        jsonb_build_object(
            'subject_id', sub.id,
            'name', sub.name,
            'coefficient', sub.coefficient,
            'subject_type', sub.subject_type,
            'score', COALESCE(marks_agg.total_score, 0),
            'out_of', COALESCE(marks_agg.total_out_of, 0),
            'percentage', CASE 
                WHEN COALESCE(marks_agg.total_out_of, 0) > 0 
                THEN ROUND((COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100, 2)
                ELSE 0
            END,
            'weighted_score', CASE 
                WHEN COALESCE(marks_agg.total_out_of, 0) > 0 
                THEN ROUND(((COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100 * sub.coefficient), 2)
                ELSE 0
            END,
            'grade', CASE 
                WHEN COALESCE(marks_agg.total_out_of, 0) > 0 THEN
                    CASE 
                        WHEN (COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100 >= 90 THEN 'A'
                        WHEN (COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100 >= 80 THEN 'B'
                        WHEN (COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100 >= 70 THEN 'C'
                        WHEN (COALESCE(marks_agg.total_score, 0) / marks_agg.total_out_of) * 100 >= 60 THEN 'D'
                        ELSE 'F'
                    END
                ELSE 'N/A'
            END,
            'comments', marks_agg.latest_comment,
            'teacher_name', marks_agg.teacher_name,
            'attendance_present', COALESCE(marks_agg.attendance_present, 0),
            'attendance_total', COALESCE(marks_agg.attendance_total, 0),
            'attendance_percentage', CASE 
                WHEN COALESCE(marks_agg.attendance_total, 0) > 0 
                THEN ROUND((COALESCE(marks_agg.attendance_present, 0)::NUMERIC / marks_agg.attendance_total) * 100, 2)
                ELSE 0
            END
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
            (ARRAY_AGG(m.comments ORDER BY m.created_at DESC))[1] as latest_comment,
            (ARRAY_AGG(DISTINCT u.full_name))[1] as teacher_name
        FROM marks m
        LEFT JOIN users u ON m.submitted_by = u.id
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

    -- Calculate totals and weighted average
    SELECT 
        SUM((subj->>'score')::NUMERIC),
        SUM((subj->>'out_of')::NUMERIC),
        SUM((subj->>'weighted_score')::NUMERIC),
        SUM((subj->>'coefficient')::NUMERIC),
        SUM((subj->>'attendance_present')::INTEGER),
        SUM((subj->>'attendance_total')::INTEGER)
    INTO v_total_score, v_total_out_of, v_weighted_total, v_coefficient_sum, 
         v_total_attendance_present, v_total_attendance_total
    FROM jsonb_array_elements(v_subjects) subj;

    -- Calculate final average
    IF v_coefficient_sum > 0 THEN
        v_final_average := ROUND(v_weighted_total / v_coefficient_sum, 2);
    ELSE
        v_final_average := 0;
    END IF;

    -- Calculate attendance percentage
    IF v_total_attendance_total > 0 THEN
        v_attendance_percentage := ROUND((v_total_attendance_present::NUMERIC / v_total_attendance_total) * 100, 2);
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
                    THEN ((marks_data.total_score / marks_data.total_out_of) * 100 * sub.coefficient)
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
        WHERE s.class_id = v_student_record.class_id
        GROUP BY s.id
    ),
    ranked AS (
        SELECT 
            student_id,
            weighted_avg,
            RANK() OVER (ORDER BY weighted_avg DESC NULLS LAST) as rank
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

    -- Insert comprehensive report card
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
            -- Academic Performance
            'subjects', v_subjects,
            'final_average', v_final_average,
            'total_score', v_total_score,
            'total_out_of', v_total_out_of,
            'letter_grade', v_letter_grade,
            'rank', v_rank,
            'class_size', v_class_size,
            
            -- Attendance
            'attendance_percentage', v_attendance_percentage,
            'attendance_present', v_total_attendance_present,
            'attendance_total', v_total_attendance_total,
            
            -- Student Information
            'student', jsonb_build_object(
                'id', v_student_record.id,
                'full_name', v_student_record.full_name,
                'admission_number', v_student_record.admission_number,
                'date_of_birth', v_student_record.date_of_birth,
                'gender', v_student_record.gender,
                'profile_photo_path', v_student_record.profile_photo_path,
                'email', v_student_record.email,
                'phone', v_student_record.phone,
                'address', v_student_record.address,
                'guardians', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', g.id,
                            'full_name', g.full_name,
                            'relationship', g.relationship,
                            'phone', g.phone,
                            'email', g.email,
                            'address', g.address,
                            'occupation', g.occupation
                        )
                    )
                    FROM guardians g
                    WHERE g.student_id = p_student_id
                )
            ),
            
            -- Class Information
            'class', jsonb_build_object(
                'id', v_class_record.id,
                'name', v_class_record.name,
                'description', v_class_record.description
            ),
            
            -- School Information
            'school', jsonb_build_object(
                'id', v_school_record.id,
                'name', v_school_record.name,
                'address', v_school_record.address,
                'logo_path', v_school_record.logo_path
            ),
            
            -- Period Information
            'period', jsonb_build_object(
                'scope', v_scope,
                'name', v_period_record.name,
                'due_date', v_period_record.due_date,
                'start_date', v_period_record.start_date,
                'end_date', v_period_record.end_date,
                'term_name', v_period_record.term_name,
                'term_start', v_period_record.term_start,
                'term_end', v_period_record.term_end,
                'year_name', v_period_record.year_name,
                'year_start', v_period_record.year_start,
                'year_end', v_period_record.year_end
            ),
            
            -- Metadata
            'generated_at', NOW(),
            'generated_by', 'system'
        )
    )
    RETURNING id INTO v_report_id;

    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_student_report IS 'Enhanced report generation with complete school, student, and academic data';

-- Test the function (uncomment to run)
-- SELECT compute_student_report(
--     (SELECT id FROM students LIMIT 1),
--     (SELECT id FROM sequences LIMIT 1)
-- );
