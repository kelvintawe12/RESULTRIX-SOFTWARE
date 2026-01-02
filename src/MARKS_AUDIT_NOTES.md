
# Marks Audit Logging Notes

## Current Status
The audit trigger has been **disabled** on the `marks` table to prevent it from blocking critical mark entry operations.

## Why Disabled?
The audit trigger was causing errors:
- Error: `column reference "key" is ambiguous` 
- This prevented teachers from saving student marks
- Marks entry is a critical operation that should not be blocked by logging

## Alternative Tracking
Marks are still tracked through:
1. `submitted_by` field - Records which teacher entered the mark
2. `created_at` timestamp - When the mark was first created
3. `updated_at` timestamp - When the mark was last modified
4. `approved` boolean - Tracks approval status

## Future Options

### Option 1: Fix the Audit Trigger
Update the `log_audit_event()` function to properly handle the marks table:
```sql
-- Fix the ambiguous key reference in the trigger
-- See fix-audit-trigger.sql for the corrected version
```

### Option 2: Application-Level Logging
Instead of database triggers, log mark changes in the application code:
- Log to a separate `marks_history` table
- Include: old_value, new_value, changed_by, changed_at
- More flexible and doesn't block operations

### Option 3: Async Audit Logging
- Use database triggers to queue audit events
- Process them asynchronously so they don't block inserts
- Requires a background worker

## Recommendation
Use **Option 2 (Application-Level Logging)** for marks because:
- More reliable (doesn't block critical operations)
- More flexible (can log additional context)
- Easier to debug and maintain
- Can include business logic (e.g., only log significant changes)

## Re-enabling the Trigger
If you want to re-enable audit logging on marks:
1. First run `fix-audit-trigger.sql` to fix the ambiguous key issue
2. Then run:
```sql
CREATE TRIGGER audit_marks
  AFTER INSERT OR UPDATE OR DELETE ON marks
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
```
