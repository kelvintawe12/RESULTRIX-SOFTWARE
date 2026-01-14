# Dynamic Report Cards System 📊

## Overview

The Dynamic Report Cards system automatically generates report cards in real-time by fetching marks directly from the database. **No pre-generation required!**

## Key Features

### ✅ Automatic Data Fetching
- Fetches student information automatically
- Retrieves all marks for the selected period
- Calculates averages, grades, and attendance on-the-fly
- Shows complete school information

### ✅ Real-Time Updates
- Always shows the latest marks
- No need to regenerate reports when marks change
- Instant reflection of any mark updates

### ✅ School-Specific Grading System
- **Respects school's grading configuration**
- Supports multiple grading scales:
  - **Out of 20** (0-20 scale)
  - **Percentage** (0-100%)
  - **GPA 4.0 Scale**
  - **GPA 5.0 Scale**
  - **Custom GPA Scale**
- Uses school's custom GPA mapping for letter grades
- Automatically converts scores to school's preferred format

### ✅ Official vs Unofficial Transcripts
- **Unofficial**: For preview and internal use
  - Shows "UNOFFICIAL" watermark
  - Can be printed anytime
- **Official**: For formal submissions
  - Marked as "OFFICIAL DOCUMENT"
  - Includes warning about alterations
  - Professional seal and signatures

### ✅ Professional Design
- Beautiful, print-ready layout
- School logo and branding
- Complete student information
- Detailed subject breakdown
- Teacher comments
- Signature sections

## How It Works

### 1. **View Report Cards Page**
Navigate to: Dashboard → Report Cards

### 2. **Select Any Report**
Click on any student's report card to view it

### 3. **Dynamic Generation**
The system automatically:
- Fetches student data
- Retrieves all enrolled subjects
- Collects marks for the selected period (sequence/term/year)
- Calculates weighted averages using subject coefficients
- Computes attendance percentages
- Determines letter grades
- Displays everything in a professional format

## Report Card Components

### Header Section
- **School Logo** (if available)
- **School Name** with motto
- **Contact Information** (address, phone, email)
- **Report Type** (Sequence/Term/Year)
- **Period Name**

### Student Information
- Full name
- Admission number
- Class
- Date of birth
- Gender
- Overall performance summary

### Academic Performance Table
For each subject:
- Subject name and code
- Subject type (Core/Elective)
- Total score and maximum
- Percentage
- Letter grade (A/B/C/D/F)
- Coefficient
- Teacher name

### Summary Section
- **Overall Average**: Weighted average across all subjects
- **Letter Grade**: Based on overall performance
- **Attendance**: Percentage and days present/total
- **Class Rank**: Position in class (if calculated)

### Footer
- Teacher signature line
- Principal signature (with name)
- Parent/Guardian signature line
- Generation timestamp

## Grading Systems

### Supported Scales

The system automatically adapts to your school's grading configuration:

#### 1. **Out of 20 Scale**
- Scores displayed as: `15.50/20`
- Common in French-speaking countries
- Automatically converts percentages to /20 scale

#### 2. **Percentage Scale**
- Scores displayed as: `85.5%`
- Standard 0-100% grading
- Most common worldwide

#### 3. **GPA Scales (4.0, 5.0, Custom)**
- Uses school's custom GPA mapping
- Letter grades based on percentage ranges
- Example mapping:
  | Range | Letter | GPA Points |
  |-------|--------|------------|
  | 90-100| A      | 4.0        |
  | 80-89 | B      | 3.0        |
  | 70-79 | C      | 2.0        |
  | 60-69 | D      | 1.0        |
  | 0-59  | F      | 0.0        |

### Default Grading Scale (if not configured)

| Percentage | Grade | Color |
|------------|-------|-------|
| 90-100%    | A     | Green |
| 80-89%     | B     | Blue  |
| 70-79%     | C     | Yellow|
| 60-69%     | D     | Orange|
| 0-59%      | F     | Red   |

## Weighted Average Calculation

The system uses subject coefficients to calculate weighted averages:

```
Weighted Average = Σ(Subject Percentage × Coefficient) / Σ(Coefficients)
```

**Example:**
- Math: 85% × 3 = 255
- English: 90% × 2 = 180
- Science: 80% × 3 = 240
- Total: 675 / 8 = 84.375%

## Attendance Calculation

```
Attendance % = (Days Present / Total Days) × 100
```

Attendance is tracked per subject and aggregated for overall attendance.

## Generating Transcripts

### Unofficial Transcript (Default)
1. Click on any report card
2. Click the "View" button (eye icon)
3. Report opens with "UNOFFICIAL" watermark
4. Click "Print Report Card" to print or save as PDF

### Official Transcript
1. Click on any report card
2. Click the "Official" button
3. Report opens marked as "OFFICIAL DOCUMENT"
4. Toggle between Official/Unofficial using buttons at top
5. Click "Print Official Transcript" to print

### Quick Print
- Click the "Print" button directly from the list
- Opens unofficial report and triggers print dialog automatically

### Features
- **Watermark**: Unofficial transcripts show diagonal "UNOFFICIAL" watermark
- **Official Seal**: Official transcripts include warning about alterations
- **Toggle**: Switch between official/unofficial in the preview modal
- **Print-Optimized**: Layout automatically adjusts for printing
- **PDF Export**: Use browser's "Save as PDF" option when printing

## Advantages Over Static Reports

### Dynamic System (New)
✅ Always up-to-date
✅ No generation step needed
✅ Instant access
✅ Reflects latest marks immediately
✅ No storage overhead

### Static System (Old)
❌ Requires manual generation
❌ Can become outdated
❌ Extra step for admins
❌ Stored in database
❌ Needs regeneration after mark changes

## Technical Details

### Component: `DynamicReportCard.tsx`

**Props:**
- `studentId`: UUID of the student
- `sequenceId`: UUID of sequence (optional)
- `termId`: UUID of term (optional)
- `academicYearId`: UUID of academic year (optional)
- `schoolId`: UUID of the school
- `transcriptType`: 'official' | 'unofficial' (optional, default: 'unofficial')

**Data Sources:**
- `students` table: Student information
- `schools` table: School information + grading configuration
  - `grading_scale`: Type of grading system
  - `default_exam_out_of`: Default maximum score
  - `gpa_mapping`: Custom GPA ranges and letter grades
- `classes` table: Class details
- `enrollments` table: Subject enrollments
- `subjects` table: Subject details
- `marks` table: All marks and attendance
- `sequences/terms/academic_years`: Period information

### Database Queries

The component performs optimized queries:
1. Single query for student + class data
2. Single query for school data
3. Single query for period data
4. Batch query for all enrollments
5. Filtered queries for marks per enrollment

### Performance

- **Load Time**: ~1-2 seconds for typical report
- **Data Size**: Minimal (only fetches needed data)
- **Caching**: Browser caches school/student data
- **Optimization**: Uses Supabase's efficient querying

## Customization

### Grading System
Configure in: **Setup → Grading System Setup**
- Choose grading scale type
- Set default exam score
- Configure GPA mapping (if using GPA scales)
- Changes apply immediately to all report cards

### Styling
Edit `DynamicReportCard.tsx` to customize:
- Colors and fonts
- Layout and spacing
- Header/footer content
- Table design
- Watermark appearance

### Letter Grades
The system uses school's GPA mapping if configured.
To modify default grades, edit the `getLetterGrade()` function.

### Calculations
Weighted average formula uses subject coefficients.
Adjust in the calculation section if needed.

## Troubleshooting

### "No marks available"
- Ensure marks have been entered for the student
- Check that the correct period is selected
- Verify student is enrolled in subjects

### Missing school logo
- Upload school logo in school settings
- Ensure logo path is correct in database

### Incorrect calculations
- Verify subject coefficients are set correctly
- Check that all marks have valid out_of values
- Ensure marks are linked to correct sequences

### Scores showing as percentages when using /20 scale
- Check school's grading configuration
- Ensure `grading_scale` is set to 'out_of_20'
- Verify `default_exam_out_of` is set correctly

### Letter grades don't match expectations
- Review school's GPA mapping configuration
- Ensure percentage ranges don't overlap
- Check that GPA mapping is saved correctly

## Consistency with Academic Records

The Dynamic Report Card system is fully consistent with:
- **StudentAcademicRecordsPage**: Uses same grading calculations
- **GradingSystemSetupPage**: Respects all grading configurations
- **Marks Entry**: Reflects all entered marks in real-time

### Alignment
- ✅ Same grading scale (out of 20, percentage, GPA)
- ✅ Same letter grade calculations
- ✅ Same weighted average formula
- ✅ Same attendance calculations
- ✅ Official vs unofficial transcript support

## Future Enhancements

Potential additions:
- [ ] Class rank calculation (real-time)
- [ ] Comparison with previous periods
- [ ] Progress charts and graphs
- [ ] Customizable templates per school
- [ ] Multi-language support
- [ ] Email delivery with attachments
- [ ] Bulk PDF generation for entire class
- [ ] Digital signatures
- [ ] QR code verification

## Support

For issues or questions:
1. Check this guide first
2. Review the component code
3. Check browser console for errors
4. Verify database data integrity

---

**Created**: 2024
**Version**: 1.0
**Status**: Production Ready ✅
