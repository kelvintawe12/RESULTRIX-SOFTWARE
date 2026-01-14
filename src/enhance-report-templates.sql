-- Enhancement for Report Templates Table
-- Adds support for default templates, template types, and better customization

-- Step 1: Allow NULL school_id for system-wide default templates
ALTER TABLE report_templates
ALTER COLUMN school_id DROP NOT NULL;

-- Step 2: Add new columns to report_templates table
ALTER TABLE report_templates
ADD COLUMN IF NOT EXISTS template_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS color_scheme JSONB DEFAULT '{"primary": "#4F46E5", "secondary": "#10B981", "accent": "#F59E0B"}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Add comments
COMMENT ON COLUMN report_templates.template_name IS 'Display name for the template';
COMMENT ON COLUMN report_templates.template_type IS 'Type: classic, modern, detailed, minimal, or custom';
COMMENT ON COLUMN report_templates.is_default IS 'System-provided default templates (cannot be deleted)';
COMMENT ON COLUMN report_templates.is_active IS 'Currently active template for the school';
COMMENT ON COLUMN report_templates.layout_type IS 'Layout style: standard, compact, detailed, minimal';
COMMENT ON COLUMN report_templates.color_scheme IS 'JSONB with primary, secondary, accent colors';

-- Step 4: Create index for active templates
CREATE INDEX IF NOT EXISTS idx_report_templates_active 
ON report_templates(school_id, is_active) 
WHERE is_active = TRUE;

-- Step 5: Create index for default templates
CREATE INDEX IF NOT EXISTS idx_report_templates_default 
ON report_templates(is_default) 
WHERE is_default = TRUE;

-- Step 6: Ensure only one active template per school (only for non-NULL school_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_template_per_school
ON report_templates(school_id)
WHERE is_active = TRUE;

-- Step 7: Insert 4 default templates (available to all schools)
-- These templates have school_id as NULL to indicate they're system-wide

-- Template 1: Classic Academic
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
    is_active,
    description,
    layout_type,
    color_scheme,
    config
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Classic Academic',
    'classic',
    TRUE,
    FALSE,
    'Traditional academic report card with formal layout and comprehensive details',
    'standard',
    '{"primary": "#1e3a8a", "secondary": "#059669", "accent": "#d97706"}'::jsonb,
    '{
        "showLogo": true,
        "showRank": true,
        "showAttendance": true,
        "showComments": true,
        "showGradeScale": true,
        "showSubjectCoefficients": true,
        "gradeDisplay": "both",
        "headerStyle": "formal",
        "fontFamily": "Times New Roman",
        "fontSize": "medium",
        "borderStyle": "solid",
        "includeSignatures": true,
        "includeSchoolMotto": true,
        "subjectGrouping": "by_type",
        "showClassAverage": true,
        "showPercentile": true
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Template 2: Modern Minimalist
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
    is_active,
    description,
    layout_type,
    color_scheme,
    config
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Modern Minimalist',
    'modern',
    TRUE,
    FALSE,
    'Clean, contemporary design with focus on key metrics and visual clarity',
    'compact',
    '{"primary": "#4F46E5", "secondary": "#10B981", "accent": "#F59E0B"}'::jsonb,
    '{
        "showLogo": true,
        "showRank": true,
        "showAttendance": true,
        "showComments": true,
        "showGradeScale": false,
        "showSubjectCoefficients": false,
        "gradeDisplay": "percentage",
        "headerStyle": "modern",
        "fontFamily": "Arial",
        "fontSize": "medium",
        "borderStyle": "none",
        "includeSignatures": false,
        "includeSchoolMotto": false,
        "subjectGrouping": "none",
        "showClassAverage": false,
        "showPercentile": false,
        "useCards": true,
        "colorCodeGrades": true
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Template 3: Detailed Comprehensive
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
    is_active,
    description,
    layout_type,
    color_scheme,
    config
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Detailed Comprehensive',
    'detailed',
    TRUE,
    FALSE,
    'Comprehensive report with all metrics, charts, and detailed analysis',
    'detailed',
    '{"primary": "#7C3AED", "secondary": "#0891B2", "accent": "#DC2626"}'::jsonb,
    '{
        "showLogo": true,
        "showRank": true,
        "showAttendance": true,
        "showComments": true,
        "showGradeScale": true,
        "showSubjectCoefficients": true,
        "gradeDisplay": "both",
        "headerStyle": "detailed",
        "fontFamily": "Georgia",
        "fontSize": "small",
        "borderStyle": "double",
        "includeSignatures": true,
        "includeSchoolMotto": true,
        "subjectGrouping": "by_type",
        "showClassAverage": true,
        "showPercentile": true,
        "includeCharts": true,
        "showTermProgress": true,
        "showStrengthsWeaknesses": true,
        "showRecommendations": true,
        "showAttendanceChart": true,
        "showGradeDistribution": true
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Template 4: Simple Essential
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
    is_active,
    description,
    layout_type,
    color_scheme,
    config
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Simple Essential',
    'minimal',
    TRUE,
    FALSE,
    'Minimal design with only essential information - perfect for quick reports',
    'minimal',
    '{"primary": "#374151", "secondary": "#6B7280", "accent": "#9CA3AF"}'::jsonb,
    '{
        "showLogo": false,
        "showRank": false,
        "showAttendance": false,
        "showComments": false,
        "showGradeScale": false,
        "showSubjectCoefficients": false,
        "gradeDisplay": "grade_only",
        "headerStyle": "minimal",
        "fontFamily": "Arial",
        "fontSize": "large",
        "borderStyle": "none",
        "includeSignatures": false,
        "includeSchoolMotto": false,
        "subjectGrouping": "none",
        "showClassAverage": false,
        "showPercentile": false,
        "compactLayout": true,
        "showWatermark": false,
        "watermarkText": "",
        "watermarkOpacity": 0.1,
        "includeStamp": false
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Template 5: Professional Booklet (Multi-Page)
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
    is_active,
    description,
    layout_type,
    color_scheme,
    config
) VALUES (
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'Professional Booklet',
    'booklet',
    TRUE,
    FALSE,
    'Comprehensive multi-page booklet with cover page, detailed analysis, charts, and official stamps',
    'booklet',
    '{"primary": "#1e40af", "secondary": "#059669", "accent": "#dc2626"}'::jsonb,
    '{
        "showLogo": true,
        "showRank": true,
        "showAttendance": true,
        "showComments": true,
        "showGradeScale": true,
        "showSubjectCoefficients": true,
        "gradeDisplay": "both",
        "headerStyle": "formal",
        "fontFamily": "Georgia",
        "fontSize": "medium",
        "borderStyle": "double",
        "includeSignatures": true,
        "includeSchoolMotto": true,
        "subjectGrouping": "by_type",
        "showClassAverage": true,
        "showPercentile": true,
        "includeCharts": true,
        "showTermProgress": true,
        "showStrengthsWeaknesses": true,
        "showRecommendations": true,
        "showAttendanceChart": true,
        "showGradeDistribution": true,
        "multiPage": true,
        "includeCoverPage": true,
        "includeTableOfContents": false,
        "includeSummaryPage": true,
        "includeProgressCharts": true,
        "showWatermark": true,
        "watermarkText": "OFFICIAL",
        "watermarkOpacity": 0.05,
        "includeStamp": true,
        "stampPosition": "bottom-right",
        "includeDigitalSignatures": true,
        "signatureFields": ["Principal", "Class Teacher", "Parent/Guardian"],
        "includeQRCode": false,
        "pageNumbers": true,
        "includeGlossary": false
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Step 8: Function to activate a template for a school
CREATE OR REPLACE FUNCTION activate_template(p_template_id UUID, p_school_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Deactivate all templates for this school
    UPDATE report_templates
    SET is_active = FALSE
    WHERE school_id = p_school_id;
    
    -- Activate the selected template
    UPDATE report_templates
    SET is_active = TRUE
    WHERE id = p_template_id AND school_id = p_school_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION activate_template IS 'Sets a template as active for a school, deactivating all others';

-- Step 9: Function to clone a default template for a school
CREATE OR REPLACE FUNCTION clone_default_template(p_default_template_id UUID, p_school_id UUID)
RETURNS UUID AS $$
DECLARE
    v_new_template_id UUID;
    v_template_record RECORD;
BEGIN
    -- Get the default template
    SELECT * INTO v_template_record
    FROM report_templates
    WHERE id = p_default_template_id AND is_default = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Default template not found';
    END IF;
    
    -- Create a new template for the school
    INSERT INTO report_templates (
        school_id,
        template_name,
        template_type,
        is_default,
        is_active,
        description,
        layout_type,
        color_scheme,
        config
    ) VALUES (
        p_school_id,
        v_template_record.template_name || ' (Custom)',
        v_template_record.template_type,
        FALSE,
        FALSE,
        v_template_record.description,
        v_template_record.layout_type,
        v_template_record.color_scheme,
        v_template_record.config
    ) RETURNING id INTO v_new_template_id;
    
    RETURN v_new_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clone_default_template IS 'Clones a default template for a school to customize';

-- Step 10: Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_report_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_report_template_timestamp
BEFORE UPDATE ON report_templates
FOR EACH ROW
EXECUTE FUNCTION update_report_template_timestamp();

-- Step 11: View for available templates (default + school-specific)
CREATE OR REPLACE VIEW v_available_templates AS
SELECT 
    t.*,
    CASE 
        WHEN t.school_id IS NULL THEN 'System Default'
        ELSE 'Custom'
    END as template_source
FROM report_templates t
ORDER BY t.is_default DESC, t.template_name;

COMMENT ON VIEW v_available_templates IS 'Shows all available templates including system defaults and school-specific ones';
