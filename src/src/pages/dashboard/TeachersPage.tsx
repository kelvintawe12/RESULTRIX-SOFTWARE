import React, { useEffect, useMemo, useState, memo } from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AddTeacherForm } from '../../components/forms/AddTeacherForm';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Search, Trash2, Mail, Phone, Users, BookOpen, Briefcase, Award, Filter, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
export function TeachersPage() {
  const {
    user
  } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch teachers
      const {
        data: teachersData,
        error: teachersError
      } = await supabase.from('users').select('*').eq('school_id', user?.school_id).eq('role', 'teacher').order('created_at', {
        ascending: false
      });
      if (teachersError) throw teachersError;
      // Fetch assignments to link subjects
      const {
        data: assignmentsData,
        error: assignmentsError
      } = await supabase.from('teacher_assignments').select(`
          teacher_id,
          subjects (name),
          classes (name)
        `);
      // We can't easily filter by school_id on join in Supabase JS client sometimes without inner join
      // But since teachers are filtered by school, we can filter assignments in memory or rely on RLS
      if (assignmentsError) throw assignmentsError;
      setTeachers(teachersData || []);
      setAssignments(assignmentsData || []);
    } catch (err: any) {
      setError('Failed to fetch teachers data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will remove the teacher account.')) return;
    try {
      const {
        error
      } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      alert('Failed to delete teacher');
    }
  };
  // --- Derived Data ---
  const teachersWithDetails = useMemo(() => {
    return teachers.map(teacher => {
      const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.id);
      const subjects = Array.from(new Set(teacherAssignments.map(a => a.subjects?.name).filter(Boolean)));
      const classes = Array.from(new Set(teacherAssignments.map(a => a.classes?.name).filter(Boolean)));
      return {
        ...teacher,
        subjects,
        classes,
        assignmentCount: teacherAssignments.length
      };
    });
  }, [teachers, assignments]);
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    assignments.forEach(a => {
      if (a.subjects?.name) subjects.add(a.subjects.name);
    });
    return Array.from(subjects).sort();
  }, [assignments]);
  const filteredTeachers = useMemo(() => {
    return teachersWithDetails.filter(t => {
      const matchesSearch = t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || t.subjects.includes(selectedSubject);
      return matchesSearch && matchesSubject;
    });
  }, [teachersWithDetails, searchQuery, selectedSubject]);
  // --- Stats & Charts ---
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachersWithDetails.filter(t => t.assignmentCount > 0).length;
    const totalAssignments = assignments.length;
    const avgLoad = total > 0 ? (totalAssignments / total).toFixed(1) : '0';
    return {
      total,
      active,
      totalAssignments,
      avgLoad
    };
  }, [teachers, teachersWithDetails, assignments]);
  const subjectDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    assignments.forEach(a => {
      const subject = a.subjects?.name || 'Unknown';
      counts[subject] = (counts[subject] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [assignments]);
  const workloadData = useMemo(() => {
    return teachersWithDetails.map(t => ({
      name: t.full_name.split(' ')[0],
      value: t.assignmentCount
    })) // First name only for chart brevity
    .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [teachersWithDetails]);
  const columns = [{
    header: 'Teacher',
    accessor: 'full_name' as const,
    render: (row: any) => <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {row.full_name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {row.email}
            </div>
          </div>
        </div>
  }, {
    header: 'Subjects',
    accessor: 'subjects' as const,
    render: (row: any) => <div className="flex flex-wrap gap-1">
          {row.subjects.length > 0 ? row.subjects.slice(0, 2).map((s: string) => <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {s}
              </span>) : <span className="text-slate-400 text-xs italic">No subjects</span>}
          {row.subjects.length > 2 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
              +{row.subjects.length - 2}
            </span>}
        </div>
  }, {
    header: 'Classes',
    accessor: 'classes' as const,
    render: (row: any) => <span className="text-sm text-slate-600">
          {row.classes.length > 0 ? `${row.classes.length} classes` : '-'}
        </span>
  }, {
    header: 'Joined',
    accessor: 'created_at' as const,
    render: (row: any) => new Date(row.created_at).toLocaleDateString()
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
          Remove
        </Button>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage staff and assignments</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Teacher
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Teachers" value={stats.total.toString()} icon={Users} color="indigo" trend={{
        value: 'Staff',
        direction: 'neutral'
      }} />
        <MetricCard title="Active Assignments" value={stats.totalAssignments.toString()} icon={BookOpen} color="blue" trend={{
        value: 'Classes',
        direction: 'up'
      }} />
        <MetricCard title="Avg. Class Load" value={stats.avgLoad} icon={Briefcase} color="amber" trend={{
        value: 'Per Teacher',
        direction: 'neutral'
      }} />
        <MetricCard title="Departments" value={uniqueSubjects.length.toString()} icon={Award} color="green" trend={{
        value: 'Active',
        direction: 'neutral'
      }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Assignments by Subject">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectDistributionData} layout="vertical" margin={{
              left: 40,
              right: 20
            }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{
                fontSize: 12
              }} />
                <Tooltip cursor={{
                fill: '#f1f5f9'
              }} contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Teacher Workload (Top 10)">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{
              top: 20
            }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{
                fontSize: 12
              }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{
                fill: '#f1f5f9'
              }} contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30}>
                  {workloadData.map((entry, index) => <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#93c5fd'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search teachers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} options={[{
              value: 'all',
              label: 'All Subjects'
            }, ...uniqueSubjects.map(s => ({
              value: s,
              label: s
            }))]} className="w-48" />
              {(searchQuery || selectedSubject !== 'all') && <Button variant="secondary" onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
            }} leftIcon={<X className="w-4 h-4" />}>
                  Clear
                </Button>}
            </div>
          </div>
        </div>

        {filteredTeachers.length > 0 ? <Table data={filteredTeachers} columns={columns} /> : <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No teachers found matching your filters</p>
          </div>}
      </Card>

      <AddTeacherForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchData} />
    </div>;
}