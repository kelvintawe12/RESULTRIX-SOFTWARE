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
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, Eye, Search, Filter, Download, X, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
interface Mark {
  id: string;
  enrollment_id: string;
  sequence_id: string;
  score: number;
  out_of: number;
  percentage: number;
  attendance_present: number;
  attendance_total: number;
  comments: string | null;
  approved: boolean;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  subject_name: string;
  subject_coefficient: number;
  sequence_name: string;
  teacher_name: string;
}
export function MarksReviewPage() {
  const {
    user
  } = useAuth();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [filteredMarks, setFilteredMarks] = useState<Mark[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSequence, setFilterSequence] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterMaxScore, setFilterMaxScore] = useState('');
  const [filterMinAttendance, setFilterMinAttendance] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMark, setSelectedMark] = useState<Mark | null>(null);
  const [stats, setStats] = useState({
    totalMarks: 0,
    approvedMarks: 0,
    pendingMarks: 0,
    avgScore: 0,
    avgAttendance: 0,
    highestScore: 0,
    lowestScore: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [marks, filterClass, filterSubject, filterSequence, filterTeacher, filterStatus, filterMinScore, filterMaxScore, filterMinAttendance, searchQuery]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [classesData, subjectsData, sequencesData, teachersData, marksData] = await Promise.all([
        supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'),
        supabase.from('subjects').select('id, name, coefficient').eq('school_id', user.school_id).order('name'),
        supabase.from('sequences').select('id, name, terms!inner(academic_year_id, academic_years!inner(school_id))').eq('terms.academic_years.school_id', user.school_id).order('name'),
        supabase.from('users').select('id, full_name').eq('school_id', user.school_id).eq('role', 'teacher').order('full_name'),
        supabase.from('marks').select('*').eq('school_id', user.school_id).order('created_at', {
          ascending: false
        })
      ]);
      if (classesData.error) throw classesData.error;
      if (subjectsData.error) throw subjectsData.error;
      if (sequencesData.error) throw sequencesData.error;
      if (teachersData.error) throw teachersData.error;
      if (marksData.error) throw marksData.error;
      // Enrich marks with related data
      const enrichedMarks = await Promise.all((marksData.data || []).map(async mark => {
        const {
          data: enrollment
        } = await supabase.from('enrollments').select('student_id, subject_id').eq('id', mark.enrollment_id).single();
        if (!enrollment) return null;
        const {
          data: student
        } = await supabase.from('students').select('full_name, admission_number, class_id').eq('id', enrollment.student_id).single();
        const subject = subjectsData.data?.find(s => s.id === enrollment.subject_id);
        const classData = classesData.data?.find(c => c.id === student?.class_id);
        const sequence = sequencesData.data?.find(s => s.id === mark.sequence_id);
        const teacher = teachersData.data?.find(t => t.id === mark.submitted_by);
        return {
          ...mark,
          percentage: mark.score / mark.out_of * 100,
          student_name: student?.full_name || 'Unknown',
          admission_number: student?.admission_number || 'N/A',
          class_name: classData?.name || 'Unknown',
          subject_name: subject?.name || 'Unknown',
          subject_coefficient: subject?.coefficient || 1,
          sequence_name: sequence?.name || 'Unknown',
          teacher_name: teacher?.full_name || 'Unknown'
        };
      }));
      const validMarks = enrichedMarks.filter(m => m !== null) as Mark[];
      setClasses(classesData.data || []);
      setSubjects(subjectsData.data || []);
      setSequences(sequencesData.data || []);
      setTeachers(teachersData.data || []);
      setMarks(validMarks);
      const scores = validMarks.map(m => m.percentage);
      const attendanceRates = validMarks.filter(m => m.attendance_total > 0).map(m => m.attendance_present / m.attendance_total * 100);
      setStats({
        totalMarks: validMarks.length,
        approvedMarks: validMarks.filter(m => m.approved).length,
        pendingMarks: validMarks.filter(m => !m.approved).length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length * 10) / 10 : 0,
        avgAttendance: attendanceRates.length > 0 ? Math.round(attendanceRates.reduce((sum, a) => sum + a, 0) / attendanceRates.length * 10) / 10 : 0,
        highestScore: scores.length > 0 ? Math.round(Math.max(...scores) * 10) / 10 : 0,
        lowestScore: scores.length > 0 ? Math.round(Math.min(...scores) * 10) / 10 : 0
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load marks');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...marks];
    if (filterClass) {
      filtered = filtered.filter(m => {
        const classId = classes.find(c => c.name === m.class_name)?.id;
        return classId === filterClass;
      });
    }
    if (filterSubject) {
      filtered = filtered.filter(m => {
        const subjectId = subjects.find(s => s.name === m.subject_name)?.id;
        return subjectId === filterSubject;
      });
    }
    if (filterSequence) filtered = filtered.filter(m => m.sequence_id === filterSequence);
    if (filterTeacher) filtered = filtered.filter(m => m.submitted_by === filterTeacher);
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => filterStatus === 'approved' ? m.approved : !m.approved);
    }
    if (filterMinScore) {
      filtered = filtered.filter(m => m.percentage >= parseFloat(filterMinScore));
    }
    if (filterMaxScore) {
      filtered = filtered.filter(m => m.percentage <= parseFloat(filterMaxScore));
    }
    if (filterMinAttendance) {
      filtered = filtered.filter(m => {
        if (m.attendance_total === 0) return false;
        const attendanceRate = m.attendance_present / m.attendance_total * 100;
        return attendanceRate >= parseFloat(filterMinAttendance);
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.student_name.toLowerCase().includes(query) || m.admission_number.toLowerCase().includes(query) || m.subject_name.toLowerCase().includes(query));
    }
    setFilteredMarks(filtered);
  };
  const handleClearFilters = () => {
    setFilterClass('');
    setFilterSubject('');
    setFilterSequence('');
    setFilterTeacher('');
    setFilterStatus('all');
    setFilterMinScore('');
    setFilterMaxScore('');
    setFilterMinAttendance('');
    setSearchQuery('');
  };
  const handleApprove = async (markId: string) => {
    try {
      const {
        error: updateError
      } = await supabase.from('marks').update({
        approved: true
      }).eq('id', markId);
      if (updateError) throw updateError;
      setSuccess('Mark approved successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error approving mark:', err);
      setError(err.message || 'Failed to approve mark');
    }
  };
  const handleBulkApprove = async () => {
    if (!confirm(`Approve ${filteredMarks.filter(m => !m.approved).length} pending marks?`)) return;
    try {
      setLoading(true);
      const pendingIds = filteredMarks.filter(m => !m.approved).map(m => m.id);
      const {
        error: updateError
      } = await supabase.from('marks').update({
        approved: true
      }).in('id', pendingIds);
      if (updateError) throw updateError;
      setSuccess(`Successfully approved ${pendingIds.length} mark(s)`);
      fetchData();
    } catch (err: any) {
      console.error('Error bulk approving:', err);
      setError(err.message || 'Failed to approve marks');
    } finally {
      setLoading(false);
    }
  };
  const handleExport = () => {
    const exportData = filteredMarks.map(m => ({
      Student: m.student_name,
      'Admission No': m.admission_number,
      Class: m.class_name,
      Subject: m.subject_name,
      Sequence: m.sequence_name,
      Score: `${m.score}/${m.out_of}`,
      Percentage: `${m.percentage.toFixed(1)}%`,
      Attendance: `${m.attendance_present}/${m.attendance_total}`,
      Teacher: m.teacher_name,
      Status: m.approved ? 'Approved' : 'Pending',
      Submitted: new Date(m.created_at).toLocaleDateString()
    }));
    downloadCSV(exportData, `marks_review_${new Date().toISOString().split('T')[0]}.csv`);
  };
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  if (loading && marks.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Review</h1>
          <p className="text-gray-500">Review and approve submitted marks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {stats.pendingMarks > 0 && <Button variant="primary" onClick={handleBulkApprove} leftIcon={<CheckCircle className="h-4 w-4" />}>
              Approve All ({stats.pendingMarks})
            </Button>}
          <Button variant="outline" onClick={handleExport} disabled={filteredMarks.length === 0} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Total Marks</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalMarks}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Approved</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">
              {stats.approvedMarks}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Pending</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {stats.pendingMarks}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Avg Score</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.avgScore}%
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Attendance</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">
              {stats.avgAttendance}%
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <p className="text-xs font-medium text-gray-600">Highest</p>
            </div>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.highestScore}%
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <p className="text-xs font-medium text-gray-600">Lowest</p>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              {stats.lowestScore}%
            </h3>
          </CardContent>
        </Card>
      </div>

      {showFilters && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advanced Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} leftIcon={<X className="h-4 w-4" />}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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

              <Select value={filterSequence} onValueChange={setFilterSequence}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Sequence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sequences</SelectItem>
                  {sequences.map(seq => <SelectItem key={seq.id} value={seq.id}>
                      {seq.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

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

              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Input type="number" label="Min Score %" value={filterMinScore} onChange={e => setFilterMinScore(e.target.value)} placeholder="0" />

              <Input type="number" label="Max Score %" value={filterMaxScore} onChange={e => setFilterMaxScore(e.target.value)} placeholder="100" />

              <Input type="number" label="Min Attendance %" value={filterMinAttendance} onChange={e => setFilterMinAttendance(e.target.value)} placeholder="0" />
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Marks ({filteredMarks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMarks.length === 0 ? <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No marks found</p>
              <p className="text-gray-400 text-sm mt-2">
                {marks.length === 0 ? 'Marks will appear here once submitted' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {filteredMarks.map(mark => <div key={mark.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${mark.approved ? 'bg-green-50' : 'bg-amber-50'}`}>
                        {mark.approved ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {mark.student_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {mark.admission_number}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {mark.class_name}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs font-medium text-gray-700">
                            {mark.subject_name}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {mark.sequence_name}
                          </span>
                          <Badge variant={mark.approved ? 'default' : 'secondary'}>
                            {mark.approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div>
                            <span className="text-xs text-gray-500">
                              Score:{' '}
                            </span>
                            <span className={`text-sm font-bold ${getScoreColor(mark.percentage)}`}>
                              {mark.score}/{mark.out_of} (
                              {mark.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          {mark.attendance_total > 0 && <div>
                              <span className="text-xs text-gray-500">
                                Attendance:{' '}
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {mark.attendance_present}/
                                {mark.attendance_total}
                              </span>
                            </div>}
                          <div>
                            <span className="text-xs text-gray-500">By: </span>
                            <span className="text-sm text-gray-700">
                              {mark.teacher_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedMark(mark);
                setViewModalOpen(true);
              }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!mark.approved && <Button variant="outline" size="sm" onClick={() => handleApprove(mark.id)} leftIcon={<CheckCircle className="h-4 w-4" />}>
                        Approve
                      </Button>}
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedMark && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedMark(null);
    }} title="Mark Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Student
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedMark.student_name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedMark.admission_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Class
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedMark.class_name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Subject
                </label>
                <p className="text-gray-900">{selectedMark.subject_name}</p>
                <p className="text-xs text-gray-500">
                  Coefficient: {selectedMark.subject_coefficient}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Sequence
                </label>
                <p className="text-gray-900">{selectedMark.sequence_name}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Performance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedMark.score}/{selectedMark.out_of}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className={`text-2xl font-bold ${getScoreColor(selectedMark.percentage)}`}>
                    {selectedMark.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedMark.attendance_present}/
                    {selectedMark.attendance_total}
                  </p>
                </div>
              </div>
            </div>

            {selectedMark.comments && <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">
                  Comments
                </label>
                <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                  {selectedMark.comments}
                </p>
              </div>}

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Submitted By
                </label>
                <p className="text-gray-900">{selectedMark.teacher_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={selectedMark.approved ? 'default' : 'secondary'}>
                    {selectedMark.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-600">
                Submitted
              </label>
              <p className="text-gray-900">
                {new Date(selectedMark.created_at).toLocaleString()}
              </p>
            </div>

            {!selectedMark.approved && <div className="border-t pt-4">
                <Button onClick={() => {
            handleApprove(selectedMark.id);
            setViewModalOpen(false);
          }} leftIcon={<CheckCircle className="h-4 w-4" />}>
                  Approve This Mark
                </Button>
              </div>}
          </div>
        </Dialog>}
    </div>;
}