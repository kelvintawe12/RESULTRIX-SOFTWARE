import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Search, Filter, Eye, RefreshCw, UserX, UserCheck, Users, Building2, Mail, Phone, Calendar, Shield, Trash2, Edit, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
import { EditAdministratorForm } from '../../components/forms/EditAdministratorForm';
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
  const [schools, setSchools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
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
    setFilteredAdmins(result);
  }, [admins, searchQuery, schoolFilter]);
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
  const columns = [{
    header: 'Administrator',
    accessor: 'full_name' as const,
    render: (row: Administrator) => <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-sm">
            {row.full_name?.charAt(0).toUpperCase() || 'A'}
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
    header: 'School',
    accessor: 'schools' as const,
    render: (row: Administrator) => <div>
          <div className="font-medium text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            {row.schools?.name || 'Unknown School'}
          </div>
          <Badge variant={row.schools?.approved ? 'success' : 'warning'} className="mt-1 text-xs">
            {row.schools?.approved ? 'Active' : 'Pending'}
          </Badge>
        </div>
  }, {
    header: 'Managed',
    accessor: 'student_count' as const,
    render: (row: Administrator) => <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">{row.student_count || 0}</span>
            <span className="text-slate-500">students</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium">{row.teacher_count || 0}</span>
            <span className="text-slate-500">teachers</span>
          </div>
        </div>
  }, {
    header: 'Contact',
    accessor: 'phone' as const,
    render: (row: Administrator) => <div className="text-sm">
          {row.phone ? <div className="flex items-center gap-1.5 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {row.phone}
            </div> : <span className="text-slate-400 text-xs">No phone</span>}
        </div>
  }, {
    header: 'Joined',
    accessor: 'created_at' as const,
    render: (row: Administrator) => <div className="text-sm">
          <div className="text-slate-700">
            {new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(row.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}
          </div>
        </div>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: Administrator) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSelectedAdmin(row)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="primary" onClick={() => handleEdit(row)} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
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
            Administrators Management
          </h1>
          <p className="text-slate-500 mt-1">
            View and manage school administrators across the platform
          </p>
        </div>
        <Button variant="secondary" onClick={fetchAdmins} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
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

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or school..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
              <option value="all">All Schools</option>
              {schools.map(school => <option key={school.id} value={school.id}>
                  {school.name}
                </option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredAdmins.length > 0 ? <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredAdmins.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {admins.length}
                </span>{' '}
                administrator{admins.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Table data={filteredAdmins} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Administrators Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || schoolFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No administrators have been registered yet.'}
            </p>
          </div>}
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