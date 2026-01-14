import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, BookOpen, Search, Download, Eye, Plus, Trash2, Filter, AlertTriangle, Edit, Grid, List, Users, BookMarked, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_id: string;
  class_name?: string;
}
interface Subject {
  id: string;
  name: string;
  coefficient: number;
  subject_type: 'core' | 'elective';
}
interface Enrollment {
  id: string;
  student_id: string;
  subject_id: string;
  student_name: string;
  subject_name: string;
  subject_type: 'core' | 'elective';
  created_at: string;
}
interface SubjectClassMapping {
  subject_id: string;
  class_id: string;
}
export function StudentSubjectEnrollmentPage() {
  const {
    user
  } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [subjectClassMappings, setSubjectClassMappings] = useState<SubjectClassMapping[]>([]);
  
  // Single Enrollment State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [enrollClassFilter, setEnrollClassFilter] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  
  // Bulk Enrollment State
  const [bulkStudents, setBulkStudents] = useState<string[]>([]);
  const [bulkSubjects, setBulkSubjects] = useState<string[]>([]);
  const [bulkClassFilter, setBulkClassFilter] = useState('');
  const [bulkAvailableSubjects, setBulkAvailableSubjects] = useState<Subject[]>([]);
  
  // Page Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    totalStudents: 0,
    avgEnrollmentsPerStudent: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  // Update available subjects when a student is selected (Single Enroll)
  useEffect(() => {
    if (selectedStudent) {
      const student = students.find(s => s.id === selectedStudent);
      if (student) {
        // Filter subjects based on student's class
        const classSubjects = subjectClassMappings.filter(m => m.class_id === student.class_id).map(m => m.subject_id);
        const filtered = subjects.filter(s => classSubjects.includes(s.id));
        setAvailableSubjects(filtered);
        // Load existing enrollments
        loadStudentEnrollments(student.id);
      }
    } else {
      setAvailableSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedStudent, students, subjects, subjectClassMappings]);
  // Update available subjects when class filter changes (Bulk Enroll)
  useEffect(() => {
    if (bulkClassFilter) {
      // Filter subjects based on selected class
      const classSubjects = subjectClassMappings.filter(m => m.class_id === bulkClassFilter).map(m => m.subject_id);
      const filtered = subjects.filter(s => classSubjects.includes(s.id));
      setBulkAvailableSubjects(filtered);
      setBulkSubjects([]); // Reset selected subjects when class changes
      setBulkStudents([]); // Reset selected students when class changes
    } else {
      setBulkAvailableSubjects([]);
      setBulkSubjects([]);
      setBulkStudents([]);
    }
  }, [bulkClassFilter, subjectClassMappings, subjects]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [classesData, studentsData, subjectsData, enrollmentsData, mappingsData] = await Promise.all([
        supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'),
        supabase.from('students').select('id, full_name, admission_number, class_id').eq('school_id', user.school_id).order('full_name'),
        supabase.from('subjects').select('id, name, coefficient, subject_type').eq('school_id', user.school_id).order('name'),
        supabase.from('enrollments').select('id, student_id, subject_id, created_at').eq('school_id', user.school_id),
        supabase.from('subject_class_mappings').select('subject_id, class_id')
      ]);
      if (classesData.error) throw classesData.error;
      if (studentsData.error) throw studentsData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (enrollmentsData.error) throw enrollmentsData.error;
      if (mappingsData.error) throw mappingsData.error;
      const enrichedStudents = (studentsData.data || []).map(student => {
        const classData = classesData.data?.find(c => c.id === student.class_id);
        return {
          ...student,
          class_name: classData?.name || 'Unknown'
        };
      });
      const enrichedEnrollments = (enrollmentsData.data || []).map(enrollment => {
        const student = enrichedStudents.find(s => s.id === enrollment.student_id);
        const subject = subjectsData.data?.find(s => s.id === enrollment.subject_id);
        return {
          ...enrollment,
          student_name: student?.full_name || 'Unknown',
          subject_name: subject?.name || 'Unknown',
          subject_type: subject?.subject_type || 'core'
        };
      });
      setStudents(enrichedStudents);
      setSubjects(subjectsData.data || []);
      setClasses(classesData.data || []);
      setEnrollments(enrichedEnrollments);
      setSubjectClassMappings(mappingsData.data || []);
      const uniqueStudents = new Set(enrichedEnrollments.map(e => e.student_id));
      setStats({
        totalEnrollments: enrichedEnrollments.length,
        totalStudents: uniqueStudents.size,
        avgEnrollmentsPerStudent: uniqueStudents.size > 0 ? Math.round(enrichedEnrollments.length / uniqueStudents.size * 10) / 10 : 0
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const loadStudentEnrollments = async (studentId: string) => {
    try {
      const {
        data,
        error
      } = await supabase
        .from('enrollments')
        .select('id, subject_id')
        .eq('student_id', studentId)
        .eq('school_id', user?.school_id ?? '');
      if (error) throw error;
      const enrolledSubjectIds = (data || []).map(e => e.subject_id);
      setSelectedSubjects(enrolledSubjectIds);
    } catch (err: any) {
      console.error('Error loading enrollments:', err);
      // Don't set global error here to avoid disrupting the UI flow
    }
  };
  // Compute filtered enrollments
  const filteredEnrollments = useMemo(() => {
    let filtered = [...enrollments];
    
    // Filter by class (through student)
    if (filterClass) {
      const studentIdsInClass = students
        .filter(s => s.class_id === filterClass)
        .map(s => s.id);
      filtered = filtered.filter(e => studentIdsInClass.includes(e.student_id));
    }
    
    if (filterStudent) {
      filtered = filtered.filter(e => e.student_id === filterStudent);
    }
    
    if (filterSubject) {
      filtered = filtered.filter(e => e.subject_id === filterSubject);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.student_name.toLowerCase().includes(query) || 
        e.subject_name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [enrollments, students, filterClass, filterStudent, filterSubject, searchQuery]);

  // Compute grouped students by class
  const groupedStudents = useMemo(() => {
    let filtered = [...students];

    // Apply class filter
    if (filterClass) {
      filtered = filtered.filter(s => s.class_id === filterClass);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name.toLowerCase().includes(query) || 
        s.admission_number.toLowerCase().includes(query)
      );
    }

    // Group by class name
    const grouped: Record<string, Student[]> = {};
    filtered.forEach(student => {
      const className = student.class_name || 'Unknown';
      if (!grouped[className]) {
        grouped[className] = [];
      }
      grouped[className].push(student);
    });

    return grouped;
  }, [students, filterClass, searchQuery]);

  // Open class modal
  const openClassModal = (className: string) => {
    setSelectedClassName(className);
    setClassModalOpen(true);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
  const handleSubjectToggle = (subjectId: string, isBulk = false) => {
    if (isBulk) {
      setBulkSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
    } else {
      setSelectedSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
    }
  };
  const handleSaveEnrollments = async () => {
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const {
        data: currentEnrollments
      } = await supabase
        .from('enrollments')
        .select('id, subject_id')
        .eq('student_id', selectedStudent)
        .eq('school_id', user?.school_id ?? '');
      const currentSubjectIds = (currentEnrollments || []).map(e => e.subject_id);
      const subjectsToAdd = selectedSubjects.filter(id => !currentSubjectIds.includes(id));
      const subjectsToRemove = currentSubjectIds.filter(id => !selectedSubjects.includes(id));
      if (subjectsToAdd.length > 0) {
        const enrollmentsToInsert = subjectsToAdd.map(subjectId => ({
          student_id: selectedStudent,
          subject_id: subjectId,
          school_id: user?.school_id // Explicitly add school_id
        }));
        const {
          error: insertError
        } = await supabase.from('enrollments').insert(enrollmentsToInsert);
        if (insertError) throw insertError;
      }
      if (subjectsToRemove.length > 0) {
        const enrollmentsToDelete = (currentEnrollments || []).filter(e => subjectsToRemove.includes(e.subject_id)).map(e => e.id);
        const {
          error: deleteError
        } = await supabase
          .from('enrollments')
          .delete()
          .in('id', enrollmentsToDelete)
          .eq('school_id', user?.school_id);
        if (deleteError) throw deleteError;
      }
      setSuccess('Enrollments saved successfully');
      setShowEnrollModal(false);
      resetForms();
      fetchData();
    } catch (err: any) {
      console.error('Error saving enrollments:', err);
      if (err.code === '42703' || err.message?.includes('school_id')) {
        setError('Database configuration issue: The enrollments table is missing the school_id column required by audit triggers. Please contact your administrator.');
      } else {
        setError(err.message || 'Failed to save enrollments');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleBulkEnroll = async () => {
    if (bulkStudents.length === 0 || bulkSubjects.length === 0) {
      setError('Please select at least one student and one subject');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const enrollmentsToInsert = [];
      for (const studentId of bulkStudents) {
        for (const subjectId of bulkSubjects) {
          const exists = enrollments.find(e => e.student_id === studentId && e.subject_id === subjectId);
          if (!exists) {
            enrollmentsToInsert.push({
              student_id: studentId,
              subject_id: subjectId,
              school_id: user?.school_id // Explicitly add school_id
            });
          }
        }
      }
      if (enrollmentsToInsert.length === 0) {
        setError('All selected enrollments already exist');
        setLoading(false);
        return;
      }
      const {
        error: insertError
      } = await supabase.from('enrollments').insert(enrollmentsToInsert);
      if (insertError) throw insertError;
      setSuccess(`Successfully created ${enrollmentsToInsert.length} enrollment(s)`);
      setShowBulkModal(false);
      resetForms();
      fetchData();
    } catch (err: any) {
      console.error('Error bulk enrolling:', err);
      if (err.code === '42703' || err.message?.includes('school_id')) {
        setError('Database configuration issue: The enrollments table is missing the school_id column required by audit triggers. Please contact your administrator.');
      } else {
        setError(err.message || 'Failed to create bulk enrollments');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) return;
    try {
      const {
        error
      } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)
        .eq('school_id', user?.school_id ?? '');
      if (error) throw error;
      setSuccess('Enrollment removed successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error removing enrollment:', err);
      setError(err.message || 'Failed to remove enrollment');
    }
  };
  const handleExport = () => {
    const exportData = filteredEnrollments.map(e => ({
      Student: e.student_name,
      Subject: e.subject_name,
      'Subject Type': e.subject_type,
      'Enrolled Date': new Date(e.created_at).toLocaleDateString()
    }));
    downloadCSV(exportData, `student_enrollments_${new Date().toISOString().split('T')[0]}.csv`);
  };
  const resetForms = () => {
    setSelectedStudent('');
    setSelectedSubjects([]);
    setEnrollClassFilter('');
    setAvailableSubjects([]);
    setBulkStudents([]);
    setBulkSubjects([]);
    setBulkClassFilter('');
    setBulkAvailableSubjects([]);
  };
  const getStudentEnrollmentCount = (studentId: string) => {
    return enrollments.filter(e => e.student_id === studentId).length;
  };
  // Filter students for single enroll modal
  const filteredStudentsForEnroll = enrollClassFilter ? students.filter(s => s.class_id === enrollClassFilter) : students;
  // Filter students for bulk enroll modal
  const filteredStudentsForBulk = bulkClassFilter ? students.filter(s => s.class_id === bulkClassFilter) : [];
  if (loading && students.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>;
  }
  return <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Student Subject Enrollment
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Manage student subject enrollments
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filteredEnrollments.length === 0} leftIcon={<Download className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => {
          resetForms();
          setShowBulkModal(true);
        }} leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            Bulk Enroll
          </Button>
          <Button onClick={() => {
          resetForms();
          setShowEnrollModal(true);
        }} leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto text-sm">
            Enroll Student
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Error">{error}</Alert>}
      {success && <Alert type="success" title="Success">{success}</Alert>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Enrollments
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalEnrollments}
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
                  Enrolled Students
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalStudents}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-xl flex-shrink-0">
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Avg per Student
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.avgEnrollmentsPerStudent}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-xl flex-shrink-0">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School-Wide Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Enrollments Per Class Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Enrollments by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(groupedStudents).map(([className, students]) => ({
                name: className,
                students: students.length,
                enrollments: enrollments.filter(e => students.some(s => s.id === e.student_id)).length
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="students" fill="#8b5cf6" name="Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrollments" fill="#3b82f6" name="Enrollments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Core vs Elective Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              Subject Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Core Subjects', value: enrollments.filter(e => e.subject_type === 'core').length, color: '#10b981' },
                    { name: 'Elective Subjects', value: enrollments.filter(e => e.subject_type === 'elective').length, color: '#3b82f6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Core Subjects', value: enrollments.filter(e => e.subject_type === 'core').length, color: '#10b981' },
                    { name: 'Elective Subjects', value: enrollments.filter(e => e.subject_type === 'elective').length, color: '#3b82f6' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search students by name or admission number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm text-gray-600 mr-2">View:</span>
              <Button
                variant={viewMode === 'card' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                leftIcon={<Grid className="h-4 w-4" />}
              >
                Card
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                leftIcon={<List className="h-4 w-4" />}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment List - Grouped by Class */}
      <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {Object.keys(groupedStudents).length > 0 ? (
          Object.entries(groupedStudents).map(([className, studentsInClass]) => {
            const totalEnrollments = enrollments.filter(e => 
              studentsInClass.some(s => s.id === e.student_id)
            ).length;
            const coreCount = enrollments.filter(e => 
              studentsInClass.some(s => s.id === e.student_id) && e.subject_type === 'core'
            ).length;
            const electiveCount = enrollments.filter(e => 
              studentsInClass.some(s => s.id === e.student_id) && e.subject_type === 'elective'
            ).length;

            return (
              <div key={className} onClick={() => openClassModal(className)} className="cursor-pointer">
                <Card className={`${viewMode === 'card' ? 'hover:shadow-lg' : ''} hover:bg-gray-50 transition-all`}>
                  <CardHeader className={viewMode === 'card' ? 'pb-3' : ''}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg mb-2">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        {className}
                      </CardTitle>
                      {viewMode === 'card' && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">{studentsInClass.length} Students</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BookMarked className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">{totalEnrollments} Enrollments</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-600">{coreCount} Core</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-gray-600">{electiveCount} Elective</span>
                          </div>
                        </div>
                      )}
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="neutral">{studentsInClass.length} Students</Badge>
                          <Badge variant="info">{totalEnrollments} Enrollments</Badge>
                          <span className="text-sm text-gray-500">{coreCount} Core • {electiveCount} Elective</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
              <p className="text-gray-400 text-sm mt-2">
                {students.length === 0 ? 'Add students to get started' : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Single Enroll Modal */}
      <Dialog isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Enroll Student in Subjects">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Class Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Filter by Class
            </label>
            <Select value={enrollClassFilter} onValueChange={setEnrollClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class to Filter Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Classes</SelectItem>
                {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Select Student
            </label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudentsForEnroll.map(student => <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.class_name})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          {selectedStudent && <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Available Subjects
                </h3>
                <span className="text-xs text-gray-500">
                  {selectedSubjects.length} selected
                </span>
              </div>

              {availableSubjects.length === 0 ? <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      No subjects available
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      No subjects are mapped to this student's class. Please
                      configure subject-class mappings first.
                    </p>
                  </div>
                </div> : <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {availableSubjects.map(subject => <div key={subject.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleSubjectToggle(subject.id)}>
                      <Checkbox checked={selectedSubjects.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} label="" />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {subject.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={subject.subject_type === 'core' ? 'success' : 'neutral'} className="text-[10px] px-1.5 py-0">
                            {subject.subject_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Coef: {subject.coefficient}
                          </span>
                        </div>
                      </div>
                    </div>)}
                </div>}
            </div>}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleSaveEnrollments} disabled={loading || !selectedStudent || selectedSubjects.length === 0} className="flex-1">
              {loading ? 'Saving...' : 'Save Enrollments'}
            </Button>
            <Button variant="outline" onClick={() => setShowEnrollModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk Enroll Modal */}
      <Dialog isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Subject Enrollment">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Class Filter (Required for Bulk) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Select Class (Required)
            </label>
            <Select value={bulkClassFilter} onValueChange={setBulkClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!bulkClassFilter ? <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Please select a class to continue
            </div> : <>
              {/* Student Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Students
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setBulkStudents(filteredStudentsForBulk.map(s => s.id))}>
                      Select All
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setBulkStudents([])}>
                      Clear
                    </Button>
                  </div>
                </div>

                {filteredStudentsForBulk.length === 0 ? <p className="text-sm text-gray-500 italic">
                    No students found in this class
                  </p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {filteredStudentsForBulk.map(student => <div key={student.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                        <Checkbox checked={bulkStudents.includes(student.id)} onChange={() => {
                  setBulkStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]);
                }} label={student.full_name} />
                      </div>)}
                  </div>}
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {bulkStudents.length} selected
                </p>
              </div>

              {/* Subject Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Subjects
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setBulkSubjects(bulkAvailableSubjects.map(s => s.id))}>
                      Select All
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setBulkSubjects([])}>
                      Clear
                    </Button>
                  </div>
                </div>

                {bulkAvailableSubjects.length === 0 ? <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    No subjects mapped to this class.
                  </div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {bulkAvailableSubjects.map(subject => <div key={subject.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                        <Checkbox checked={bulkSubjects.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id, true)} label={subject.name} />
                      </div>)}
                  </div>}
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {bulkSubjects.length} selected
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Will create{' '}
                  <span className="font-bold text-gray-900">
                    {bulkStudents.length * bulkSubjects.length}
                  </span>{' '}
                  enrollment(s)
                </p>
              </div>
            </>}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleBulkEnroll} disabled={loading || bulkStudents.length === 0 || bulkSubjects.length === 0} className="flex-1">
              {loading ? 'Processing...' : 'Create Enrollments'}
            </Button>
            <Button variant="outline" onClick={() => setShowBulkModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Class Details Modal */}
      {classModalOpen && selectedClassName && (() => {
        const classStudents = groupedStudents[selectedClassName] || [];
        const classEnrollments = enrollments.filter(e => 
          classStudents.some(s => s.id === e.student_id)
        );
        const coreEnrollments = classEnrollments.filter(e => e.subject_type === 'core').length;
        const electiveEnrollments = classEnrollments.filter(e => e.subject_type === 'elective').length;
        
        // Subject distribution for this class
        const subjectCounts: Record<string, number> = {};
        classEnrollments.forEach(e => {
          subjectCounts[e.subject_name] = (subjectCounts[e.subject_name] || 0) + 1;
        });
        const subjectData = Object.entries(subjectCounts)
          .map(([name, count]) => ({ name, students: count }))
          .sort((a, b) => b.students - a.students);

        return (
          <Dialog
            isOpen={classModalOpen}
            onClose={() => {
              setClassModalOpen(false);
              setSelectedClassName('');
            }}
            title={`${selectedClassName} - Class Analytics`}
            size="xl"
          >
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Class Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{classStudents.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Core</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{coreEnrollments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Elective</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{electiveEnrollments}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Subject Distribution Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      Subject Enrollment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={subjectData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#3b82f6" name="Students" radius={[0, 4, 4, 0]}>
                          {subjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Core vs Elective Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-green-600" />
                      Core vs Elective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Core', value: coreEnrollments, color: '#10b981' },
                            { name: 'Elective', value: electiveEnrollments, color: '#3b82f6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Students List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Students in {selectedClassName}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {classStudents.map(student => {
                    const studentEnrollments = enrollments.filter(e => e.student_id === student.id);
                    return (
                      <div key={student.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{student.full_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{student.admission_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="info">{studentEnrollments.length} Subjects</Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student.id);
                                setClassModalOpen(false);
                                setShowEnrollModal(true);
                              }} 
                              leftIcon={<Edit className="h-4 w-4" />}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dashed">
                          <div className="flex flex-wrap gap-2">
                            {studentEnrollments.map(enrollment => (
                              <Badge 
                                key={enrollment.id} 
                                variant={enrollment.subject_type === 'core' ? 'success' : 'info'}
                              >
                                {enrollment.subject_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Dialog>
        );
      })()}

      {/* View Details Modal - Professional & Sophisticated */}
      {viewModalOpen && selectedEnrollment && (
        <Dialog
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedEnrollment(null);
          }}
          title="Enrollment Details"
          size="md"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <div className="bg-indigo-100 rounded-full p-3">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedEnrollment.student_name}</h2>
                <p className="text-sm text-gray-500">Student</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <div className="bg-blue-100 rounded-full p-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{selectedEnrollment.subject_name}</h2>
                <p className="text-sm text-gray-500">Subject</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <div className="bg-green-100 rounded-full p-3">
                <Badge variant={selectedEnrollment.subject_type === 'core' ? 'success' : 'neutral'} className="text-base px-3 py-1">
                  {selectedEnrollment.subject_type.charAt(0).toUpperCase() + selectedEnrollment.subject_type.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject Type</p>
              </div>
            </div>
            {/* Subject Details: Coefficient */}
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="font-bold text-yellow-700 text-lg">{(() => {
                  // Find subject details
                  const subj = subjects.find(s => s.id === selectedEnrollment.subject_id);
                  return subj ? subj.coefficient : '-';
                })()}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject Coefficient</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <div className="bg-gray-100 rounded-full p-3">
                <Eye className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">{new Date(selectedEnrollment.created_at).toLocaleDateString()}</h2>
                <p className="text-sm text-gray-500">Enrolled Date</p>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>;
}