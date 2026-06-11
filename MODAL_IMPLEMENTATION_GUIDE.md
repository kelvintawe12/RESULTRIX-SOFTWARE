# EduMaster - Modal Implementation Guide

## Overview
This guide provides step-by-step instructions to implement missing modals across the platform. Start with Phase 1 (Admin Modals) as they unblock core functionality.

---

## Phase 1: ADMIN CRITICAL MODALS

### 1. AddTeacherModal.tsx

**Location**: `src/src/components/forms/AddTeacherModal.tsx`

**Purpose**: Allow school admins to add new teachers with all necessary information

**Integration Points**:
- TeachersPage.tsx (onClick="Add Teacher" button)
- TeacherAssignmentsPage.tsx (Quick add from assignment page)

**Required Fields**:
- Full Name (required)
- Email (required, unique)
- Phone Number
- Subject(s) - Multi-select
- Qualification(s)
- Experience (years)
- Employment Status (Full-time/Part-time)
- Salary (optional, for bursar)
- Bio/Description

**Template Code Structure**:
```typescript
interface AddTeacherFormData {
  full_name: string;
  email: string;
  phone: string;
  subject_ids: string[];
  qualification: string;
  experience_years: number;
  employment_status: 'full_time' | 'part_time';
  salary?: number;
  bio?: string;
}

export function AddTeacherModal() {
  // Form state management
  // Supabase insert to users table with role='teacher'
  // Insert to teacher_profiles table with school_id
  // Handle duplicate email validation
  // Success/error notifications
}
```

---

### 2. EditTeacherModal.tsx

**Location**: `src/src/components/forms/EditTeacherModal.tsx`

**Purpose**: Edit existing teacher details

**Key Differences from Add**:
- Fetch existing teacher data
- Allow all fields to be editable
- Show subject reassignment confirmation
- Archive/deactivate option
- Assignment history view

---

### 3. AddSubjectModal.tsx

**Location**: `src/src/components/forms/AddSubjectModal.tsx`

**Fields**:
- Subject Name (required)
- Subject Code (auto-generate or manual)
- Description
- Coefficient (weight for grading)
- Is Compulsory (checkbox)
- Teacher Assignment (optional)

**Database Integration**:
```sql
INSERT INTO subjects (school_id, name, code, description, coefficient, is_compulsory)
VALUES (?, ?, ?, ?, ?, ?)
```

---

### 4. StudentEnrollmentModal.tsx

**Location**: `src/src/components/forms/StudentEnrollmentModal.tsx`

**Purpose**: Manage student class/subject enrollment

**Features**:
- Class assignment dropdown
- Subject selection (multi-select with mandatory flag)
- Enrollment date
- Special needs/accommodations
- Guardian information (name, phone, email, relationship)
- Emergency contact

**Validation**:
- One class per student
- Mandatory subjects must be selected
- Guardian phone format validation

---

### 5. AcademicSessionModal.tsx

**Location**: `src/src/components/forms/AcademicSessionModal.tsx`

**Purpose**: Setup academic years, terms, and periods

**Fields for Session**:
- Academic Year (e.g., 2024/2025)
- Status (Planning/Active/Closed)

**Fields for Term** (within session):
- Term Number (1, 2, 3)
- Start Date
- End Date
- Holidays/Breaks

**Fields for Period** (grading periods):
- Period Name (e.g., "First Term Exam")
- Period Type (Assessment/Exam/Project)
- Start Date
- End Date
- Weight (%)

---

## Phase 2: SUPER-ADMIN CRITICAL MODALS

### 1. SchoolApprovalModal.tsx

**Location**: `src/src/components/forms/SchoolApprovalModal.tsx`

**Display Pending School Details**:
- School name, address, contact
- Admin information
- Submission documents
- Special requests/notes

**Approval Actions**:
- ✅ Approve - Set approved=true, send welcome email
- ❌ Reject - Show reason input modal, send rejection email
- 📝 Request Changes - Create activity log, send revision request
- 🔔 Schedule Review - Send meeting invite

**Implementation**:
```typescript
interface SchoolApprovalData {
  school_id: string;
  status: 'approved' | 'rejected' | 'pending_revision';
  rejection_reason?: string;
  notes?: string;
  admin_id?: string;
  admin_notes?: string;
}

async function handleApproval(data: SchoolApprovalData) {
  // Update school.approved status
  // Create audit log entry
  // Send email notification
  // Update admin dashboard
}
```

---

### 2. ManageAdminModal.tsx

**Location**: `src/src/components/forms/ManageAdminModal.tsx`

**Fields**:
- Full Name
- Email
- Phone
- Department (System/Finance/Support/Operations)
- Permissions (Multi-select checkboxes):
  - View Schools
  - Approve Schools
  - Manage Users
  - Manage Billing
  - System Settings
  - View Audit Logs
  - Generate Reports
  - Manage Email Templates
- Two-Factor Authentication (Enable/Disable)
- Status (Active/Inactive)

**Advanced Features**:
- Activity log showing admin actions
- IP whitelist management
- Login attempt tracking
- API key generation

---

### 3. BillingModal.tsx

**Location**: `src/src/components/forms/BillingModal.tsx`

**Sections**:

**A. Subscription Management**:
- Current plan display
- Upgrade/downgrade options
- Billing cycle (Monthly/Annual)
- Pricing breakdown
- Trial period indicator

**B. Invoice Management**:
- Invoice history table
- Download invoice PDF
- Resend invoice email
- Custom invoice template
- Invoice numbering scheme

**C. Payment Methods**:
- Saved payment methods
- Add new payment method
- Default payment method selection
- Payment method deletion

**D. Billing History**:
- Transaction log
- Failed payment retry
- Tax information
- Refund history

---

### 4. EmailConfigurationModal.tsx

**Location**: `src/src/components/forms/EmailConfigurationModal.tsx`

**Sections**:

**A. Email Service Provider**:
- Provider selection (SendGrid, AWS SES, Mailgun, SMTP)
- API key configuration
- Test connection button

**B. Email Templates**:
- Welcome email
- Password reset email
- Invoice email
- Payment confirmation
- Report card email
- Announcement email
- Template editor with preview

**C. Email Settings**:
- From address
- Reply-to address
- Support email
- Bounce handling
- Unsubscribe management

---

### 5. SchoolDetailModal.tsx (Enhanced)

**Location**: `src/src/components/dashboard/SchoolDetailModal.tsx` (existing, needs enhancement)

**Current Implementation**: Basic view modal  
**Required Enhancements**:

**Tabs to Add**:
1. **Overview Tab** - School info, stats, status
2. **Admins Tab** - List of school admins with add/remove options
3. **Subscription Tab** - Current plan, usage, billing
4. **Settings Tab** - Grading scale, currency, academic sessions
5. **Integrations Tab** - Connected third-party services
6. **Audit Log Tab** - Activity history
7. **Documents Tab** - Uploaded certificates, licenses, etc.

**Key Modal Sub-Components**:
```typescript
<SchoolDetailModal>
  <Tabs>
    <Tab>
      <SchoolOverviewSection />
      <AdminListSection />
      <AddAdminButton />
    </Tab>
    <Tab>
      <SubscriptionSection />
      <BillingHistorySection />
    </Tab>
    {/* ... more tabs */}
  </Tabs>
</SchoolDetailModal>
```

---

## Phase 3: BURSAR CRITICAL MODALS

### 1. CreateInvoiceModal.tsx

**Location**: `src/src/components/forms/CreateInvoiceModal.tsx`

**Fields**:
- Student(s) selection (single or bulk)
- Fee type (Tuition, Boarding, Activity, etc.)
- Amount
- Description
- Due date
- Payment terms (Due on date / Net 30 / Custom)
- Notes/Special instructions
- Recurring (Yes/No with frequency)

**Features**:
- Invoice number auto-generation
- Template selection
- Email immediately option
- Preview before sending
- Bulk invoice creation

**Implementation Tip**:
```typescript
async function createInvoice(data: InvoiceData) {
  // 1. Insert invoice record
  // 2. Insert invoice items (fees)
  // 3. Generate invoice number (sequence)
  // 4. Create audit log
  // 5. Send email if requested
  // 6. Update student balance
}
```

---

### 2. RecordPaymentModal.tsx (Enhanced)

**Location**: Already exists as `RecordPaymentForm.tsx`, needs modal wrapper

**Current Implementation**: Form in page  
**Required Changes**:
- Wrap in Dialog/Modal
- Add payment method selection
- Add receipt generation
- Add payment confirmation screen
- Add manual payment adjustment

**New Fields to Add**:
- Payment method (Cash/Bank Transfer/Check/Online/Mpesa)
- Reference number
- Bank/Mobile provider (if applicable)
- Receipt template selection
- Email receipt immediately (checkbox)
- Print receipt (checkbox)

---

### 3. RefundModal.tsx

**Location**: `src/src/components/forms/RefundModal.tsx`

**Purpose**: Process refunds for overpayments

**Fields**:
- Student selection
- Amount to refund
- Reason for refund
- Refund method (Bank transfer / Back credit / Cash)
- Bank details (if bank transfer)
- Approval required (checkbox for admin)
- Notes

**Workflow**:
1. Bursar initiates refund
2. System calculates available amount
3. Optional admin approval
4. Process refund
5. Update student balance
6. Send confirmation email

---

### 4. PaymentPlanModal.tsx

**Location**: `src/src/components/forms/PaymentPlanModal.tsx`

**Purpose**: Setup payment plans for outstanding fees

**Fields**:
- Student(s) selection
- Total outstanding amount (auto-filled)
- Plan name (e.g., "3-month plan")
- Installment count
- First payment due date
- Subsequent payment dates (calculated)
- Downpayment amount (optional)
- Installment amount (auto-calculated)
- Terms and conditions (checkbox)

**Features**:
- Auto-calculate installment dates
- Email payment plan to student/guardian
- Track installment payments
- Late payment notifications
- Overdue payment management

---

## Shared Components to Create

### BulkOperationModal.tsx
```typescript
interface BulkOperationConfig {
  title: string;
  description: string;
  itemsCount: number;
  fields: FormField[];
  onConfirm: (data: any) => Promise<void>;
  confirmMessage: string;
  dangerOperation?: boolean;
}

// Used for bulk approve, bulk delete, bulk email, etc.
```

### ConfirmationModal.tsx (Enhanced)
```typescript
interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => Promise<void>;
  onCancel?: () => void;
}
```

---

## Implementation Checklist

### For Each Modal:
- [ ] TypeScript interface for form data
- [ ] Supabase queries defined
- [ ] Input validation rules
- [ ] Error handling try-catch
- [ ] Loading state during submission
- [ ] Success notification
- [ ] Audit log entry creation
- [ ] Email notification (if applicable)
- [ ] Permission checks
- [ ] Unit tests
- [ ] E2E tests

### Modal Structure Template:
```typescript
import React, { useState } from 'react';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Alert } from '../../ui/Alert';
import { supabase } from '../../../lib/supabaseClient';

interface AddXModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  school_id: string;
}

interface FormData {
  // Define fields
}

export function AddXModal({ isOpen, onClose, onSuccess, school_id }: AddXModalProps) {
  const [formData, setFormData] = useState<FormData>({ /* defaults */ });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.required_field) throw new Error('Field is required');

      // Insert to Supabase
      const { error: insertError } = await supabase
        .from('table_name')
        .insert([{ ...formData, school_id }]);

      if (insertError) throw insertError;

      // Create audit log
      // await createAuditLog('ADD_X', details, school_id);

      // Success
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add X" size="md">
      <div className="space-y-4">
        {error && <Alert type="error" title="Error" message={error} />}

        <Input
          label="Field Name"
          value={formData.field}
          onChange={(e) => setFormData({ ...formData, field: e.target.value })}
          placeholder="Placeholder"
          required
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={loading}
          >
            Add
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
```

---

## Next Steps

1. **Start with Phase 1, Modal 1** (AddTeacherModal)
2. **Create 1-2 modals per day** following the template
3. **Test each modal** in the corresponding page
4. **Get stakeholder feedback** before moving to Phase 2
5. **Prioritize based on user workflows**

---

**Estimated Time**: 40 hours for all Phase 1 + 2 modals  
**Recommended Frequency**: 5-8 hours/day for 5-8 days

