import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Users, BookOpen, TrendingUp, Clock, FileText, Calendar } from 'lucide-react';
export function TeacherClassDetailsPage() {
  const {
    assignmentId
  } = useParams<{
    assignmentId: string;
  }>();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('students');
  const [assignment, setAssignment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  useEffect(() => {
    if (assignmentId && user?.id) {
      fetchClassDetails();
    }
  }, [assignmentId, user?.id]);
  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch assignment details
      const {
        data: assignmentData,
        error: assignmentError
      } = await supabase.from('teacher_assignments').select(`
          *,
          subjects (name, coefficient, subject_type),
          classes (name, description)
        `).eq('id', assignmentId).eq('teacher_id', user?.id).single();
      if (assignmentError) throw assignmentError;
      if (!assignmentData) throw new Error('Assignment not found');
      setAssignment(assignmentData);
      // Fetch students in this class
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('id, full_name, admission_number, email, phone').eq('class_id', assignmentData.class_id).order('full_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
      // Fetch marks for this subject/class through enrollments
      const {
        data: enrollmentsForMarks,
        error: enrollmentsForMarksError
      } = await supabase.from('enrollments').select('id, student_id').eq('subject_id', assignmentData.subject_id);
      if (enrollmentsForMarksError) throw enrollmentsForMarksError;
      const enrollmentIds = (enrollmentsForMarks || []).map(e => e.id);
      if (enrollmentIds.length > 0) {
        const {
          data: marksData,
          error: marksError
        } = await supabase.from('marks').select(`
            *,
            enrollments!inner(student_id, students(full_name, admission_number)),
            sequences (name)
          `).in('enrollment_id', enrollmentIds).order('created_at', {
          ascending: false
        });
        if (marksError) throw marksError;
        // Flatten the nested structure. Supabase may return joined relations as
        // either an object or a single-element array depending on the relationship.
        const flattenedMarks = (marksData || []).map(mark => {
          const enrollment = Array.isArray(mark.enrollments) ? mark.enrollments[0] : mark.enrollments;
          const student = enrollment && (Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students);
          return { ...mark, students: student };
        });
        setMarks(flattenedMarks || []);
      } else {
        setMarks([]);
      }
      // Fetch attendance for this subject/class (if attendance table exists)
      try {
        const {
          data: attendanceData,
          error: attendanceError
        } = await supabase.from('attendance').select(`
            *,
            students (full_name, admission_number)
          `).eq('subject_id', assignmentData.subject_id).eq('class_id', assignmentData.class_id).order('date', {
          ascending: false
        }).limit(100);
        if (!attendanceError) {
          setAttendance(attendanceData || []);
        }
      } catch (err) {
        // Attendance table might not exist yet
        console.log('Attendance table not available');
        setAttendance([]);
      }
    } catch (err: any) {
      console.error('Error fetching class details:', err);
      setError(err.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };
  const studentsColumns = [{
    header: 'Admission No.',
    accessor: 'admission_number' as const,
    render: (row: any) => <span className="text-sm text-slate-600 font-mono">
          {row.admission_number || 'N/A'}
        </span>
  }, {
    header: 'Student Name',
    accessor: 'full_name' as const,
    render: (row: any) => <span className="font-medium text-slate-900">{row.full_name}</span>
  }, {
    header: 'Contact',
    accessor: 'email' as const,
    render: (row: any) => <div className="text-sm">
          <div className="text-slate-600">{row.email || 'No email'}</div>
          <div className="text-slate-500">{row.phone || 'No phone'}</div>
        </div>
  }];
  const marksColumns = [{
    header: 'Student',
    accessor: 'students' as const,
    render: (row: any) => <div>
          <div className="font-medium text-slate-900">
            {row.students?.full_name}
          </div>
          <div className="text-xs text-slate-500">
            {row.students?.admission_number}
          </div>
        </div>
  }, {
    header: 'Sequence',
    accessor: 'sequences' as const,
    render: (row: any) => <span className="text-sm text-slate-600">
          {row.sequences?.name || 'N/A'}
        </span>
  }, {
    header: 'Mark',
    accessor: 'score' as const,
    render: (row: any) => <span className="font-semibold text-slate-900">{row.score}/{row.out_of}</span>
  }, {
    header: 'Status',
    accessor: 'approved' as const,
    render: (row: any) => <Badge variant={row.approved ? 'success' : 'warning'}>
          {row.approved ? 'Approved' : 'Pending'}
        </Badge>
  }, {
    header: 'Date',
    accessor: 'created_at' as const,
    render: (row: any) => <span className="text-sm text-slate-600">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
  }];
  const attendanceColumns = [{
    header: 'Student',
    accessor: 'students' as const,
    render: (row: any) => <div>
          <div className="font-medium text-slate-900">
            {row.students?.full_name}
          </div>
          <div className="text-xs text-slate-500">
            {row.students?.admission_number}
          </div>
        </div>
  }, {
    header: 'Date',
    accessor: 'date' as const,
    render: (row: any) => <span className="text-sm text-slate-600">
          {new Date(row.date).toLocaleDateString()}
        </span>
  }, {
    header: 'Status',
    accessor: 'status' as const,
    render: (row: any) => <Badge variant={row.status === 'present' ? 'success' : 'error'}>
          {row.status}
        </Badge>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error || !assignment) {
    return <div className="p-6">
        <Alert variant="error" title="Error" message={error || 'Assignment not found'} />
        <Button variant="outline" onClick={() => navigate('/teacher/classes')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Button>
      </div>;
  }
  const avgMark = marks.length > 0
    ? marks.reduce((sum, m) => sum + (m.out_of > 0 ? (m.score / m.out_of) * 100 : 0), 0) / marks.length
    : 0;
  const attendanceRate = attendance.length > 0 ? attendance.filter(a => a.status === 'present').length / attendance.length * 100 : 0;
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/teacher/classes')} size="sm">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {assignment.subjects?.name}
          </h1>
          <p className="text-slate-500 mt-1">{assignment.classes?.name}</p>
        </div>
        <Badge variant={assignment.subjects?.subject_type === 'core' ? 'default' : 'secondary'}>
          {assignment.subjects?.subject_type}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Total Students</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {students.length}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Average Mark</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {avgMark.toFixed(1)}%
                </h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Attendance Rate</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {attendanceRate.toFixed(0)}%
                </h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Coefficient</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {assignment.subjects?.coefficient}
                </h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => navigate('/teacher/marks')} leftIcon={<FileText className="w-4 h-4" />}>
              Enter Marks
            </Button>
            <Button variant="outline" onClick={() => navigate('/teacher/attendance')} leftIcon={<Calendar className="w-4 h-4" />}>
              Mark Attendance
            </Button>
            <Button variant="outline" onClick={() => navigate('/teacher/reports')} leftIcon={<TrendingUp className="w-4 h-4" />}>
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
        {[
          { id: 'students', label: `Students (${students.length})` },
          { id: 'marks', label: `Marks (${marks.length})` },
          { id: 'attendance', label: `Attendance (${attendance.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {activeTab === 'students' && (students.length > 0
            ? renderTable(studentsColumns, students)
            : <div className="text-center py-12 text-slate-500">No students enrolled in this class yet.</div>)}

          {activeTab === 'marks' && (marks.length > 0
            ? renderTable(marksColumns, marks)
            : <div className="text-center py-12 text-slate-500">No marks recorded yet.</div>)}

          {activeTab === 'attendance' && (attendance.length > 0
            ? renderTable(attendanceColumns, attendance)
            : <div className="text-center py-12 text-slate-500">No attendance records yet.</div>)}
        </CardContent>
      </Card>
    </div>;
}

// Render a column definition array against rows using the shared Table primitives.
function renderTable(
  columns: { header: string; render: (row: any) => React.ReactNode }[],
  rows: any[]
) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, ri) => (
          <TableRow key={row.id ?? ri}>
            {columns.map((col, ci) => (
              <TableCell key={ci}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}