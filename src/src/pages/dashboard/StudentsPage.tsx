import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2, MoreVertical, Users, TrendingUp, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { studentService, Student, StudentFilter, StudentStats } from '../../services/studentService';
import { MetricCard } from '../../components/dashboard/MetricCard';

interface StudentRowProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onView: (student: Student) => void;
}

function StudentRow({ student, onEdit, onDelete, onView }: StudentRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColor = {
    active: 'success',
    inactive: 'warning',
    transferred: 'secondary',
    graduated: 'info'
  }[student.status] as any;

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-slate-900">
            {student.first_name} {student.last_name}
          </div>
          <div className="text-sm text-slate-500">{student.admission_number}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-600">{student.email}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-600">{student.phone}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-600">{student.guardian_name}</div>
      </td>
      <td className="px-6 py-4">
        <Badge variant={statusColor}>{student.status}</Badge>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900">
          ${student.total_paid.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onView(student)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            View
          </Button>
          <div className="relative group">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <button
                  onClick={() => {
                    onEdit(student);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(student);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 rounded-b-lg"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filters, setFilters] = useState<StudentFilter>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    if (user?.school_id) {
      fetchStudents();
      fetchStats();
    }
  }, [user?.school_id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.school_id) return;

      const result = await studentService.getStudents(user.school_id, {
        ...filters,
        searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      setStudents(result.students);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user?.school_id) return;
      const studentStats = await studentService.getStudentStats(user.school_id);
      setStats(studentStats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
      return;
    }

    try {
      await studentService.deleteStudent(student.id, user?.school_id!);
      setStudents(students.filter(s => s.id !== student.id));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete student');
    }
  };

  const handleExport = async () => {
    try {
      const csv = await studentService.exportStudentsToCSV(user?.school_id!, students);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err: any) {
      setError(err.message || 'Failed to export');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      (s.first_name.toLowerCase() + s.last_name.toLowerCase()).includes(searchQuery.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all student records</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={fetchStudents} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          title="Error"
          message={error}
          action={<Button size="sm" variant="secondary" onClick={() => setError(null)}>Dismiss</Button>}
        />
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Students"
            value={stats.total.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Active"
            value={stats.active.toLocaleString()}
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Inactive"
            value={stats.inactive}
            icon={AlertCircle}
            color="yellow"
          />
          <MetricCard
            title="Total Paid"
            value={`$${stats.totalPaid.toLocaleString()}`}
            icon={DollarSign}
            color="emerald"
          />
          <MetricCard
            title="Total Owed"
            value={`$${stats.totalOwed.toLocaleString()}`}
            icon={DollarSign}
            color="red"
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm focus:outline-none bg-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Guardian
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    onEdit={() => setSelectedStudent(student)}
                    onDelete={handleDelete}
                    onView={() => setSelectedStudent(student)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No students found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first student'}
            </p>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Add Your First Student
            </Button>
          </div>
        )}
      </Card>

      {/* Student Detail Modal (Placeholder for now) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Student Details</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">First Name</p>
                  <p className="font-medium text-slate-900">{selectedStudent.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Name</p>
                  <p className="font-medium text-slate-900">{selectedStudent.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Admission Number</p>
                  <p className="font-medium text-slate-900">{selectedStudent.admission_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Guardian</p>
                  <p className="font-medium text-slate-900">{selectedStudent.guardian_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge variant="success">{selectedStudent.status}</Badge>
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                  Close
                </Button>
                <Button variant="primary">Edit Student</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
