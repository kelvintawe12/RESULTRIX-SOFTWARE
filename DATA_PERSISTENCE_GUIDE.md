# Data Persistence & Caching Guide

This guide explains the comprehensive data persistence and caching system implemented to prevent data loss and improve performance throughout the EduMaster application.

## Overview

The application uses a multi-layered approach to data persistence:

1. **Session Management** - Extended 7-day sessions with auto-refresh
2. **Dual-Layer Caching** - Memory + localStorage with automatic sync
3. **Permanent Data Storage** - Critical data stored without expiration
4. **Form Data Persistence** - Auto-save forms with debouncing
5. **Optimistic Updates** - UI updates with rollback on failure
6. **Service Worker** - Offline support with asset caching

## 1. Enhanced Cache Service

**File**: `src/src/services/cacheService.ts`

### Features:
- **Dual-layer caching**: Memory cache (fast) + localStorage (persistent)
- **Automatic sync**: Changes sync between memory and storage
- **Cross-tab sync**: Storage events keep caches in sync across tabs
- **TTL support**: Configurable time-to-live for cache entries
- **Version control**: Cache versioning for easy invalidation
- **Auto cleanup**: Expired entries automatically removed

### Usage:

```typescript
import { cacheService } from '../services/cacheService';

// Set data with default TTL (5 minutes)
cacheService.set('students', studentsData);

// Set data with custom TTL (1 hour)
cacheService.set('students', studentsData, 60 * 60 * 1000);

// Get data (checks memory first, then storage)
const students = cacheService.get<Student[]>('students');

// Remove specific entry
cacheService.delete('students');

// Clear all expired entries
cacheService.clearExpired();

// Clear all entries
cacheService.clear();

// Get cache statistics
const stats = cacheService.getStats();
console.log(`Memory: ${stats.memorySize}, Storage: ${stats.storageSize}`);
```

### Permanent Data Storage:

For critical data that should never expire:

```typescript
// Save permanent data
cacheService.setPermanent('user-preferences', preferences);

// Get permanent data
const preferences = cacheService.getPermanent('user-preferences');

// Remove permanent data
cacheService.removePermanent('user-preferences');

// Clear all permanent data
cacheService.clearPermanent();
```

## 2. Form Data Persistence

**File**: `src/src/utils/formDataPersistence.ts`

### Features:
- **Auto-save**: Form data saved automatically with debouncing
- **Recovery**: Data persists across page refreshes
- **Change detection**: Tracks unsaved changes
- **Timestamp**: Tracks when data was last saved

### Direct Usage:

```typescript
import { formDataPersistence } from '../utils/formDataPersistence';

// Auto-save with debouncing (1 second default)
formDataPersistence.autoSave('student-form', formData);

// Save immediately
formDataPersistence.save('student-form', formData);

// Load saved data
const savedData = formDataPersistence.load<StudentFormData>('student-form');

// Clear saved data
formDataPersistence.clear('student-form');

// Check if data exists
const hasData = formDataPersistence.hasData('student-form');

// Get last saved timestamp
const lastSaved = formDataPersistence.getLastSaved('student-form');
```

### React Hook Usage:

```typescript
import { useFormDataPersistence } from '../utils/formDataPersistence';

function StudentForm() {
  const {
    data,
    setData,           // Auto-saves with debouncing
    save,              // Saves immediately
    clear,             // Clears saved data
    restore,           // Restores saved data
    hasUnsavedChanges, // True if data differs from initial
    lastSaved,         // Timestamp of last save
    canRestore         // True if saved data exists
  } = useFormDataPersistence<StudentFormData>(
    'student-form',
    initialFormData
  );

  const handleChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  const handleSubmit = async () => {
    await api.createStudent(data);
    clear(); // Clear saved data after successful submit
  };

  const handleRestore = () => {
    restore();
  };

  return (
    <div>
      {canRestore && (
        <button onClick={handleRestore}>
          Restore last saved data
        </button>
      )}
      <input value={data.name} onChange={e => handleChange('name', e.target.value)} />
      {hasUnsavedChanges && <p>Unsaved changes</p>}
    </div>
  );
}
```

## 3. Optimistic Updates

**File**: `src/src/utils/optimisticUpdateManager.ts`

### Features:
- **Optimistic UI**: Update UI immediately before API confirmation
- **Automatic rollback**: Revert to original data on API failure
- **State tracking**: Track which updates are in progress

### Usage:

```typescript
import { optimisticUpdateManager } from '../utils/optimisticUpdateManager';

async function updateStudent(id: string, updates: Partial<Student>) {
  const originalStudent = currentStudent;
  const optimisticStudent = { ...currentStudent, ...updates };
  
  // Start optimistic update
  optimisticUpdateManager.start(`student-${id}`, originalStudent, optimisticStudent);
  
  // Update UI immediately
  setCurrentStudent(optimisticStudent);
  
  try {
    // API call
    await api.updateStudent(id, updates);
    
    // Commit update (success)
    optimisticUpdateManager.commit(`student-${id}`);
  } catch (error) {
    // Rollback on failure
    const restored = optimisticUpdateManager.rollback(`student-${id}`);
    if (restored) {
      setCurrentStudent(restored);
    }
    throw error;
  }
}
```

## 4. Session Management

**File**: `src/src/lib/supabaseClient.ts`

### Features:
- **Extended sessions**: 7-day session timeout (default 1 hour)
- **Auto-refresh**: Automatic session refresh before expiration
- **Health checks**: Periodic session validation (every 15 minutes)
- **Graceful handling**: No redirects during health checks

### Configuration:

```typescript
// Session timeout is already set to 7 days
// Health check interval is set to 15 minutes
// Auto-refresh happens when session is about to expire
```

## 5. Service Worker (Offline Support)

**File**: `src/public/sw.js`

### Features:
- **Asset caching**: Static assets cached on install
- **API caching**: API responses cached for offline access
- **Network-first**: Try network first, fallback to cache
- **Offline responses**: Graceful handling of offline state

### Registration:

Add to your `index.html` or main entry point:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

### Cache Strategy:

- **Static files**: Cache on install, serve from cache
- **API requests**: Network first, cache on success, serve from cache offline
- **Dynamic content**: Network first, fallback to cache

## 6. Best Practices

### When to Use Caching:

✅ **Use for:**
- Lists and catalog data (students, teachers, classes)
- User preferences and settings
- Reference data that doesn't change often
- API responses for offline viewing

❌ **Don't use for:**
- Real-time data (live grades, active sessions)
- Sensitive data (passwords, tokens)
- Data that changes frequently
- Large files (images, videos)

### When to Use Form Persistence:

✅ **Use for:**
- Long forms (student enrollment, fee structure)
- Multi-step forms
- Data entry that takes significant time
- Forms users might abandon and return to

❌ **Don't use for:**
- Simple forms (login, search)
- Forms with sensitive data (passwords)
- Forms with file uploads

### When to Use Optimistic Updates:

✅ **Use for:**
- Toggle switches and checkboxes
- Simple data updates (name, status)
- Actions where feedback is critical
- User-initiated changes

❌ **Don't use for:**
- Complex multi-field updates
- Actions that have side effects
- Updates that depend on server validation

## 7. Implementation Example

Here's a complete example of a page using all persistence features:

```typescript
import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';
import { useFormDataPersistence } from '../utils/formDataPersistence';
import { optimisticUpdateManager } from '../utils/optimisticUpdateManager';

function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useFormDataPersistence<StudentForm>(
    'student-create-form',
    { name: '', email: '', class: '' }
  );

  // Load students with caching
  useEffect(() => {
    async function loadStudents() {
      // Try cache first
      const cached = cacheService.get<Student[]>('students-list');
      if (cached) {
        setStudents(cached);
        setLoading(false);
      }

      // Fetch fresh data
      const fresh = await api.getStudents();
      setStudents(fresh);
      cacheService.set('students-list', fresh, 5 * 60 * 1000); // 5 min cache
      setLoading(false);
    }

    loadStudents();
  }, []);

  const handleCreateStudent = async () => {
    const newStudent = form.data;
    
    // Optimistic update
    const originalStudents = students;
    const optimisticStudents = [...students, { ...newStudent, id: 'temp' }];
    optimisticUpdateManager.start('students-list', originalStudents, optimisticStudents);
    setStudents(optimisticStudents);

    try {
      await api.createStudent(newStudent);
      optimisticUpdateManager.commit('students-list');
      form.clear(); // Clear form on success
    } catch (error) {
      const restored = optimisticUpdateManager.rollback('students-list');
      if (restored) {
        setStudents(restored);
      }
      throw error;
    }
  };

  return (
    <div>
      {form.canRestore && (
        <button onClick={form.restore}>Restore Draft</button>
      )}
      
      <input 
        value={form.data.name}
        onChange={e => form.setData({ ...form.data, name: e.target.value })}
      />
      
      <button onClick={handleCreateStudent}>
        Create Student
      </button>
      
      {form.hasUnsavedChanges && <p>Unsaved changes</p>}
    </div>
  );
}
```

## 8. Monitoring & Debugging

### Cache Statistics:

```typescript
const stats = cacheService.getStats();
console.log('Cache Stats:', stats);
// Output: { memorySize: 15, storageSize: 20, entries: 35 }
```

### Check Active Optimistic Updates:

```typescript
import { optimisticUpdateManager } from '../utils/optimisticUpdateManager';

if (optimisticUpdateManager.isInProgress('students-list')) {
  console.log('Update in progress');
}
```

### Clear All Persistence Data:

```typescript
// Clear all caches
cacheService.clear();

// Clear all form data
formDataPersistence.clearAll();

// Clear all permanent data
cacheService.clearPermanent();
```

## Summary

This comprehensive persistence system ensures:

✅ **No data loss** on page refresh or navigation  
✅ **Fast performance** with intelligent caching  
✅ **Offline support** with service worker  
✅ **User confidence** with form auto-save  
✅ **Smooth UX** with optimistic updates  
✅ **Session reliability** with extended timeouts  

All data is backed up and recoverable, providing a robust foundation for the application.