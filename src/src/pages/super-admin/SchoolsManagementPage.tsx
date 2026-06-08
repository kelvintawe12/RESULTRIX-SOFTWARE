import React, { useEffect, useState, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Trash2, Eye, RefreshCw, Search, Filter, Building2, Users, GraduationCap, DollarSign, Calendar, MapPin, CheckCircle, XCircle, Edit, MoreVertical, Download, LayoutGrid, List as ListIcon, ArrowUpDown, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { AddSchoolForm } from '../../components/forms/AddSchoolForm';
import { EditSchoolForm } from '../../components/forms/EditSchoolForm';
import { Dialog } from '../../components/ui/Dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, BarChart, Bar, Legend, LineChart } from 'recharts';
interface School {
  id: string;
  name: string;
  address: string;
  logo_path: string | null;
  currency_code: string;
  grading_scale: string;
  default_exam_out_of: number;
  approved: boolean;
  created_at: string;
  updated_at: string;
  student_count?: number;
  teacher_count?: number;
  admin_count?: number;
}
export function SchoolsManagementPage() {
    const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('bar');
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalStudents: 0,
    totalTeachers: 0
  });
  const navigate = useNavigate();
  useEffect(() => {
    fetchSchools();
  }, []);
  useEffect(() => {
    let result = schools;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query) || s.address?.toLowerCase().includes(query) || s.currency_code?.toLowerCase().includes(query));
    }
    if (statusFilter !== 'all') {
      const isApproved = statusFilter === 'active';
      result = result.filter(s => s.approved === isApproved);
    }
    
    // Sorting
    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredSchools(result);
  }, [schools, searchQuery, statusFilter, sortConfig]);
  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch schools with counts
      const {
        data: schoolsData,
        error: schoolsError
      } = await supabase.from('schools').select('*').order('created_at', {
        ascending: false
      });
      if (schoolsError) throw schoolsError;
      // Fetch counts for each school
      const schoolsWithCounts = await Promise.all((schoolsData || []).map(async school => {
        const [studentCount, teacherCount, adminCount] = await Promise.all([supabase.from('students').select('id', {
          count: 'exact',
          head: true
        }).eq('school_id', school.id).then(res => res.count || 0), supabase.from('users').select('id', {
          count: 'exact',
          head: true
        }).eq('school_id', school.id).eq('role', 'teacher').then(res => res.count || 0), supabase.from('users').select('id', {
          count: 'exact',
          head: true
        }).eq('school_id', school.id).eq('role', 'school_admin').then(res => res.count || 0)]);
        return {
          ...school,
          student_count: studentCount,
          teacher_count: teacherCount,
          admin_count: adminCount
        };
      }));
      setSchools(schoolsWithCounts);
      setFilteredSchools(schoolsWithCounts);
      // Calculate stats
      const totalStudents = schoolsWithCounts.reduce((acc, curr) => acc + (curr.student_count || 0), 0);
      const totalTeachers = schoolsWithCounts.reduce((acc, curr) => acc + (curr.teacher_count || 0), 0);

      setStats({
        total: schoolsWithCounts.length,
        active: schoolsWithCounts.filter(s => s.approved).length,
        pending: schoolsWithCounts.filter(s => !s.approved).length,
        totalStudents,
        totalTeachers
      });
    } catch (err: any) {
      setError('Failed to fetch schools');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const sorted = [...schools].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const data: { name: string; total: number }[] = [];
    let count = 0;
    
    const grouped = sorted.reduce((acc, school) => {
      const date = new Date(school.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(grouped).forEach(([key, value]) => {
      count += value;
      data.push({ name: key, total: count });
    });
    
    return data.length > 0 ? data : [{ name: 'Start', total: 0 }];
  }, [schools]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Address', 'Status', 'Students', 'Teachers', 'Admins', 'Currency', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredSchools.map(school => [
        `"${school.name}"`,
        `"${school.address || ''}"`,
        school.approved ? 'Active' : 'Pending',
        school.student_count || 0,
        school.teacher_count || 0,
        school.admin_count || 0,
        school.currency_code,
        new Date(school.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schools_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected = filteredSchools.length > 0 && filteredSchools.every(s => selectedIds.has(s.id));

  const toggleAll = () => {
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      filteredSchools.forEach(s => newSelected.delete(s.id));
    } else {
      filteredSchools.forEach(s => newSelected.add(s.id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} schools? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('schools').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      fetchSchools();
    } catch (err: any) {
      alert('Failed to delete schools: ' + err.message);
    }
  };

  const handleBulkApprove = async (status: boolean) => {
    try {
      const { error } = await supabase.from('schools').update({ approved: status }).in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      fetchSchools();
    } catch (err: any) {
      alert('Failed to update schools: ' + err.message);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setShowEditForm(true);
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone and will delete all associated data including students, teachers, and records.`)) return;
    try {
      const {
        error
      } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
      fetchSchools();
    } catch (err: any) {
      console.error('Error deleting school:', err);
      alert('Failed to delete school: ' + err.message);
    }
  };
  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      const {
        error
      } = await supabase.from('schools').update({
        approved: !currentStatus
      }).eq('id', id);
      if (error) throw error;
      fetchSchools();
    } catch (err: any) {
      console.error('Error updating school status:', err);
      alert('Failed to update school status: ' + err.message);
    }
  };
  const handleSuccess = () => {
    fetchSchools();
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Schools Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all schools registered on the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={fetchSchools} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add School
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Error" description={error} action={<Button size="sm" variant="secondary" onClick={fetchSchools}>
              Retry
            </Button>} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Schools
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Students
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalStudents.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Active Schools
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.active}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Pending Approval
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.pending}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Platform Growth Chart with Type Switcher, Legend, Export */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Platform Growth</h3>
            <p className="text-sm text-slate-500">Cumulative schools registration over time</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <select
              className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none transition-colors duration-150 hover:border-blue-400 hover:bg-blue-50"
              value={chartType}
              onChange={e => setChartType(e.target.value as 'area' | 'bar' | 'line')}
            >
              <option value="area">Area</option>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
            <Button 
              variant="secondary" 
              size="sm" 
              className="transition-colors duration-150 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700" 
              onClick={() => {
                const chartEl = document.getElementById('platform-growth-chart');
                if (!chartEl) return;
                import('html2canvas').then(html2canvas => {
                  html2canvas.default(chartEl).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `platform_growth_chart_${new Date().toISOString().split('T')[0]}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  });
                });
              }} 
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
          </div>
        </div>
        <div className="w-full h-[180px] sm:h-[300px] md:h-[350px] lg:h-[400px]" id="platform-growth-chart">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 40 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={12} interval={0} minTickGap={16} label={{ value: 'Month', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 14 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} allowDecimals={false} label={{ value: 'Total Schools', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow border border-slate-200 text-xs md:text-sm">
                          <div className="text-xs text-slate-500 mb-1">Month: <span className="font-semibold text-slate-700">{label}</span></div>
                          <div className="font-bold text-blue-600">Total Schools: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#growthGradient)" dot={{ r: 3, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                <Legend verticalAlign="top" height={36} formatter={() => <span className="text-slate-700 font-medium">Total Schools</span>} />
              </AreaChart>
            )}
            {chartType === 'bar' && (
              <BarChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={12} interval={0} minTickGap={16} label={{ value: 'Month', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 14 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} allowDecimals={false} label={{ value: 'Total Schools', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow border border-slate-200 text-xs md:text-sm">
                          <div className="text-xs text-slate-500 mb-1">Month: <span className="font-semibold text-slate-700">{label}</span></div>
                          <div className="font-bold text-blue-600">Total Schools: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Legend verticalAlign="top" height={36} formatter={() => <span className="text-slate-700 font-medium">Total Schools</span>} />
              </BarChart>
            )}
            {chartType === 'line' && (
              <LineChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={12} interval={0} minTickGap={16} label={{ value: 'Month', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 14 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} allowDecimals={false} label={{ value: 'Total Schools', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow border border-slate-200 text-xs md:text-sm">
                          <div className="text-xs text-slate-500 mb-1">Month: <span className="font-semibold text-slate-700">{label}</span></div>
                          <div className="font-bold text-blue-600">Total Schools: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                <Legend verticalAlign="top" height={36} formatter={() => <span className="text-slate-700 font-medium">Total Schools</span>} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search schools by name, address, currency..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-slate-500" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[100px]">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-900">{selectedIds.size} selected</span>
            <span className="text-sm text-indigo-600">({filteredSchools.length} total in view)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => handleBulkApprove(true)}>Approve Selected</Button>
            <Button variant="warning" size="sm" onClick={() => handleBulkApprove(false)}>Suspend Selected</Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Schools Table */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredSchools.length > 0 ? (
          <div>
            {viewMode === 'grid' && <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Select All</span>
              </div>
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{filteredSchools.length}</span> of <span className="font-semibold text-slate-900">{schools.length}</span> school{schools.length !== 1 ? 's' : ''}
              </p>
            </div>}
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchools.map(school => (
                  <Card key={school.id} className={`p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow relative ${selectedIds.has(school.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
                    <div className="absolute top-4 right-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(school.id)}
                        onChange={() => toggleSelection(school.id)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow">
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">{school.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {school.address || 'No address'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mb-3">
                      <Badge variant={school.approved ? 'success' : 'warning'} className="flex items-center gap-1">
                        {school.approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {school.approved ? 'Active' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-slate-500">{new Date(school.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-base font-bold text-blue-900">{school.student_count || 0}</div>
                        <div className="text-xs text-blue-600">Students</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <GraduationCap className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <div className="text-base font-bold text-green-900">{school.teacher_count || 0}</div>
                        <div className="text-xs text-green-600">Teachers</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <div className="text-base font-bold text-purple-900">{school.admin_count || 0}</div>
                        <div className="text-xs text-purple-600">Admins</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => setSelectedSchool(school)}>
                        View
                      </Button>
                      <Button size="sm" variant="primary" leftIcon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(school)}>
                        Edit
                      </Button>
                      <Button size="sm" variant={school.approved ? 'warning' : 'primary'} onClick={() => handleApprove(school.id, school.approved)}>
                        {school.approved ? 'Suspend' : 'Approve'}
                      </Button>
                      <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(school.id, school.name)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 w-12">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">School <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('student_count')}>
                        <div className="flex items-center gap-1">Stats <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('approved')}>
                        <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1">Created <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchools.map(school => (
                      <tr key={school.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(school.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.has(school.id)} onChange={() => toggleSelection(school.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                              {school.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{school.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {school.address || 'No address'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium">{school.student_count || 0}</span>
                              <span className="text-slate-500">students</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <GraduationCap className="w-3.5 h-3.5 text-green-500" />
                              <span className="font-medium">{school.teacher_count || 0}</span>
                              <span className="text-slate-500">teachers</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              {school.currency_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={school.approved ? 'success' : 'warning'} className="flex items-center gap-1 w-fit">
                            {school.approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {school.approved ? 'Active' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-slate-700">
                              {new Date(school.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(school.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedSchool(school)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="primary" onClick={() => handleEdit(school)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <div className="relative group">
                              <Button size="sm" variant="secondary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 hidden group-hover:block z-10">
                                <button 
                                  onClick={() => handleApprove(school.id, school.approved)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${school.approved ? 'text-amber-600' : 'text-green-600'}`}
                                >
                                  {school.approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                  {school.approved ? 'Suspend School' : 'Approve School'}
                                </button>
                                <button 
                                  onClick={() => handleDelete(school.id, school.name)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete School
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Schools Found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by adding your first school to the platform.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Add Your First School
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add School Modal */}
      <AddSchoolForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={handleSuccess} />

      {/* Edit School Modal */}
      {editingSchool && <EditSchoolForm isOpen={showEditForm} onClose={() => {
      setShowEditForm(false);
      setEditingSchool(null);
    }} onSuccess={handleSuccess} school={editingSchool} />}

      {/* View School Modal */}
      <Dialog isOpen={!!selectedSchool} onClose={() => setSelectedSchool(null)} title="School Details" size="lg">
        {selectedSchool && <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedSchool.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedSchool.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedSchool.address || 'No address provided'}
                  </p>
                </div>
              </div>
              <Badge variant={selectedSchool.approved ? 'success' : 'warning'} className="flex items-center gap-1">
                {selectedSchool.approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {selectedSchool.approved ? 'Active' : 'Pending'}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">
                  {selectedSchool.student_count || 0}
                </p>
                <p className="text-xs text-blue-600 font-medium">Students</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <GraduationCap className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">
                  {selectedSchool.teacher_count || 0}
                </p>
                <p className="text-xs text-green-600 font-medium">Teachers</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">
                  {selectedSchool.admin_count || 0}
                </p>
                <p className="text-xs text-purple-600 font-medium">Admins</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Academic Settings
                </h4>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      Currency
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {selectedSchool.currency_code}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600">Grading Scale</dt>
                    <dd className="text-sm font-semibold text-slate-900 capitalize">
                      {selectedSchool.grading_scale?.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600">
                      Default Exam Score
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      Out of {selectedSchool.default_exam_out_of}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  System Info
                </h4>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Created
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedSchool.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600">Last Updated</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedSchool.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600">School ID</dt>
                    <dd className="text-xs font-mono text-slate-500 truncate max-w-[180px]">
                      {selectedSchool.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => {
              handleEdit(selectedSchool);
              setSelectedSchool(null);
            }} leftIcon={<Edit className="w-4 h-4" />}>
                  Edit School
                </Button>
                <Button variant={selectedSchool.approved ? 'warning' : 'primary'} size="sm" onClick={() => {
              handleApprove(selectedSchool.id, selectedSchool.approved);
              setSelectedSchool(null);
            }}>
                  {selectedSchool.approved ? 'Suspend School' : 'Approve School'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => {
              handleDelete(selectedSchool.id, selectedSchool.name);
              setSelectedSchool(null);
            }} leftIcon={<Trash2 className="w-4 h-4" />}>
                  Delete
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setSelectedSchool(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}