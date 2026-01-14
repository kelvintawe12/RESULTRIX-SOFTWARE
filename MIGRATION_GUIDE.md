# Report Templates Migration Guide

## 🔄 How to Update Your Existing Templates

Since you already ran the initial migration, use this update script to add the new features.

### Option 1: Update Existing Templates (Recommended) ✅

**File:** `src/update-report-templates.sql`

**What it does:**
- ✅ Updates existing 4 templates with watermark/stamp fields
- ✅ Adds the new 5th template (Professional Booklet)
- ✅ Safe to run multiple times
- ✅ Won't affect your custom templates

**Steps:**
1. Open Supabase SQL Editor
2. Copy contents of `src/update-report-templates.sql`
3. Paste and run
4. Verify: You should see 5 default templates

```sql
-- Quick verification query
SELECT 
    template_name,
    template_type,
    config->>'showWatermark' as has_watermark,
    config->>'includeStamp' as has_stamp
FROM report_templates
WHERE is_default = TRUE
ORDER BY template_name;
```

---

### Option 2: Fresh Install (Clean Slate)

**File:** `src/enhance-report-templates.sql`

**What it does:**
- Drops and recreates everything
- Fresh install of all 5 templates

**Steps:**
1. **Backup first!** Export your custom templates if any
2. Delete existing default templates:
```sql
DELETE FROM report_templates WHERE is_default = TRUE;
```
3. Run the full migration: `src/enhance-report-templates.sql`

---

## 📋 What's New

### Updates to Existing Templates (1-4):
```json
{
  "showWatermark": false,
  "watermarkText": "",
  "watermarkOpacity": 0.1,
  "includeStamp": false
}
```

### New Template 5: Professional Booklet
```json
{
  "multiPage": true,
  "includeCoverPage": true,
  "showWatermark": true,
  "watermarkText": "OFFICIAL",
  "watermarkOpacity": 0.05,
  "includeStamp": true,
  "stampPosition": "bottom-right",
  "includeDigitalSignatures": true,
  "signatureFields": ["Principal", "Class Teacher", "Parent/Guardian"],
  "pageNumbers": true
}
```

---

## ✅ Verification

After running the update script, verify:

```sql
-- Should return 5 templates
SELECT COUNT(*) FROM report_templates WHERE is_default = TRUE;

-- Check the booklet template exists
SELECT * FROM report_templates 
WHERE template_type = 'booklet' AND is_default = TRUE;

-- View all default templates
SELECT 
    template_name,
    template_type,
    description
FROM report_templates
WHERE is_default = TRUE
ORDER BY template_name;
```

Expected result:
1. Classic Academic
2. Detailed Comprehensive
3. Modern Minimalist
4. Professional Booklet ⭐ NEW
5. Simple Essential

---

## 🚨 Troubleshooting

### Issue: "Template already exists"
**Solution:** The update script uses `ON CONFLICT DO UPDATE`, so it's safe to run multiple times.

### Issue: "Only 4 templates showing"
**Solution:** Run this to add the booklet template:
```sql
INSERT INTO report_templates (
    id,
    school_id,
    template_name,
    template_type,
    is_default,
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
    'Comprehensive multi-page booklet',
    'booklet',
    '{"primary": "#1e40af", "secondary": "#059669", "accent": "#dc2626"}'::jsonb,
    '{"multiPage": true, "showWatermark": true, "includeStamp": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;
```

### Issue: "Custom templates affected"
**Solution:** The update script only touches templates where `is_default = TRUE`. Your custom templates are safe.

---

## 📝 Quick Commands

### Check current templates:
```sql
SELECT template_name, template_type, is_default 
FROM report_templates 
ORDER BY is_default DESC, template_name;
```

### Count templates:
```sql
SELECT 
    COUNT(*) FILTER (WHERE is_default = TRUE) as default_templates,
    COUNT(*) FILTER (WHERE is_default = FALSE) as custom_templates,
    COUNT(*) as total_templates
FROM report_templates;
```

### View booklet config:
```sql
SELECT config 
FROM report_templates 
WHERE template_type = 'booklet' AND is_default = TRUE;
```

---

## 🎯 Recommended Approach

**For existing installations:**
1. ✅ Use `src/update-report-templates.sql`
2. ✅ Run verification queries
3. ✅ Refresh your browser
4. ✅ Check Report Templates page
5. ✅ You should see 5 templates with 📖 icon for booklet

**For new installations:**
1. ✅ Use `src/enhance-report-templates.sql`
2. ✅ Run once
3. ✅ Done!

---

## 💡 Tips

- The update script is **idempotent** (safe to run multiple times)
- Your custom templates won't be affected
- The booklet template has the most features
- Watermarks and stamps are optional (disabled by default on templates 1-4)
- Only the booklet template has watermark/stamp enabled by default

---

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase logs for errors
2. Verify you have the correct permissions
3. Ensure the `report_templates` table exists
4. Run the verification queries above

---

## ✨ After Migration

Once updated, you'll have:
- ✅ 5 default templates (including booklet)
- ✅ Watermark support on all templates
- ✅ Official stamp support
- ✅ Digital signature fields
- ✅ Multi-page booklet format
- ✅ Enhanced preview modal

Enjoy your enhanced report templates system! 🎉
