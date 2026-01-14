-- Update Script for Report Templates
-- This script updates existing templates and adds the new Booklet template
-- Safe to run multiple times

-- Step 1: Update existing templates with new watermark and stamp fields

-- Update Template 1: Classic Academic
UPDATE report_templates
SET config = config || '{
    "showWatermark": false,
    "watermarkText": "",
    "watermarkOpacity": 0.1,
    "includeStamp": false
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001'
AND is_default = TRUE;

-- Update Template 2: Modern Minimalist
UPDATE report_templates
SET config = config || '{
    "showWatermark": false,
    "watermarkText": "",
    "watermarkOpacity": 0.1,
    "includeStamp": false
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000002'
AND is_default = TRUE;

-- Update Template 3: Detailed Comprehensive
UPDATE report_templates
SET config = config || '{
    "showWatermark": false,
    "watermarkText": "",
    "watermarkOpacity": 0.1,
    "includeStamp": false
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000003'
AND is_default = TRUE;

-- Update Template 4: Simple Essential
UPDATE report_templates
SET config = config || '{
    "showWatermark": false,
    "watermarkText": "",
    "watermarkOpacity": 0.1,
    "includeStamp": false
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000004'
AND is_default = TRUE;

-- Step 2: Insert or Update Template 5: Professional Booklet
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
)
ON CONFLICT (id) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    template_type = EXCLUDED.template_type,
    description = EXCLUDED.description,
    layout_type = EXCLUDED.layout_type,
    color_scheme = EXCLUDED.color_scheme,
    config = EXCLUDED.config;

-- Step 3: Verify the updates
SELECT 
    id,
    template_name,
    template_type,
    is_default,
    config->>'showWatermark' as has_watermark,
    config->>'includeStamp' as has_stamp,
    config->>'multiPage' as is_multipage
FROM report_templates
WHERE is_default = TRUE
ORDER BY template_type;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Report templates updated successfully!';
    RAISE NOTICE 'Total default templates: %', (SELECT COUNT(*) FROM report_templates WHERE is_default = TRUE);
END $$;
