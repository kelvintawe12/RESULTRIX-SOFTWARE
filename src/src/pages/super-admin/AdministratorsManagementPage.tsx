import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Search, Filter, Eye, RefreshCw, UserX, UserCheck, Users, Building2, Mail, Phone, Calendar, Shield, Trash2, Edit, MoreVertical, Download, LayoutGrid, List as ListIcon, ArrowUpDown, CheckCircle, XCircle, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
import { EditAdministratorForm } from '../../components/forms/EditAdministratorForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
interface Administrator {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  school_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  schools: {
    name: string;
    approved: boolean;
    currency_code: string;
  } | null;
  student_count?: number;
  teacher_count?: number;
}
export function AdministratorsManagementPage() {
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [schools, setSchools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const chartData = useMemo(() => {
    const schoolCounts: Record<string, number> = {};
    
    admins.forEach(admin => {
      const schoolName = admin.schools?.name || 'Unknown School';
      schoolCounts[schoolName] = (schoolCounts[schoolName] || 0) + 1;
    });

    return Object.entries(schoolCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [admins]);

  const growthChartData = useMemo(() => {
    const sorted = [...admins].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const data: { name: string; total: number }[] = [];
    let count = 0;
    
    const grouped = sorted.reduce((acc, admin) => {
      const date = new Date(admin.created_at);
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
  }, [admins]);

  const statusChartData = useMemo(() => {
    const active = admins.filter(a => a.schools?.approved).length;
    const pending = admins.filter(a => !a.schools?.approved).length;
    return [
      { name: 'Active', value: active, color: '#22c55e' },
      { name: 'Pending', value: pending, color: '#f59e0b' }
    ];
  }, [admins]);

  useEffect(() => {
    fetchAdmins();
    fetchSchools();
  }, []);
  useEffect(() => {
    let result = admins;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.full_name?.toLowerCase().includes(query) || a.email?.toLowerCase().includes(query) || a.schools?.name?.toLowerCase().includes(query));
    }
    if (schoolFilter !== 'all') {
      result = result.filter(a => a.school_id === schoolFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested properties
        if (sortConfig.key === 'school_name') {
          aValue = a.schools?.name || '';
          bValue = b.schools?.name || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredAdmins(result);
  }, [admins, searchQuery, schoolFilter, sortConfig]);
  const fetchSchools = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('id, name').order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error('Error fetching schools:', err);
    }
  };
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch users with role 'school_admin' and join with schools table
      const {
        data,
        error
      } = await supabase.from('users').select(`
          *,
          schools (
            name,
            approved,
            currency_code
          )
        `).eq('role', 'school_admin').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      // Fetch counts for each admin's school
      const adminsWithCounts = await Promise.all((data || []).map(async admin => {
        const [studentCount, teacherCount] = await Promise.all([supabase.from('students').select('id', {
          count: 'exact',
          head: true
        }).eq('school_id', admin.school_id).then(res => res.count || 0), supabase.from('users').select('id', {
          count: 'exact',
          head: true
        }).eq('school_id', admin.school_id).eq('role', 'teacher').then(res => res.count || 0)]);
        return {
          ...admin,
          student_count: studentCount,
          teacher_count: teacherCount
        };
      }));
      setAdmins(adminsWithCounts);
      setFilteredAdmins(adminsWithCounts);
      // Calculate stats
      setStats({
        total: adminsWithCounts.length,
        active: adminsWithCounts.filter(a => a.schools?.approved).length,
        inactive: adminsWithCounts.filter(a => !a.schools?.approved).length
      });
    } catch (err: any) {
      setError('Failed to fetch administrators');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'School', 'School Status', 'Students', 'Teachers', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredAdmins.map(admin => [
        `"${admin.full_name}"`,
        `"${admin.email}"`,
        `"${admin.phone || ''}"`,
        `"${admin.schools?.name || 'Unknown'}"`,
        admin.schools?.approved ? 'Active' : 'Pending',
        admin.student_count || 0,
        admin.teacher_count || 0,
        new Date(admin.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `administrators_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  const allSelected = filteredAdmins.length > 0 && filteredAdmins.every(a => selectedIds.has(a.id));

  const toggleAll = () => {
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      filteredAdmins.forEach(a => newSelected.delete(a.id));
    } else {
      filteredAdmins.forEach(a => newSelected.add(a.id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} administrators? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('users').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      fetchAdmins();
    } catch (err: any) {
      alert('Failed to delete administrators: ' + err.message);
    }
  };

  const handleEdit = (admin: Administrator) => {
    setEditingAdmin(admin);
    setShowEditForm(true);
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete administrator "${name}"? This action cannot be undone.`)) return;
    try {
      const {
        error
      } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchAdmins();
    } catch (err: any) {
      console.error('Error deleting administrator:', err);
      alert('Failed to delete administrator: ' + err.message);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Administrators Management
          </h1>
          <p className="text-slate-500 mt-1">
            View and manage school administrators across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={fetchAdmins} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Administrators
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
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
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Pending Schools
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.inactive}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <UserX className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Administrator Growth</h3>
              <p className="text-sm text-slate-500">Cumulative administrator registrations over time</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">School Distribution</h3>
              <p className="text-sm text-slate-500">Top schools by administrator count</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} name="Administrators" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Status Overview</h3>
              <p className="text-sm text-slate-500">Active vs Pending administrators</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or school..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-slate-500" />
              <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[150px]">
                <option value="all">All Schools</option>
                {schools.map(school => <option key={school.id} value={school.id}>
                    {school.name}
                  </option>)}
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
            <span className="text-sm text-indigo-600">({filteredAdmins.length} total in view)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Administrators Table */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredAdmins.length > 0 ? (
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
                Showing <span className="font-semibold text-slate-900">{filteredAdmins.length}</span> of <span className="font-semibold text-slate-900">{admins.length}</span> administrator{admins.length !== 1 ? 's' : ''}
              </p>
            </div>}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdmins.map(admin => (
                  <Card key={admin.id} className={`p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow relative ${selectedIds.has(admin.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
                    <div className="absolute top-4 right-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(admin.id)}
                        onChange={() => toggleSelection(admin.id)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold shadow">
                        {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">{admin.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{admin.schools?.name || 'Unknown School'}</span>
                        </div>
                        <Badge variant={admin.schools?.approved ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0.5">
                          {admin.schools?.approved ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {admin.student_count || 0} Students
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {admin.teacher_count || 0} Teachers
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => setSelectedAdmin(admin)}>
                        View
                      </Button>
                      <Button size="sm" variant="primary" leftIcon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(admin)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(admin.id, admin.full_name)}>
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
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('full_name')}>
                        <div className="flex items-center gap-1">Administrator <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('school_name')}>
                        <div className="flex items-center gap-1">School <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Managed</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1">Joined <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmins.map(admin => (
                      <tr key={admin.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(admin.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.has(admin.id)} onChange={() => toggleSelection(admin.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-sm">
                              {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{admin.full_name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              {admin.schools?.name || 'Unknown School'}
                            </div>
                            <Badge variant={admin.schools?.approved ? 'success' : 'warning'} className="mt-1 text-xs flex items-center gap-1 w-fit">
                              {admin.schools?.approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {admin.schools?.approved ? 'Active' : 'Pending'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium">{admin.student_count || 0}</span>
                              <span className="text-slate-500">students</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Shield className="w-3.5 h-3.5 text-green-500" />
                              <span className="font-medium">{admin.teacher_count || 0}</span>
                              <span className="text-slate-500">teachers</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {admin.phone ? <div className="flex items-center gap-1.5 text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {admin.phone}
                              </div> : <span className="text-slate-400 text-xs">No phone</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-slate-700">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(admin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedAdmin(admin)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="primary" onClick={() => handleEdit(admin)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <div className="relative group">
                              <Button size="sm" variant="secondary">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 hidden group-hover:block z-10">
                                <button 
                                  onClick={() => handleDelete(admin.id, admin.full_name)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Admin
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
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Administrators Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || schoolFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No administrators have been registered yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Administrator Modal */}
      {editingAdmin && <EditAdministratorForm isOpen={showEditForm} onClose={() => {
      setShowEditForm(false);
      setEditingAdmin(null);
    }} onSuccess={fetchAdmins} administrator={editingAdmin} />}

      {/* View Admin Modal */}
      <Dialog isOpen={!!selectedAdmin} onClose={() => setSelectedAdmin(null)} title="Administrator Details" size="lg">
        {selectedAdmin && <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedAdmin.full_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedAdmin.full_name}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedAdmin.email}
                  </p>
                  <Badge variant="primary" className="mt-2 flex items-center gap-1 w-fit">
                    <Shield className="w-3 h-3" />
                    School Administrator
                  </Badge>
                </div>
              </div>
            </div>

            {/* School Info */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                School Assignment
              </h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-slate-900 text-lg">
                        {selectedAdmin.schools?.name || 'Unknown School'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600">
                        Currency:{' '}
                        <span className="font-semibold">
                          {selectedAdmin.schools?.currency_code}
                        </span>
                      </span>
                      <Badge variant={selectedAdmin.schools?.approved ? 'success' : 'warning'}>
                        {selectedAdmin.schools?.approved ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedAdmin.student_count || 0}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      Students
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedAdmin.teacher_count || 0}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      Teachers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Contact Information
                </h4>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      Email
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                      {selectedAdmin.email}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Phone
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {selectedAdmin.phone || 'Not provided'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Account Information
                </h4>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Joined
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedAdmin.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600">Last Updated</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedAdmin.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600">User ID</dt>
                    <dd className="text-xs font-mono text-slate-500 truncate max-w-[180px]">
                      {selectedAdmin.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => {
              handleEdit(selectedAdmin);
              setSelectedAdmin(null);
            }} leftIcon={<Edit className="w-4 h-4" />}>
                  Edit Administrator
                </Button>
                <Button variant="danger" size="sm" onClick={() => {
              handleDelete(selectedAdmin.id, selectedAdmin.full_name);
              setSelectedAdmin(null);
            }} leftIcon={<Trash2 className="w-4 h-4" />}>
                  Delete
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setSelectedAdmin(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}