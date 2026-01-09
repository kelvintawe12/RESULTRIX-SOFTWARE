import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Checkbox } from '../../components/ui/Checkbox';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../hooks/useAuth';
import { Users, BookOpen, Trash2, Eye, Search, Download, Plus, AlertTriangle, CheckSquare, XSquare, Filter, Edit, XCircle, RotateCcw, History } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}
interface Subject {
  id: string;
  name: string;
  coefficient: number;
  subject_type: 'core' | 'elective';
}
interface Class {
  id: string;
  name: string;
}
interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  teacher_name: string;
  subject_name: string;
  class_name: string;
  subject_type: 'core' | 'elective';
  status: 'active' | 'revoked';
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  revoked_by_name?: string;
  created_at: string;
}
interface SubjectClassMapping {
  subject_id: string;
  class_id: string;
}
export function TeacherAssignmentsPage() {
  const {
    user
  } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [subjectClassMappings, setSubjectClassMappings] = useState<SubjectClassMapping[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<TeacherAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'revoked'>('active');
  // Single assignment state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  // Edit state
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [editTeacher, setEditTeacher] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editAvailableClasses, setEditAvailableClasses] = useState<Class[]>([]);
  // Bulk assignment state
  const [bulkTeacher, setBulkTeacher] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkClasses, setBulkClasses] = useState<string[]>([]);
  const [bulkAvailableClasses, setBulkAvailableClasses] = useState<Class[]>([]);
  // Revoke state
  const [revokingAssignment, setRevokingAssignment] = useState<TeacherAssignment | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  // Filters
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    revokedAssignments: 0,
    totalTeachers: 0,
    avgAssignmentsPerTeacher: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [assignments, filterTeacher, filterSubject, searchQuery, activeTab]);
  // Update available classes when subject is selected (Single Assignment)
  useEffect(() => {
    if (selectedSubject) {
      const classIds = subjectClassMappings.filter(m => m.subject_id === selectedSubject).map(m => m.class_id);
      const filtered = classes.filter(c => classIds.includes(c.id));
      setAvailableClasses(filtered);
      if (selectedClass && !classIds.includes(selectedClass)) {
        setSelectedClass('');
      }
    } else {
      setAvailableClasses([]);
      setSelectedClass('');
    }
  }, [selectedSubject, subjectClassMappings, classes, selectedClass]);
  // Update available classes for edit modal
  useEffect(() => {
    if (editSubject) {
      const classIds = subjectClassMappings.filter(m => m.subject_id === editSubject).map(m => m.class_id);
      const filtered = classes.filter(c => classIds.includes(c.id));
      setEditAvailableClasses(filtered);
      if (editClass && !classIds.includes(editClass)) {
        setEditClass('');
      }
    } else {
      setEditAvailableClasses([]);
      setEditClass('');
    }
  }, [editSubject, subjectClassMappings, classes, editClass]);
  // Update available classes when subject is selected (Bulk Assignment)
  useEffect(() => {
    if (bulkSubject) {
      const classIds = subjectClassMappings.filter(m => m.subject_id === bulkSubject).map(m => m.class_id);
      const filtered = classes.filter(c => classIds.includes(c.id));
      setBulkAvailableClasses(filtered);
      setBulkClasses([]);
    } else {
      setBulkAvailableClasses([]);
      setBulkClasses([]);
    }
  }, [bulkSubject, subjectClassMappings, classes]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [teachersData, subjectsData, classesData, assignmentsData, mappingsData] = await Promise.all([
        supabase.from('users').select('id, full_name, email, phone').eq('school_id', user.school_id).eq('role', 'teacher').order('full_name'),
        supabase.from('subjects').select('id, name, coefficient, subject_type').eq('school_id', user.school_id).order('name'),
        supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'),
        supabase.from('teacher_assignments').select('id, teacher_id, subject_id, class_id, status, revoked_at, revoked_by, revocation_reason, created_at').eq('school_id', user.school_id),
        supabase.from('subject_class_mappings').select('subject_id, class_id')
      ]);
      if (teachersData.error) throw teachersData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (classesData.error) throw classesData.error;
      if (assignmentsData.error) throw assignmentsData.error;
      if (mappingsData.error) throw mappingsData.error;
      // Fetch revoked_by user names
      const revokedByIds = [...new Set((assignmentsData.data || []).filter(a => a.revoked_by).map(a => a.revoked_by))];
      let revokedByUsers: any[] = [];
      if (revokedByIds.length > 0) {
        const {
          data: usersData
        } = await supabase.from('users').select('id, full_name').in('id', revokedByIds);
        revokedByUsers = usersData || [];
      }
      const enrichedAssignments = (assignmentsData.data || []).map(assignment => {
        const teacher = teachersData.data?.find(t => t.id === assignment.teacher_id);
        const subject = subjectsData.data?.find(s => s.id === assignment.subject_id);
        const classData = classesData.data?.find(c => c.id === assignment.class_id);
        const revokedByUser = revokedByUsers.find(u => u.id === assignment.revoked_by);
        return {
          ...assignment,
          teacher_name: teacher?.full_name || 'Unknown',
          subject_name: subject?.name || 'Unknown',
          class_name: classData?.name || 'Unknown',
          subject_type: subject?.subject_type || 'core',
          revoked_by_name: revokedByUser?.full_name || null
        };
      });
      setTeachers(teachersData.data || []);
      setSubjects(subjectsData.data || []);
      setClasses(classesData.data || []);
      setAssignments(enrichedAssignments);
      setSubjectClassMappings(mappingsData.data || []);
      const activeAssignments = enrichedAssignments.filter(a => a.status === 'active');
      const revokedAssignments = enrichedAssignments.filter(a => a.status === 'revoked');
      const uniqueTeachers = new Set(activeAssignments.map(a => a.teacher_id));
      setStats({
        totalAssignments: enrichedAssignments.length,
        activeAssignments: activeAssignments.length,
        revokedAssignments: revokedAssignments.length,
        totalTeachers: uniqueTeachers.size,
        avgAssignmentsPerTeacher: uniqueTeachers.size > 0 ? Math.round(activeAssignments.length / uniqueTeachers.size * 10) / 10 : 0
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = assignments.filter(a => a.status === activeTab);
    if (filterTeacher) filtered = filtered.filter(a => a.teacher_id === filterTeacher);
    if (filterSubject) filtered = filtered.filter(a => a.subject_id === filterSubject);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.teacher_name.toLowerCase().includes(query) || a.subject_name.toLowerCase().includes(query) || a.class_name.toLowerCase().includes(query));
    }
    setFilteredAssignments(filtered);
  };
  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject || !selectedClass) {
      setError('Please select teacher, subject, and class');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const existingAssignment = assignments.find(a => a.teacher_id === selectedTeacher && a.subject_id === selectedSubject && a.class_id === selectedClass && a.status === 'active');
      if (existingAssignment) {
        setError('This assignment already exists');
        return;
      }
      const payload = {
        teacher_id: selectedTeacher,
        subject_id: selectedSubject,
        class_id: selectedClass,
        school_id: user?.school_id,
        status: 'active'
      };
      const {
        error: insertError
      } = await supabase.from('teacher_assignments').insert(payload);
      if (insertError) throw insertError;
      setSuccess('Teacher assigned successfully');
      resetSingleForm();
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error assigning teacher:', err);
      if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('school_id')) {
        setError('Database configuration issue. Please run the migration script: add-school-id-to-enrollments-and-assignments.sql');
      } else {
        setError(err.message || 'Failed to assign teacher');
      }
    }
  };
  const handleEdit = async () => {
    if (!editingAssignment || !editTeacher || !editSubject || !editClass) {
      setError('Please fill all fields');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const {
        error: updateError
      } = await supabase.from('teacher_assignments').update({
        teacher_id: editTeacher,
        subject_id: editSubject,
        class_id: editClass
      }).eq('id', editingAssignment.id);
      if (updateError) throw updateError;
      setSuccess('Assignment updated successfully');
      setShowEditModal(false);
      setEditingAssignment(null);
      resetEditForm();
      fetchData();
    } catch (err: any) {
      console.error('Error updating assignment:', err);
      setError(err.message || 'Failed to update assignment');
    }
  };
  const handleRevoke = async () => {
    if (!revokingAssignment) return;
    try {
      setError('');
      setSuccess('');
      const {
        error: updateError
      } = await supabase.from('teacher_assignments').update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user?.id,
        revocation_reason: revocationReason || null
      }).eq('id', revokingAssignment.id);
      if (updateError) throw updateError;
      setSuccess('Assignment revoked successfully');
      setShowRevokeModal(false);
      setRevokingAssignment(null);
      setRevocationReason('');
      fetchData();
    } catch (err: any) {
      console.error('Error revoking assignment:', err);
      setError(err.message || 'Failed to revoke assignment');
    }
  };
  const handleRestore = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to restore this assignment?')) return;
    try {
      setError('');
      setSuccess('');
      const {
        error: updateError
      } = await supabase.from('teacher_assignments').update({
        status: 'active',
        revoked_at: null,
        revoked_by: null,
        revocation_reason: null
      }).eq('id', assignmentId);
      if (updateError) throw updateError;
      setSuccess('Assignment restored successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error restoring assignment:', err);
      setError(err.message || 'Failed to restore assignment');
    }
  };
  const handleBulkAssign = async () => {
    if (!bulkTeacher || !bulkSubject || bulkClasses.length === 0) {
      setError('Please select teacher, subject, and at least one class');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const assignmentsToInsert = [];
      for (const classId of bulkClasses) {
        const exists = assignments.find(a => a.teacher_id === bulkTeacher && a.subject_id === bulkSubject && a.class_id === classId && a.status === 'active');
        if (!exists) {
          assignmentsToInsert.push({
            teacher_id: bulkTeacher,
            subject_id: bulkSubject,
            class_id: classId,
            school_id: user?.school_id,
            status: 'active'
          });
        }
      }
      if (assignmentsToInsert.length === 0) {
        setError('All selected assignments already exist');
        setLoading(false);
        return;
      }
      const {
        error: insertError
      } = await supabase.from('teacher_assignments').insert(assignmentsToInsert);
      if (insertError) throw insertError;
      setSuccess(`Successfully created ${assignmentsToInsert.length} assignment(s)`);
      resetBulkForm();
      setShowBulkModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error bulk assigning:', err);
      if (err.code === '42703' || err.code === 'PGRST204' || err.message?.includes('school_id')) {
        setError('Database configuration issue. Please run the migration script: add-school-id-to-enrollments-and-assignments.sql');
      } else {
        setError(err.message || 'Failed to create bulk assignments');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this assignment?')) return;
    try {
      setError('');
      setSuccess('');
      const {
        error: deleteError
      } = await supabase.from('teacher_assignments').delete().eq('id', assignmentId);
      if (deleteError) throw deleteError;
      setSuccess('Assignment deleted successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.message || 'Failed to delete assignment');
    }
  };
  const handleExport = () => {
    const exportData = filteredAssignments.map(a => ({
      Teacher: a.teacher_name,
      Subject: a.subject_name,
      Class: a.class_name,
      'Subject Type': a.subject_type,
      Status: a.status,
      'Assigned Date': new Date(a.created_at).toLocaleDateString(),
      'Revoked Date': a.revoked_at ? new Date(a.revoked_at).toLocaleDateString() : '',
      'Revoked By': a.revoked_by_name || '',
      'Revocation Reason': a.revocation_reason || ''
    }));
    downloadCSV(exportData, `teacher_assignments_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
  };
  const getTeacherAssignmentCount = (teacherId: string) => {
    return assignments.filter(a => a.teacher_id === teacherId && a.status === 'active').length;
  };
  const toggleBulkClass = (id: string) => {
    setBulkClasses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };
  const selectAllClasses = () => setBulkClasses(bulkAvailableClasses.map(c => c.id));
  const clearClasses = () => setBulkClasses([]);
  const resetSingleForm = () => {
    setSelectedTeacher('');
    setSelectedSubject('');
    setSelectedClass('');
    setAvailableClasses([]);
  };
  const resetEditForm = () => {
    setEditTeacher('');
    setEditSubject('');
    setEditClass('');
    setEditAvailableClasses([]);
  };
  const resetBulkForm = () => {
    setBulkTeacher('');
    setBulkSubject('');
    setBulkClasses([]);
    setBulkAvailableClasses([]);
  };
  if (loading && assignments.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Teacher Assignments
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Manage teacher-subject-class assignments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filteredAssignments.length === 0} leftIcon={<Download className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => {
          resetBulkForm();
          setShowBulkModal(true);
        }} leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            Bulk Assign
          </Button>
          <Button onClick={() => {
          resetSingleForm();
          setShowAddModal(true);
        }} leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            New Assignment
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} icon={<AlertTriangle className="h-4 w-4" />} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Active Assignments
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeAssignments}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-xl flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Active Teachers
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalTeachers}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-xl flex-shrink-0">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Avg per Teacher
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.avgAssignmentsPerTeacher}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-xl flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Revoked
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.revokedAssignments}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-red-50 rounded-xl flex-shrink-0">
                <History className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={[{
      id: 'active',
      label: `Active (${stats.activeAssignments})`
    }, {
      id: 'revoked',
      label: `Revoked (${stats.revokedAssignments})`
    }]} activeTab={activeTab} onChange={tab => setActiveTab(tab as 'active' | 'revoked')} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search assignments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teachers</SelectItem>
                {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {activeTab === 'active' ? 'Active' : 'Revoked'} Assignments (
            {filteredAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? <div className="text-center py-12">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">
                No {activeTab} assignments found
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                {assignments.length === 0 ? 'Create your first teacher assignment' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {filteredAssignments.map(assignment => <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${assignment.status === 'active' ? 'bg-indigo-50' : 'bg-red-50'}`}>
                        <Users className={`h-4 w-4 sm:h-5 sm:w-5 ${assignment.status === 'active' ? 'text-indigo-600' : 'text-red-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                          {assignment.teacher_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm text-gray-600 truncate">
                            {assignment.subject_name}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs sm:text-sm text-gray-600 truncate">
                            {assignment.class_name}
                          </span>
                          <Badge variant={assignment.subject_type === 'core' ? 'default' : 'secondary'} className="text-xs">
                            {assignment.subject_type}
                          </Badge>
                          {assignment.status === 'revoked' && <Badge variant="error" className="text-xs">
                              Revoked
                            </Badge>}
                        </div>
                        {assignment.status === 'revoked' && assignment.revocation_reason && <p className="text-xs text-gray-500 mt-1 italic">
                              Reason: {assignment.revocation_reason}
                            </p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedAssignment(assignment);
                setViewModalOpen(true);
              }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {assignment.status === 'active' ? <>
                        <Button variant="ghost" size="sm" onClick={() => {
                  setEditingAssignment(assignment);
                  setEditTeacher(assignment.teacher_id);
                  setEditSubject(assignment.subject_id);
                  setEditClass(assignment.class_id);
                  setShowEditModal(true);
                }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                  setRevokingAssignment(assignment);
                  setShowRevokeModal(true);
                }}>
                          <XCircle className="h-4 w-4 text-orange-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </> : <>
                        <Button variant="ghost" size="sm" onClick={() => handleRestore(assignment.id)}>
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>}
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* New Assignment Modal */}
      <Dialog isOpen={showAddModal} onClose={() => {
      setShowAddModal(false);
      resetSingleForm();
    }} title="New Teacher Assignment">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teacher</label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({getTeacherAssignmentCount(teacher.id)}{' '}
                    assignments)
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.subject_type})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedSubject && <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Class (filtered by subject)
              </label>
              {availableClasses.length === 0 ? <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      No classes available
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This subject is not mapped to any classes. Please
                      configure subject-class mappings first.
                    </p>
                  </div>
                </div> : <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>}
            </div>}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
            <Button onClick={handleAssign} disabled={!selectedTeacher || !selectedSubject || !selectedClass} className="flex-1 sm:flex-initial text-sm">
              Assign Teacher
            </Button>
            <Button variant="outline" onClick={() => {
            setShowAddModal(false);
            resetSingleForm();
          }} className="flex-1 sm:flex-initial text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog isOpen={showEditModal} onClose={() => {
      setShowEditModal(false);
      setEditingAssignment(null);
      resetEditForm();
    }} title="Edit Teacher Assignment">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teacher</label>
            <Select value={editTeacher} onValueChange={setEditTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Select value={editSubject} onValueChange={setEditSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.subject_type})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {editSubject && <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Class (filtered by subject)
              </label>
              {editAvailableClasses.length === 0 ? <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      No classes available
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This subject is not mapped to any classes.
                    </p>
                  </div>
                </div> : <Select value={editClass} onValueChange={setEditClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {editAvailableClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>}
            </div>}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
            <Button onClick={handleEdit} disabled={!editTeacher || !editSubject || !editClass} className="flex-1 sm:flex-initial text-sm">
              Update Assignment
            </Button>
            <Button variant="outline" onClick={() => {
            setShowEditModal(false);
            setEditingAssignment(null);
            resetEditForm();
          }} className="flex-1 sm:flex-initial text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog isOpen={showRevokeModal} onClose={() => {
      setShowRevokeModal(false);
      setRevokingAssignment(null);
      setRevocationReason('');
    }} title="Revoke Assignment">
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              You are about to revoke the assignment for{' '}
              <strong>{revokingAssignment?.teacher_name}</strong> teaching{' '}
              <strong>{revokingAssignment?.subject_name}</strong> to{' '}
              <strong>{revokingAssignment?.class_name}</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Reason for Revocation (Optional)
            </label>
            <textarea value={revocationReason} onChange={e => setRevocationReason(e.target.value)} placeholder="Enter reason for revoking this assignment..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
            <Button onClick={handleRevoke} variant="danger" className="flex-1 sm:flex-initial text-sm">
              Revoke Assignment
            </Button>
            <Button variant="outline" onClick={() => {
            setShowRevokeModal(false);
            setRevokingAssignment(null);
            setRevocationReason('');
          }} className="flex-1 sm:flex-initial text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog isOpen={showBulkModal} onClose={() => {
      setShowBulkModal(false);
      resetBulkForm();
    }} title="Bulk Teacher Assignment">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teacher</label>
            <Select value={bulkTeacher} onValueChange={setBulkTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Select value={bulkSubject} onValueChange={setBulkSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.subject_type})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!bulkSubject ? <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Please select a subject to see available classes
            </div> : <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Select Classes (filtered by subject)
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllClasses} className="h-6 text-xs px-2" disabled={bulkAvailableClasses.length === 0}>
                    <CheckSquare className="h-3 w-3 mr-1" /> All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearClasses} className="h-6 text-xs px-2">
                    <XSquare className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              </div>

              {bulkAvailableClasses.length === 0 ? <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  No classes mapped to this subject.
                </div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {bulkAvailableClasses.map(cls => <div key={cls.id} className="flex items-center">
                      <Checkbox checked={bulkClasses.includes(cls.id)} onChange={() => toggleBulkClass(cls.id)} label={cls.name} />
                    </div>)}
                </div>}
              <p className="text-xs text-gray-500 text-right">
                {bulkClasses.length} selected
              </p>
            </div>}

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Will create{' '}
              <span className="font-bold text-gray-900">
                {bulkClasses.length}
              </span>{' '}
              assignment(s)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <Button onClick={handleBulkAssign} disabled={!bulkTeacher || !bulkSubject || bulkClasses.length === 0} className="flex-1 sm:flex-initial text-sm">
              Create Assignments
            </Button>
            <Button variant="outline" onClick={() => {
            setShowBulkModal(false);
            resetBulkForm();
          }} className="flex-1 sm:flex-initial text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* View Assignment Modal */}
      {viewModalOpen && selectedAssignment && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedAssignment(null);
    }} title="Assignment Details">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Teacher
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedAssignment.teacher_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Subject
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedAssignment.subject_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Class</label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedAssignment.class_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Subject Type
              </label>
              <div className="mt-1">
                <Badge variant={selectedAssignment.subject_type === 'core' ? 'default' : 'secondary'}>
                  {selectedAssignment.subject_type}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={selectedAssignment.status === 'active' ? 'success' : 'error'}>
                  {selectedAssignment.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Assigned Date
              </label>
              <p className="text-gray-900">
                {new Date(selectedAssignment.created_at).toLocaleDateString()}
              </p>
            </div>
            {selectedAssignment.status === 'revoked' && <>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Revoked Date
                  </label>
                  <p className="text-gray-900">
                    {selectedAssignment.revoked_at ? new Date(selectedAssignment.revoked_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Revoked By
                  </label>
                  <p className="text-gray-900">
                    {selectedAssignment.revoked_by_name || 'Unknown'}
                  </p>
                </div>
                {selectedAssignment.revocation_reason && <div>
                    <label className="text-sm font-medium text-gray-600">
                      Revocation Reason
                    </label>
                    <p className="text-gray-900">
                      {selectedAssignment.revocation_reason}
                    </p>
                  </div>}
              </>}
            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>}
    </div>;
}