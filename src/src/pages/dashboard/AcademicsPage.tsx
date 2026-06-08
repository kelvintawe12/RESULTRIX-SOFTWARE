import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { BookOpen, Users, GraduationCap, Search, Filter, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClassDetailsModal } from '../../components/dashboard/ClassDetailsModal';
import { SubjectDetailsModal } from '../../components/dashboard/SubjectDetailsModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
// Types
interface ClassData {
  id: string;
  name: string;
  description: string | null;
  student_count: number;
  capacity: number;
  teacher_name: string | null;
  teacher_id: string | null;
  subject_count: number;
}
interface SubjectData {
  id: string;
  name: string;
  coefficient: number;
  subject_type: 'core' | 'elective';
  enrolled_students: number;
  teacher_count: number;
  status: string;
}
export function AcademicsPage() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  // Data states
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [subjectsData, setSubjectsData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch classes data
  useEffect(() => {
    if (!user?.school_id) return;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        // Fetch classes
        const {
          data: classes,
          error: classError
        } = await supabase.from('classes').select('id, name, description').eq('school_id', user.school_id);
        if (classError) throw classError;
        // For each class, get counts separately
        const enrichedClasses = await Promise.all((classes || []).map(async cls => {
          // Get student count
          const {
            count: studentCount
          } = await supabase.from('students').select('*', {
            count: 'exact',
            head: true
          }).eq('class_id', cls.id);
          // Get subject count
          const {
            count: subjectCount
          } = await supabase.from('subject_class_mappings').select('*', {
            count: 'exact',
            head: true
          }).eq('class_id', cls.id);
          // Get first teacher assigned to this class
          const {
            data: teacherAssignment
          } = await supabase.from('teacher_assignments').select('teacher_id, users!teacher_assignments_teacher_id_fkey(id, full_name)').eq('class_id', cls.id).limit(1).maybeSingle();
          const teacherUser = Array.isArray(teacherAssignment?.users) ? teacherAssignment?.users[0] : teacherAssignment?.users;
          return {
            id: cls.id,
            name: cls.name,
            description: cls.description,
            student_count: studentCount || 0,
            capacity: 40,
            teacher_name: teacherUser?.full_name || 'Unassigned',
            teacher_id: teacherUser?.id || null,
            subject_count: subjectCount || 0
          };
        }));
        setClassesData(enrichedClasses);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes data');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user?.school_id]);
  // Fetch subjects data
  useEffect(() => {
    if (!user?.school_id) return;
    const fetchSubjects = async () => {
      try {
        // Fetch subjects
        const {
          data: subjects,
          error: subjectError
        } = await supabase.from('subjects').select('id, name, coefficient, subject_type').eq('school_id', user.school_id);
        if (subjectError) throw subjectError;
        // For each subject, get counts
        const enrichedSubjects = await Promise.all((subjects || []).map(async sub => {
          // Get enrollment count
          const {
            count: enrollmentCount
          } = await supabase.from('enrollments').select('*', {
            count: 'exact',
            head: true
          }).eq('subject_id', sub.id);
          // Get teacher count
          const {
            count: teacherCount
          } = await supabase.from('teacher_assignments').select('*', {
            count: 'exact',
            head: true
          }).eq('subject_id', sub.id);
          return {
            id: sub.id,
            name: sub.name,
            coefficient: sub.coefficient,
            subject_type: sub.subject_type,
            enrolled_students: enrollmentCount || 0,
            teacher_count: teacherCount || 0,
            status: 'Active'
          };
        }));
        setSubjectsData(enrichedSubjects);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects data');
      }
    };
    fetchSubjects();
  }, [user?.school_id]);
  const handleViewClass = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsClassModalOpen(true);
  };
  const handleViewSubject = (sub: SubjectData) => {
    setSelectedSubject(sub);
    setIsSubjectModalOpen(true);
  };
  // Calculate summary stats
  const totalClasses = classesData.length;
  const totalStudents = classesData.reduce((sum, cls) => sum + cls.student_count, 0);
  const avgClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>;
  }
  if (error) {
    return <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Academic Management
          </h1>
          <p className="text-gray-500">
            Manage classes, subjects, and curriculum allocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Academic Calendar</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="classes">Classes & Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects & Curriculum</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Classes
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {totalClasses}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Students
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {totalStudents}
                  </h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Avg Class Size
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {avgClassSize}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-lg border shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search classes..." className="pl-9" />
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Classes Table */}
          <Card>
            <CardContent className="p-0">
              {classesData.length === 0 ? <div className="p-8 text-center text-gray-500">
                  No classes found. Create your first class to get started.
                </div> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classesData.map(cls => <TableRow key={cls.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900">
                          {cls.name}
                        </TableCell>
                        <TableCell>
                          {cls.teacher_id ? <button onClick={() => navigate(`/dashboard/teachers/${cls.teacher_id}`)} className="text-indigo-600 hover:underline">
                              {cls.teacher_name}
                            </button> : <span className="text-gray-400">
                              {cls.teacher_name}
                            </span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                              <div className="bg-blue-600 h-2 rounded-full" style={{
                          width: `${Math.min(cls.student_count / cls.capacity * 100, 100)}%`
                        }} />
                            </div>
                            <span className="text-sm text-gray-600">
                              {cls.student_count}/{cls.capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cls.subject_count} subjects
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewClass(cls)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Subjects
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {subjectsData.length}
                  </h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Core Subjects
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {subjectsData.filter(s => s.subject_type === 'core').length}
                  </h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Elective Subjects
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {subjectsData.filter(s => s.subject_type === 'elective').length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Enrollments
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {subjectsData.reduce((sum, s) => sum + s.enrolled_students, 0)}
                  </h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              {subjectsData.length === 0 ? <div className="p-8 text-center text-gray-500">
                  No subjects found. Add subjects to your curriculum.
                </div> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead>Enrolled Students</TableHead>
                      <TableHead>Teachers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectsData.map(sub => <TableRow key={sub.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900">
                          {sub.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.subject_type === 'core' ? 'default' : 'secondary'}>
                            {sub.subject_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{sub.coefficient}</TableCell>
                        <TableCell>{sub.enrolled_students}</TableCell>
                        <TableCell>{sub.teacher_count}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSubject(sub)}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ClassDetailsModal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} classData={selectedClass as any} />
      <SubjectDetailsModal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} subjectData={selectedSubject as any} />
    </div>;
}