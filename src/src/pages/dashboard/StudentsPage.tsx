import React, { useEffect, useMemo, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AddStudentForm } from '../../components/forms/AddStudentForm';
import { EditStudentForm } from '../../components/forms/EditStudentForm';
import { BulkImportStudentsForm } from '../../components/forms/BulkImportStudentsForm';
import { TransferStudentsForm } from '../../components/forms/TransferStudentsForm';
import { Checkbox } from '../../components/ui/Checkbox';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Upload, Users, GraduationCap, DollarSign, TrendingUp, Filter, Download, X, ArrowRightLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
export function StudentsPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('USD');
  // Modal States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  // Bulk selection / transfer
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTransfer, setShowTransfer] = useState(false);
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  useEffect(() => {
    if (user?.school_id) {
      fetchStudents();
    }
  }, [user?.school_id]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetch school currency
      const {
        data: schoolData
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      setCurrencyCode(schoolData?.currency_code || 'USD');
      const {
        data,
        error
      } = await supabase.from('students').select(`
          *,
          classes (
            id,
            name
          )
        `).eq('school_id', user?.school_id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const {
        error
      } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(students.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student');
    }
  };
  // --- Derived Data & Stats ---
  const uniqueClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.classes?.name).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === 'all' || student.classes?.name === selectedClass;
      const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
      let matchesStatus = true;
      if (selectedStatus === 'paid') matchesStatus = student.remaining <= 0;
      if (selectedStatus === 'partial') matchesStatus = student.total_paid > 0 && student.remaining > 0;
      if (selectedStatus === 'unpaid') matchesStatus = student.total_paid === 0;
      return matchesSearch && matchesClass && matchesGender && matchesStatus;
    });
  }, [students, searchQuery, selectedClass, selectedGender, selectedStatus]);
  const stats = useMemo(() => {
    const total = students.length;
    const paid = students.filter(s => s.remaining <= 0).length;
    const outstanding = students.reduce((acc, s) => acc + (Number(s.remaining) || 0), 0);
    const totalRevenue = students.reduce((acc, s) => acc + (Number(s.total_paid) || 0), 0);
    return {
      total,
      paid,
      outstanding,
      totalRevenue
    };
  }, [students]);
  // --- Chart Data Preparation ---
  const classDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const className = s.classes?.name || 'Unassigned';
      counts[className] = (counts[className] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10 classes
  }, [students]);
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {
      Male: 0,
      Female: 0,
      Other: 0
    };
    students.forEach(s => {
      if (s.gender === 'male') counts.Male++;else if (s.gender === 'female') counts.Female++;else counts.Other++;
    });
    return Object.entries(counts).filter(([_, value]) => value > 0).map(([name, value]) => ({
      name,
      value
    }));
  }, [students]);
  const paymentStatusData = useMemo(() => {
    let paid = 0,
      partial = 0,
      unpaid = 0;
    students.forEach(s => {
      if (s.remaining <= 0) paid++;else if (s.total_paid > 0) partial++;else unpaid++;
    });
    return [{
      name: 'Fully Paid',
      value: paid
    }, {
      name: 'Partial',
      value: partial
    }, {
      name: 'Unpaid',
      value: unpaid
    }].filter(d => d.value > 0);
  }, [students]);
  const ageData = useMemo(() => {
    const ranges = {
      '< 12': 0,
      '12-14': 0,
      '15-17': 0,
      '18+': 0
    };
    students.forEach(s => {
      if (!s.date_of_birth) return;
      const age = new Date().getFullYear() - new Date(s.date_of_birth).getFullYear();
      if (age < 12) ranges['< 12']++;else if (age <= 14) ranges['12-14']++;else if (age <= 17) ranges['15-17']++;else ranges['18+']++;
    });
    return Object.entries(ranges).map(([name, value]) => ({
      name,
      value
    }));
  }, [students]);
  // --- Bulk selection helpers ---
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredStudents.forEach(s => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      filteredStudents.forEach(s => next.add(s.id));
      return next;
    });
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const columns = [{
    header: '',
    accessor: 'select' as const,
    className: 'w-12',
    render: (row: any) => <Checkbox checked={selectedIds.has(row.id)} onChange={() => toggleSelectOne(row.id)} />
  }, {
    header: 'Student Info',
    accessor: 'full_name' as const,
    render: (row: any) => <div>
          <div className="font-medium text-slate-900">{row.full_name}</div>
          <div className="text-xs text-slate-500 font-mono">
            {row.admission_number || 'No ID'}
          </div>
        </div>
  }, {
    header: 'Class',
    accessor: 'classes' as const,
    render: (row: any) => <Badge variant="secondary">{row.classes?.name || 'Unassigned'}</Badge>
  }, {
    header: 'Gender',
    accessor: 'gender' as const,
    render: (row: any) => <span className="capitalize text-slate-600">{row.gender}</span>
  }, {
    header: 'Status',
    accessor: 'remaining' as const,
    render: (row: any) => {
      const isPaid = row.remaining <= 0;
      const isPartial = row.total_paid > 0 && row.remaining > 0;
      return <Badge variant={isPaid ? 'success' : isPartial ? 'warning' : 'secondary'}>
            {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
          </Badge>;
    }
  }, {
    header: 'Balance',
    accessor: 'remaining' as const,
    render: (row: any) => <span className={`font-medium ${row.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(Number(row.remaining))}
        </span>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/dashboard/students/${row.id}`)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => {
        setEditingStudentId(row.id);
        setShowEditForm(true);
      }} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">
            Manage enrollments, profiles, and performance.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && <Button variant="secondary" onClick={() => setShowTransfer(true)} leftIcon={<ArrowRightLeft className="w-4 h-4" />}>
            Move {selectedIds.size} to Class
          </Button>}
          <Button variant="secondary" onClick={() => setShowBulkImport(true)} leftIcon={<Upload className="w-4 h-4" />}>
            Bulk Import
          </Button>
          <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Student
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Students" value={stats.total.toLocaleString()} icon={Users} color="blue" trend={{
        value: 'Active',
        direction: 'neutral'
      }} />
        <MetricCard title="Fully Paid" value={stats.paid.toLocaleString()} icon={GraduationCap} color="green" trend={{
        value: `${Math.round(stats.paid / (stats.total || 1) * 100)}%`,
        direction: 'up'
      }} />
        <MetricCard title="Outstanding Fees" value={formatCurrency(stats.outstanding)} icon={DollarSign} color="amber" trend={{
        value: 'Pending',
        direction: 'down'
      }} />
        <MetricCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="purple" trend={{
        value: 'Collected',
        direction: 'up'
      }} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Enrollment by Class" className="min-h-[350px]">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistributionData} layout="vertical" margin={{
              left: 20
            }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{
                fontSize: 12
              }} />
                <Tooltip cursor={{
                fill: '#f1f5f9'
              }} contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card title="Gender Distribution">
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Payment Status">
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value">
                    {paymentStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Fully Paid' ? '#10b981' : entry.name === 'Partial' ? '#f59e0b' : '#ef4444'} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters & Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by name or admission number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-40 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Classes</option>
                {uniqueClasses.map(c => <option key={c} value={c}>
                    {c}
                  </option>)}
              </select>

              <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="w-36 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-36 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>

              {(searchQuery || selectedClass !== 'all' || selectedGender !== 'all' || selectedStatus !== 'all') && <Button variant="secondary" onClick={() => {
              setSearchQuery('');
              setSelectedClass('all');
              setSelectedGender('all');
              setSelectedStatus('all');
            }} leftIcon={<X className="w-4 h-4" />}>
                  Clear
                </Button>}
            </div>
          </div>
        </div>

        {filteredStudents.length > 0 ? <div className="p-0">
            <div className="px-4 py-2 border-b border-slate-200 bg-white">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer w-fit">
                <Checkbox checked={allFilteredSelected} onChange={toggleSelectAll} />
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
              </label>
            </div>
            <Table data={filteredStudents} columns={columns} />
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
              <span>
                Showing {filteredStudents.length} of {students.length} students
              </span>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-3 h-3" />}>
                Export CSV
              </Button>
            </div>
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Students Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Try adjusting your filters or search query to find what you're
              looking for.
            </p>
            <Button variant="secondary" onClick={() => {
          setSearchQuery('');
          setSelectedClass('all');
          setSelectedGender('all');
          setSelectedStatus('all');
        }}>
              Clear Filters
            </Button>
          </div>}
      </Card>

      <AddStudentForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchStudents} />

      {editingStudentId && <EditStudentForm isOpen={showEditForm} onClose={() => {
      setShowEditForm(false);
      setEditingStudentId(null);
    }} onSuccess={fetchStudents} studentId={editingStudentId} />}

      <BulkImportStudentsForm isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} onSuccess={fetchStudents} />

      <TransferStudentsForm isOpen={showTransfer} onClose={() => setShowTransfer(false)} onSuccess={() => {
      setSelectedIds(new Set());
      fetchStudents();
    }} studentIds={Array.from(selectedIds)} />
    </div>;
}