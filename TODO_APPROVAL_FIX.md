nhu# TODO: Fix Approval Flow and Navigation Issues

## Issues to Fix:
1. ~~SignupPage redirects immediately to `/dashboard` instead of showing "pending approval" message~~
2. AuthContext uses `window.location.href` causing full page reloads and 500 errors
3. App.tsx has duplicate route entries for DatabaseInspectorPage and SystemMaintenancePage
4. SchoolApprovalPage Table component may have type issues

## Tasks:

### Task 1: Fix SignupPage.tsx ✅ DONE
- [x] Show "pending approval" message after successful signup
- [x] Don't redirect to dashboard for pending schools
- [x] Add success message with instructions to wait for approval


- [x] Replace `window.location.href` with React Router's `useNavigate`
- [x] Fix navigation to work properly with SPA routing
- [x] Ensure login and signup flows work correctly

### Task 3: Fix App.tsx ✅ DONE
- [x] Remove duplicate route entries for DatabaseInspectorPage
- [x] Remove duplicate route entries for SystemMaintenancePage
- [x] Clean up route configuration

### Task 4: Fix SchoolApprovalPage.tsx ✅ DONE
- [x] Ensure Table component supports `data` and `columns` props
- [x] Fix TypeScript type issues
- [x] Verify the table renders correctly

## Summary of Changes Made:

### Task 1: SignupPage.tsx ✅
- Added `showPendingMessage` state to track when to show the success message
- Modified `handleSubmit` to set pending message state instead of navigating
- Added a beautiful pending approval UI with:
  - Success checkmark icon
  - Clear messaging about pending approval
  - Helpful links to return to homepage or sign in

### Task 2: AuthContext.tsx ✅
- Replaced `window.location.href` with React Router's `useNavigate`
- Added `hasNavigatedRef` to prevent duplicate navigations
- Updated `navigateByRole` to use `navigate(targetRoute, { replace: true })`
- Updated `signOut` to use `navigate('/login', { replace: true })`
- Modified `signup` to NOT auto-navigate (let SignupPage handle the pending message)

### Task 3: App.tsx ✅
- Removed duplicate route entries for:
  - `/super-admin/database-inspector` (duplicate of `/super-admin/database`)
  - `/super-admin/system-maintenance` (duplicate of `/super-admin/maintenance`)

### Task 4: SchoolApprovalPage.tsx ✅
- Refactored to manually render table using Table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- Fixed Alert component prop from `variant="error"` to `type="error"`
- Added proper TypeScript interfaces for PendingSchool

## Testing:
- [ ] Test signup flow shows pending message
- [ ] Test login blocks unapproved schools
- [ ] Test super admin approval flow works
- [ ] Verify no 500 errors when navigating

