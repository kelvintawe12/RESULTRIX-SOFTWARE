import React, { useEffect, useMemo, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Layers, Users, BarChart3, GraduationCap, X } from 'lucide-react';

interface ClassRow {
  id: string;
  name: string;
  description?: string;
  studentCount: number;
  teachers: string[];
}

export function ClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create / edit dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.school_id) fetchClasses();
  }, [user?.school_id]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesRes, studentsRes, assignmentsRes] = await Promise.all([
        supabase.from('classes').select('id, name, description').eq('school_id', user?.school_id).order('name'),
        supabase.from('students').select('class_id').eq('school_id', user?.school_id),
        supabase.from('teacher_assignments').select('class_id, teachers!inner(full_name)')
      ]);
      if (classesRes.error) throw classesRes.error;

      // Aggregate student counts per class in JS (avoids N+1 count queries).
      const counts: Record<string, number> = {};
      (studentsRes.data || []).forEach((s: any) => {
        if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      });

      // Aggregate distinct teacher names per class.
      const teacherMap: Record<string, Set<string>> = {};
      (assignmentsRes.data || []).forEach((a: any) => {
        const name = a.teachers?.full_name;
        if (!a.class_id || !name) return;
        (teacherMap[a.class_id] ||= new Set()).add(name);
      });

      const rows: ClassRow[] = (classesRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        studentCount: counts[c.id] || 0,
        teachers: Array.from(teacherMap[c.id] || [])
      }));
      setClasses(rows);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (row: ClassRow) => {
    setEditingId(row.id);
    setFormData({ name: row.name, description: row.description || '' });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFormError(null);
      if (!formData.name.trim()) throw new Error('Class name is required.');

      if (editingId) {
        const { error } = await supabase
          .from('classes')
          .update({ name: formData.name.trim(), description: formData.description.trim() || null })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classes').insert({
          school_id: user?.school_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null
        });
        if (error) throw error;
      }
      setShowForm(false);
      await fetchClasses();
    } catch (err: any) {
      console.error('Error saving class:', err);
      setFormError(err.message || 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ClassRow) => {
    if (row.studentCount > 0) {
      alert(
        `Cannot delete "${row.name}" — it still has ${row.studentCount} student(s). Move or promote them first.`
      );
      return;
    }
    if (!confirm(`Delete class "${row.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', row.id);
      if (error) throw error;
      setClasses(prev => prev.filter(c => c.id !== row.id));
    } catch (err: any) {
      console.error('Error deleting class:', err);
      alert('Failed to delete class.');
    }
  };

  const filtered = useMemo(
    () =>
      classes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [classes, searchQuery]
  );

  const stats = useMemo(() => {
    const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
    const largest = classes.reduce(
      (max, c) => (c.studentCount > max.studentCount ? c : max),
      { name: '—', studentCount: 0 } as ClassRow
    );
    return {
      totalClasses: classes.length,
      totalStudents,
      avgSize: classes.length ? Math.round(totalStudents / classes.length) : 0,
      largest
    };
  }, [classes]);

  const columns = [
    {
      header: 'Class',
      accessor: 'name',
      render: (row: ClassRow) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          {row.description && <div className="text-xs text-slate-500">{row.description}</div>}
        </div>
      )
    },
    {
      header: 'Students',
      accessor: 'studentCount',
      render: (row: ClassRow) => <Badge variant="secondary">{row.studentCount}</Badge>
    },
    {
      header: 'Class Teacher(s)',
      accessor: 'teachers',
      render: (row: ClassRow) =>
        row.teachers.length ? (
          <div className="flex flex-wrap gap-1">
            {row.teachers.map(t => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">Unassigned</span>
        )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row: ClassRow) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/dashboard/classes/${row.id}`)} leftIcon={<Eye className="w-4 h-4" />}>
            Roster
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 mt-1">Manage classes, view rosters, and track enrollment.</p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Add Class
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Classes" value={stats.totalClasses.toLocaleString()} icon={Layers} color="blue" />
        <MetricCard title="Total Students" value={stats.totalStudents.toLocaleString()} icon={Users} color="green" />
        <MetricCard title="Avg Class Size" value={stats.avgSize.toLocaleString()} icon={BarChart3} color="purple" />
        <MetricCard
          title="Largest Class"
          value={stats.largest.studentCount ? `${stats.largest.name} (${stats.largest.studentCount})` : '—'}
          icon={GraduationCap}
          color="amber"
        />
      </div>

      {/* Search + Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <Table data={filtered} columns={columns} />
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Classes Found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? 'Try a different search.' : 'Create your first class to start organizing students.'}
            </p>
            {searchQuery ? (
              <Button variant="secondary" onClick={() => setSearchQuery('')} leftIcon={<X className="w-4 h-4" />}>
                Clear Search
              </Button>
            ) : (
              <Button variant="primary" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
                Add Class
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Class' : 'Add New Class'} size="sm">
        <div className="space-y-4">
          {formError && <Alert variant="error" title="Error" message={formError} />}
          <Input
            label="Class Name"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Grade 5A"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving} disabled={!formData.name.trim()}>
              {editingId ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
