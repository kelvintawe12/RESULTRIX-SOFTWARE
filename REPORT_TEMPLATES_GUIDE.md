# Report Templates System - Complete Guide

## 🎯 Overview
Enhanced report templates system with 4 professional default templates that schools can use or customize.

## 📊 Four Default Templates

### 1. **Classic Academic** 
- **Type:** `classic`
- **Style:** Traditional, formal
- **Best For:** Traditional schools, formal reports
- **Features:**
  - School logo and motto
  - Class rank and percentile
  - Subject coefficients
  - Attendance tracking
  - Teacher comments
  - Signature lines
  - Grade scale reference

### 2. **Modern Minimalist**
- **Type:** `modern`
- **Style:** Clean, contemporary
- **Best For:** Modern schools, quick overview
- **Features:**
  - Simplified layout
  - Card-based design
  - Color-coded grades
  - Key metrics only
  - No signatures or formalities
  - Focus on visual clarity

### 3. **Detailed Comprehensive**
- **Type:** `detailed`
- **Style:** Comprehensive, analytical
- **Best For:** Detailed analysis, parent meetings
- **Features:**
  - All metrics included
  - Performance charts
  - Term progress tracking
  - Strengths & weaknesses
  - Recommendations
  - Attendance charts
  - Grade distribution

### 4. **Simple Essential**
- **Type:** `minimal`
- **Style:** Minimal, essential
- **Best For:** Quick reports, summaries
- **Features:**
  - Only grades and names
  - No extra information
  - Compact layout
  - Large, readable fonts
  - Perfect for printing

## 🗄️ Database Structure

### New Columns:
```sql
- template_name VARCHAR(100)        -- Display name
- template_type VARCHAR(50)         -- classic, modern, detailed, minimal, custom
- is_default BOOLEAN                -- System template (cannot delete)
- is_active BOOLEAN                 -- Currently active for school
- description TEXT                  -- Template description
- preview_image_url TEXT            -- Preview image
- layout_type VARCHAR(50)           -- standard, compact, detailed, minimal
- color_scheme JSONB                -- {primary, secondary, accent}
- updated_at TIMESTAMP              -- Last update time
```

### Key Features:
- **System Templates:** `school_id = NULL`, `is_default = TRUE`
- **Custom Templates:** `school_id = UUID`, `is_default = FALSE`
- **One Active:** Only one template can be active per school
- **Clone & Customize:** Schools can clone default templates

## 🔧 Functions

### 1. `activate_template(template_id, school_id)`
Sets a template as active for a school.

```sql
SELECT activate_template(
    '00000000-0000-0000-0000-000000000001',
    'school-uuid-here'
);
```

### 2. `clone_default_template(default_template_id, school_id)`
Clones a default template for customization.

```sql
SELECT clone_default_template(
    '00000000-0000-0000-0000-000000000001',
    'school-uuid-here'
);
```

## 🎨 Color Schemes

### Classic Academic
```json
{
  "primary": "#1e3a8a",    // Navy blue
  "secondary": "#059669",  // Green
  "accent": "#d97706"      // Orange
}
```

### Modern Minimalist
```json
{
  "primary": "#4F46E5",    // Indigo
  "secondary": "#10B981",  // Emerald
  "accent": "#F59E0B"      // Amber
}
```

### Detailed Comprehensive
```json
{
  "primary": "#7C3AED",    // Purple
  "secondary": "#0891B2",  // Cyan
  "accent": "#DC2626"      // Red
}
```

### Simple Essential
```json
{
  "primary": "#374151",    // Gray
  "secondary": "#6B7280",  // Medium gray
  "accent": "#9CA3AF"      // Light gray
}
```

## 📱 Frontend Implementation

### Template Gallery View
- Grid layout with template cards
- Preview images
- Template descriptions
- "Use Template" button
- "Customize" button (clones template)

### Template Customization
- Color picker for scheme
- Toggle options (logo, rank, attendance, etc.)
- Header/footer text
- Font selection
- Layout options

### Active Template Indicator
- Badge showing "Active"
- Green checkmark
- Cannot delete active template

## 🚀 Usage Flow

### For Schools:

1. **Browse Templates**
   - View 4 default templates
   - See previews and descriptions
   - Compare features

2. **Select Template**
   - Click "Use Template" to activate
   - Or click "Customize" to clone and modify

3. **Customize (Optional)**
   - Change colors
   - Toggle features
   - Modify header/footer
   - Save as custom template

4. **Activate**
   - Set as active template
   - Used for all report generation

5. **Manage**
   - Create multiple custom templates
   - Switch between templates
   - Edit or delete custom templates
   - Cannot delete default templates

## 🔐 Permissions

- **Super Admin:** Can manage default templates
- **School Admin:** Can view defaults, create/edit/delete custom templates
- **Teachers:** Can view active template only
- **Bursars:** Can view active template only

## 📝 Migration Steps

1. **Run Migration:**
   ```bash
   psql -d your_database -f src/enhance-report-templates.sql
   ```

2. **Verify:**
   ```sql
   SELECT * FROM report_templates WHERE is_default = TRUE;
   -- Should return 4 default templates
   ```

3. **Test Functions:**
   ```sql
   -- Clone a template
   SELECT clone_default_template(
       '00000000-0000-0000-0000-000000000001',
       'your-school-id'
   );
   
   -- Activate it
   SELECT activate_template(
       'new-template-id',
       'your-school-id'
   );
   ```

## 🎯 Next Steps

1. Update ReportTemplatesPage.tsx with new UI
2. Add template gallery component
3. Implement color picker
4. Add preview functionality
5. Update report generation to use active template
6. Add template switching in report cards page

## 📚 Config Structure

Each template's `config` JSONB contains:

```typescript
interface TemplateConfig {
  // Display Options
  showLogo: boolean;
  showRank: boolean;
  showAttendance: boolean;
  showComments: boolean;
  showGradeScale: boolean;
  showSubjectCoefficients: boolean;
  
  // Grade Display
  gradeDisplay: 'percentage' | 'grade_only' | 'both';
  
  // Styling
  headerStyle: 'formal' | 'modern' | 'detailed' | 'minimal';
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderStyle: 'solid' | 'double' | 'none';
  
  // Additional Features
  includeSignatures?: boolean;
  includeSchoolMotto?: boolean;
  subjectGrouping?: 'by_type' | 'none';
  showClassAverage?: boolean;
  showPercentile?: boolean;
  
  // Advanced (Detailed template)
  includeCharts?: boolean;
  showTermProgress?: boolean;
  showStrengthsWeaknesses?: boolean;
  showRecommendations?: boolean;
  showAttendanceChart?: boolean;
  showGradeDistribution?: boolean;
  
  // Layout
  compactLayout?: boolean;
  useCards?: boolean;
  colorCodeGrades?: boolean;
}
```

## 🎨 UI Components Needed

1. **TemplateGallery** - Grid of template cards
2. **TemplateCard** - Individual template display
3. **TemplatePreview** - Full preview modal
4. **ColorPicker** - Color scheme selector
5. **TemplateCustomizer** - Edit form
6. **ActiveBadge** - Shows active template

## ✅ Success Criteria

- [x] Database migration created
- [ ] 4 default templates inserted
- [ ] Frontend UI updated
- [ ] Template gallery implemented
- [ ] Clone functionality working
- [ ] Activate functionality working
- [ ] Color customization working
- [ ] Preview functionality working
- [ ] Integration with report generation
