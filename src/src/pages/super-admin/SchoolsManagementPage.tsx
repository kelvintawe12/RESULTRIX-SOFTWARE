import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Trash2, Eye, RefreshCw, Search, Filter, Building2, Users, GraduationCap, DollarSign, Calendar, MapPin, CheckCircle, XCircle, Edit, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { AddSchoolForm } from '../../components/forms/AddSchoolForm';
import { EditSchoolForm } from '../../components/forms/EditSchoolForm';
import { Dialog } from '../../components/ui/Dialog';
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
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0
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
    setFilteredSchools(result);
  }, [schools, searchQuery, statusFilter]);
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
      setStats({
        total: schoolsWithCounts.length,
        active: schoolsWithCounts.filter(s => s.approved).length,
        pending: schoolsWithCounts.filter(s => !s.approved).length
      });
    } catch (err: any) {
      setError('Failed to fetch schools');
      console.error(err);
    } finally {
      setLoading(false);
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
  const columns = [{
    header: 'School',
    accessor: 'name' as const,
    render: (row: School) => <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {row.address || 'No address'}
            </div>
          </div>
        </div>
  }, {
    header: 'Stats',
    accessor: 'student_count' as const,
    render: (row: School) => <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium">{row.student_count || 0}</span>
            <span className="text-slate-500">students</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-green-500" />
            <span className="font-medium">{row.teacher_count || 0}</span>
            <span className="text-slate-500">teachers</span>
          </div>
        </div>
  }, {
    header: 'Currency',
    accessor: 'currency_code' as const,
    render: (row: School) => <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-900">
            {row.currency_code}
          </span>
        </div>
  }, {
    header: 'Grading',
    accessor: 'grading_scale' as const,
    render: (row: School) => <div className="text-sm">
          <div className="font-medium text-slate-700 capitalize">
            {row.grading_scale?.replace(/_/g, ' ')}
          </div>
          <div className="text-xs text-slate-500">
            Out of {row.default_exam_out_of}
          </div>
        </div>
  }, {
    header: 'Status',
    accessor: 'approved' as const,
    render: (row: School) => <Badge variant={row.approved ? 'success' : 'warning'} className="flex items-center gap-1 w-fit">
          {row.approved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {row.approved ? 'Active' : 'Pending'}
        </Badge>
  }, {
    header: 'Created',
    accessor: 'created_at' as const,
    render: (row: School) => <div className="text-sm">
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
    render: (row: School) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSelectedSchool(row)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="primary" onClick={() => handleEdit(row)} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button size="sm" variant={row.approved ? 'warning' : 'success'} onClick={() => handleApprove(row.id, row.approved)}>
            {row.approved ? 'Suspend' : 'Approve'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id, row.name)} leftIcon={<Trash2 className="w-4 h-4" />}>
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
            Schools Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all schools registered on the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchSchools} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add School
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} action={<Button size="sm" variant="secondary" onClick={fetchSchools}>
              Retry
            </Button>} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search schools by name, address, currency..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredSchools.length > 0 ? <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredSchools.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {schools.length}
                </span>{' '}
                school{schools.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Table data={filteredSchools} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Schools Found
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by adding your first school to the platform.'}
            </p>
            {!searchQuery && statusFilter === 'all' && <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Add Your First School
              </Button>}
          </div>}
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
                <Button variant={selectedSchool.approved ? 'warning' : 'success'} size="sm" onClick={() => {
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