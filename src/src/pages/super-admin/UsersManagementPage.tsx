import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Search, Filter, Eye, RefreshCw, Users, Shield, GraduationCap, DollarSign, Building2, Mail, Phone, Calendar, Trash2, Download, LayoutGrid, List as ListIcon, ArrowUpDown, TrendingUp, PieChart as PieChartIcon, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  school_id: string | null;
  created_at: string;
  updated_at: string;
  schools: {
    name: string;
  } | null;
}
export function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    bursars: 0
  });

  const growthChartData = useMemo(() => {
    const sorted = [...users].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const data: { name: string; total: number }[] = [];
    let count = 0;
    
    const grouped = sorted.reduce((acc, user) => {
      const date = new Date(user.created_at);
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
  }, [users]);

  const roleChartData = useMemo(() => {
    return [
      { name: 'Admins', value: stats.admins, color: '#3b82f6' },
      { name: 'Teachers', value: stats.teachers, color: '#22c55e' },
      { name: 'Bursars', value: stats.bursars, color: '#f59e0b' }
    ].filter(item => item.value > 0);
  }, [stats]);

  const schoolsRoleData = useMemo(() => {
    const data: Record<string, { name: string; school_admin: number; teacher: number; bursar: number; total: number }> = {};
    
    filteredUsers.forEach(user => {
      const schoolName = user.schools?.name || 'Unknown School';
      if (!data[schoolName]) {
        data[schoolName] = { name: schoolName, school_admin: 0, teacher: 0, bursar: 0, total: 0 };
      }
      if (user.role === 'school_admin') data[schoolName].school_admin++;
      else if (user.role === 'teacher') data[schoolName].teacher++;
      else if (user.role === 'bursar') data[schoolName].bursar++;
      
      data[schoolName].total++;
    });

    return Object.values(data).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredUsers]);

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);
  useEffect(() => {
    let result = users;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => u.full_name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query) || u.schools?.name?.toLowerCase().includes(query));
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (schoolFilter !== 'all') {
      result = result.filter(u => u.school_id === schoolFilter);
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
    setFilteredUsers(result);

    // Dynamic stats calculation based on filtered results
    setStats({
      total: result.length,
      admins: result.filter(u => u.role === 'school_admin').length,
      teachers: result.filter(u => u.role === 'teacher').length,
      bursars: result.filter(u => u.role === 'bursar').length
    });
  }, [users, searchQuery, roleFilter, schoolFilter, sortConfig]);

  const fetchSchools = async () => {
    const { data } = await supabase.from('schools').select('id, name').order('name');
    setSchools(data || []);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('users').select(`
          *,
          schools (
            name
          )
        `).neq('role', 'super_admin').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err: any) {
      setError('Failed to fetch users');
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
    const headers = ['Name', 'Email', 'Phone', 'Role', 'School', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        `"${user.full_name}"`,
        `"${user.email}"`,
        `"${user.phone || ''}"`,
        user.role,
        `"${user.schools?.name || 'Unknown'}"`,
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

  const toggleAll = () => {
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      filteredUsers.forEach(u => newSelected.delete(u.id));
    } else {
      filteredUsers.forEach(u => newSelected.add(u.id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('users').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      fetchUsers();
    } catch (err: any) {
      alert('Failed to delete users: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      const {
        error
      } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'school_admin':
        return <Badge variant="primary">School Admin</Badge>;
      case 'teacher':
        return <Badge variant="success">Teacher</Badge>;
      case 'bursar':
        return <Badge variant="warning">Bursar</Badge>;
      default:
        return <Badge variant="default">{role}</Badge>;
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'school_admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-green-500" />;
      case 'bursar':
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      default:
        return <Users className="w-4 h-4 text-slate-500" />;
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
            Users Management
          </h1>
          <p className="text-slate-500 mt-1">
            View and manage all users across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={fetchUsers} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Admins</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.admins}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Teachers</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.teachers}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Bursars</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.bursars}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
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
              <h3 className="text-lg font-bold text-slate-900">User Growth</h3>
              <p className="text-sm text-slate-500">Cumulative user registrations over time</p>
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Role Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Role Distribution</h3>
              <p className="text-sm text-slate-500">Breakdown of users by role</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
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

        {/* School Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Roles by School</h3>
              <p className="text-sm text-slate-500">User categories across top schools</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolsRoleData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="school_admin" stackId="a" fill="#3b82f6" name="Admins" barSize={24} />
                <Bar dataKey="teacher" stackId="a" fill="#22c55e" name="Teachers" barSize={24} />
                <Bar dataKey="bursar" stackId="a" fill="#f59e0b" name="Bursars" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
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
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[120px]">
                <option value="all">All Roles</option>
                <option value="school_admin">School Admins</option>
                <option value="teacher">Teachers</option>
                <option value="bursar">Bursars</option>
              </select>
            </div>
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[120px]">
                <option value="all">All Schools</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
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
            <span className="text-sm text-indigo-600">({filteredUsers.length} total in view)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredUsers.length > 0 ? (
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
                Showing <span className="font-semibold text-slate-900">{filteredUsers.length}</span> of <span className="font-semibold text-slate-900">{users.length}</span> user{users.length !== 1 ? 's' : ''}
              </p>
            </div>}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                  <Card key={user.id} className={`p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow relative ${selectedIds.has(user.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
                    <div className="absolute top-4 right-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelection(user.id)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">{user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{user.schools?.name || 'Unknown School'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        {getRoleBadge(user.role)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => setSelectedUser(user)}>
                        View
                      </Button>
                      <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(user.id, user.full_name)}>
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
                        <div className="flex items-center gap-1">User <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('role')}>
                        <div className="flex items-center gap-1">Role <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('school_name')}>
                        <div className="flex items-center gap-1">School <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1">Joined <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(user.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelection(user.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                              {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{user.full_name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            {getRoleBadge(user.role)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {user.schools?.name || 'No school assigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {user.phone ? <div className="flex items-center gap-1.5 text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {user.phone}
                              </div> : <span className="text-slate-400 text-xs">No phone</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-slate-700">
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedUser(user)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(user.id, user.full_name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Users Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>

      {/* View User Modal */}
      <Dialog isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="md">
        {selectedUser && <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedUser.full_name}
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedUser.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {getRoleIcon(selectedUser.role)}
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
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
                      {selectedUser.email}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Phone
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {selectedUser.phone || 'Not provided'}
                    </dd>
                  </div>
                </dl>
              </div>

              {selectedUser.schools && <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    School Assignment
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <p className="font-medium text-slate-900">
                      {selectedUser.schools.name}
                    </p>
                  </div>
                </div>}

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
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <dt className="text-sm text-slate-600">User ID</dt>
                    <dd className="text-xs font-mono text-slate-500 truncate max-w-[180px]">
                      {selectedUser.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <Button variant="danger" size="sm" onClick={() => {
            handleDelete(selectedUser.id, selectedUser.full_name);
            setSelectedUser(null);
          }} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete User
              </Button>
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}