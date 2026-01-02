import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Search, Filter, Eye, RefreshCw, Users, Shield, GraduationCap, DollarSign, Building2, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
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
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    teachers: 0,
    bursars: 0
  });
  useEffect(() => {
    fetchUsers();
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
    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter]);
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
      // Calculate stats
      setStats({
        total: data?.length || 0,
        admins: data?.filter(u => u.role === 'school_admin').length || 0,
        teachers: data?.filter(u => u.role === 'teacher').length || 0,
        bursars: data?.filter(u => u.role === 'bursar').length || 0
      });
    } catch (err: any) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
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
  const columns = [{
    header: 'User',
    accessor: 'full_name' as const,
    render: (row: User) => <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
            {row.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.full_name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              {row.email}
            </div>
          </div>
        </div>
  }, {
    header: 'Role',
    accessor: 'role' as const,
    render: (row: User) => <div className="flex items-center gap-2">
          {getRoleIcon(row.role)}
          {getRoleBadge(row.role)}
        </div>
  }, {
    header: 'School',
    accessor: 'schools' as const,
    render: (row: User) => <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-700">
            {row.schools?.name || 'No school assigned'}
          </span>
        </div>
  }, {
    header: 'Contact',
    accessor: 'phone' as const,
    render: (row: User) => <div className="text-sm">
          {row.phone ? <div className="flex items-center gap-1.5 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {row.phone}
            </div> : <span className="text-slate-400 text-xs">No phone</span>}
        </div>
  }, {
    header: 'Joined',
    accessor: 'created_at' as const,
    render: (row: User) => <div className="text-sm">
          <div className="text-slate-700">
            {new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
          </div>
        </div>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: User) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSelectedUser(row)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id, row.full_name)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
  }];
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
        <Button variant="secondary" onClick={fetchUsers} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
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

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or school..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]">
              <option value="all">All Roles</option>
              <option value="school_admin">School Admins</option>
              <option value="teacher">Teachers</option>
              <option value="bursar">Bursars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredUsers.length > 0 ? <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredUsers.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {users.length}
                </span>{' '}
                user{users.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Table data={filteredUsers} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Users Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No users have been registered yet.'}
            </p>
          </div>}
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