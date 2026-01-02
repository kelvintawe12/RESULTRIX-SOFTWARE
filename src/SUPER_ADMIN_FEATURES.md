# Super Admin Features - Complete Guide

## ✅ Schools Management Page (`/super-admin/schools`)

### Buttons in Table (Actions Column):
1. **View** - Opens detailed modal with school info
2. **Edit** - Opens edit form to modify school details
3. **Approve/Suspend** - Toggle school active status
4. **Delete** - Remove school from platform

### Buttons in View Modal:
1. **Edit School** - Opens edit form
2. **Approve/Suspend School** - Toggle status
3. **Delete** - Remove school
4. **Close** - Close modal

### Header Buttons:
1. **Refresh** - Reload schools data
2. **Add School** - Open form to create new school

---

## ✅ Administrators Management Page (`/super-admin/administrators`)

### Buttons in Table (Actions Column):
1. **View** - Opens detailed modal with admin info
2. **Edit** - Opens edit form to modify admin details
3. **Delete** - Remove administrator

### Buttons in View Modal:
1. **Edit Administrator** - Opens edit form
2. **Delete** - Remove administrator
3. **Close** - Close modal

### Header Buttons:
1. **Refresh** - Reload administrators data

---

## ✅ Billing & Subscriptions Page (`/super-admin/billing`)

### Header Buttons:
1. **View Reports** - View billing reports (currently shows alert)

### Plan Cards:
Each pricing plan has:
1. **View Details** - View plan details

---

## ✅ System Emails Page (`/super-admin/emails`)

### Buttons in Table (Actions Column):
1. **View** - Opens email details modal

### Header Buttons:
1. **Refresh** - Reload emails data

---

## ✅ Platform Announcements Page (`/super-admin/announcements`)

### Buttons in Table (Actions Column):
1. **View** - Opens announcement details
2. **Pin/Unpin** - Toggle pinned status
3. **Delete** - Remove announcement

### Header Buttons:
1. **Refresh** - Reload announcements
2. **New Announcement** - Create platform-wide announcement

---

## 🔧 Troubleshooting

If buttons are not visible:

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Console**: Look for JavaScript errors
3. **Verify Build**: Ensure latest code is compiled
4. **Check Imports**: Verify all components are properly imported

## 📝 Component Files

- **EditSchoolForm**: `src/components/forms/EditSchoolForm.tsx`
- **EditAdministratorForm**: `src/components/forms/EditAdministratorForm.tsx`
- **Button Component**: `src/components/ui/Button.tsx`
- **Dialog Component**: `src/components/ui/Dialog.tsx`

## 🎨 Button Variants Used

- `primary` - Blue background (main actions)
- `secondary` - Gray background (view actions)
- `danger` - Red background (delete actions)
- `warning` - Amber background (suspend actions)
- `success` - Green background (approve actions)

All buttons include proper icons from `lucide-react` for visual clarity.
