# Code Templates & Patterns for Continuation

This guide shows exact patterns to follow when creating additional pages, services, and modals.

---

## 🔷 Service Pattern (Copy This)

All services follow this exact structure:

```typescript
// src/services/myService.ts
import { supabase } from './supabaseClient';

export interface MyItem {
  id: string;
  school_id: string;
  name: string;
  // ... other fields
  created_at: string;
  updated_at: string;
}

export interface MyItemFilter {
  searchQuery?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MyItemStats {
  total: number;
  active: number;
  inactive: number;
  // ... other stats
}

class MyItemService {
  // 1. Get all items with filters
  async getItems(schoolId: string, filters: MyItemFilter = {}) {
    let query = supabase
      .from('my_items')
      .select('*', { count: 'exact' })
      .eq('school_id', schoolId);

    // Apply filters
    if (filters.searchQuery) {
      query = query.ilike('name', `%${filters.searchQuery}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      items: data || [],
      total: count || 0,
      page,
      pageSize
    };
  }

  // 2. Get by ID
  async getItemById(itemId: string): Promise<MyItem> {
    const { data, error } = await supabase
      .from('my_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item not found');
    return data;
  }

  // 3. Create
  async createItem(schoolId: string, data: Partial<MyItem>): Promise<MyItem> {
    const { data: newItem, error } = await supabase
      .from('my_items')
      .insert([{
        ...data,
        school_id: schoolId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    if (!newItem) throw new Error('Failed to create');

    // Audit log
    await this.createAuditLog(schoolId, 'ITEM_CREATED', 'item', newItem.id, data);
    return newItem;
  }

  // 4. Update
  async updateItem(itemId: string, schoolId: string, updates: Partial<MyItem>): Promise<MyItem> {
    const { data, error } = await supabase
      .from('my_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update');

    await this.createAuditLog(schoolId, 'ITEM_UPDATED', 'item', itemId, updates);
    return data;
  }

  // 5. Delete
  async deleteItem(itemId: string, schoolId: string): Promise<void> {
    const { error } = await supabase
      .from('my_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    await this.createAuditLog(schoolId, 'ITEM_DELETED', 'item', itemId, { itemId });
  }

  // 6. Get statistics
  async getStats(schoolId: string): Promise<MyItemStats> {
    const { data, error } = await supabase
      .from('my_items')
      .select('status')
      .eq('school_id', schoolId);

    if (error) throw error;

    return {
      total: data?.length || 0,
      active: data?.filter(item => item.status === 'active').length || 0,
      inactive: data?.filter(item => item.status === 'inactive').length || 0
    };
  }

  // 7. Audit logging helper
  private async createAuditLog(schoolId: string, action: string, entityType: string, entityId: string, details: any) {
    try {
      await supabase.from('audit_logs').insert([{
        school_id: schoolId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const myItemService = new MyItemService();
```

---

## 🔷 Page Pattern (Copy This)

All admin pages follow this structure:

```typescript
// src/pages/dashboard/MyItemsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { myItemService, MyItem, MyItemFilter } from '../../services/myItemService';
import { MetricCard } from '../../components/dashboard/MetricCard';

export function MyItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.school_id) {
      fetchItems();
      fetchStats();
    }
  }, [user?.school_id]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await myItemService.getItems(user?.school_id!, {
        searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setItems(result.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const itemStats = await myItemService.getStats(user?.school_id!);
      setStats(itemStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleDelete = async (item: MyItem) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await myItemService.deleteItem(item.id, user?.school_id!);
      setItems(items.filter(i => i.id !== item.id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Items</h1>
          <p className="text-slate-500 mt-1">Manage all items</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchItems} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Add Item
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Total" value={stats.total} icon={Plus} color="blue" />
          <MetricCard title="Active" value={stats.active} icon={Plus} color="green" />
          <MetricCard title="Inactive" value={stats.inactive} icon={Plus} color="yellow" />
        </div>
      )}

      {/* Search & Filter */}
      <Card className="p-4 bg-slate-50">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {items.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4"><Badge variant="success">{item.status}</Badge></td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />}>View</Button>
                    <Button size="sm" variant="primary" leftIcon={<Edit className="w-4 h-4" />}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item)} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">No items found</div>
        )}
      </Card>
    </div>
  );
}
```

---

## 🔷 Modal Pattern (Copy This)

All modals follow this structure:

```typescript
// src/components/forms/AddMyItemModal.tsx
import React, { useState } from 'react';
import { Dialog } from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Alert } from '../../ui/Alert';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

interface AddMyItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export function AddMyItemModal({ isOpen, onClose, onSuccess }: AddMyItemModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }

      // Insert
      const { error: insertError } = await supabase
        .from('my_items')
        .insert([{
          ...formData,
          school_id: user?.school_id,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      // Success
      onSuccess?.();
      onClose();
      setFormData({ name: '', description: '', status: 'active' });
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add New Item" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}

        <Input
          label="Name"
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter name"
        />

        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          isTextarea
          rows={3}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={loading} disabled={loading || !formData.name.trim()}>
            Add Item
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
```

---

## 🔷 Service Integration in Page

```typescript
// How to use the modal in your page
import { AddMyItemModal } from '../../components/forms/AddMyItemModal';

export function MyItemsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSuccess = () => {
    fetchItems(); // Refresh list
  };

  return (
    <>
      {/* Page content */}
      <Button onClick={() => setShowAddModal(true)}>Add Item</Button>

      {/* Modal */}
      <AddMyItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

---

## 📋 Checklist for Adding New Entity

When adding a new entity (e.g., "Classes"):

1. **Create Service** (`classService.ts`)
   - [ ] Export interface for ClassFilter
   - [ ] Export interface for ClassStats
   - [ ] Implement getClasses()
   - [ ] Implement getClassById()
   - [ ] Implement createClass()
   - [ ] Implement updateClass()
   - [ ] Implement deleteClass()
   - [ ] Implement getStats()
   - [ ] Add audit logging to all methods

2. **Create Page** (`ClassesPage.tsx`)
   - [ ] Add header with title & buttons
   - [ ] Show stats cards
   - [ ] Add search input
   - [ ] Add status filter
   - [ ] Create table with data
   - [ ] Add edit/delete/view buttons
   - [ ] Show error states
   - [ ] Show loading states
   - [ ] Show empty states

3. **Create Modals** (`AddClassModal.tsx`, `EditClassModal.tsx`)
   - [ ] Create form fields
   - [ ] Add validation
   - [ ] Integrate service
   - [ ] Handle loading/error states
   - [ ] Call onSuccess on completion

4. **Integrate into Page**
   - [ ] Import modals
   - [ ] Add state for show/hide
   - [ ] Add onClick handlers
   - [ ] Pass onSuccess callback
   - [ ] Test locally

---

## 🎯 Quick Commands

```bash
# Start dev server
npm run dev

# Check types
npm run type-check

# Format code
npm run format

# Run linter
npm run lint:fix

# Build for production
npm run build

# Run tests
npm run test
```

---

## 📦 Import Patterns

```typescript
// Services
import { studentService } from '../../services/studentService';
import { teacherService } from '../../services/teacherService';

// UI Components
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

// Common
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';

// Auth
import { useAuth } from '../../hooks/useAuth';

// Icons (from lucide-react)
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
```

---

## ✅ Ready to Build More!

Using these exact patterns, you can quickly add:
- More services for other entities
- More pages for admin interface
- More modals for CRUD operations
- Complete the entire admin dashboard

Each new item takes ~30-60 minutes following these patterns!

