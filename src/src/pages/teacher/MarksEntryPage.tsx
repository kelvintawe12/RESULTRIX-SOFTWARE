import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Save, BookOpen, CheckCircle, AlertCircle, Download, TrendingUp, Users, Award, RefreshCw, ChevronRight, Zap } from 'lucide-react';
interface StudentWithEnrollment {
  id: string;
  full_name: string;
  admission_number: string;
  enrollment_id: string;
}
interface MarkEntry {
  score: string;
  outOf: string;
  comments: string;
  changed: boolean;
  saved: boolean;
}
export function MarksEntryPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentWithEnrollment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [schoolConfig, setSchoolConfig] = useState<{
    default_exam_out_of: number;
  }>({
    default_exam_out_of: 20
  });
  const [focusedCell, setFocusedCell] = useState<{
    studentId: string;
    field: 'score' | 'outOf' | 'comments';
  } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  // Quick Fill State
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [quickFillScore, setQuickFillScore] = useState('');
  const [quickFillOutOf, setQuickFillOutOf] = useState('20');
  const [quickFillEmptyOnly, setQuickFillEmptyOnly] = useState(true);
  useEffect(() => {
    if (user?.id) {
      fetchTeacherData();
    }
  }, [user?.id]);
  useEffect(() => {
    if (selectedAssignment && selectedSequence) {
      fetchStudentsAndMarks();
    }
  }, [selectedAssignment, selectedSequence]);
  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: schoolData
      } = await supabase.from('schools').select('default_exam_out_of').eq('id', user?.school_id).single();
      if (schoolData) setSchoolConfig(schoolData);
      const {
        data: assignmentsData,
        error: assignmentsError
      } = await supabase.from('teacher_assignments').select(`
          id,
          subject_id,
          class_id,
          subjects (id, name, subject_type, coefficient),
          classes (id, name)
        `).eq('teacher_id', user?.id);
      if (assignmentsError) throw assignmentsError;
      const {
        data: currentTerm
      } = await supabase.from('v_current_term').select('id').single();
      let sequencesQuery = supabase.from('sequences').select('id, name, due_date, term_id, is_current').order('created_at', {
        ascending: false
      });
      if (currentTerm) {
        sequencesQuery = sequencesQuery.eq('term_id', currentTerm.id);
      }
      const {
        data: sequencesData,
        error: sequencesError
      } = await sequencesQuery;
      if (sequencesError) throw sequencesError;
      setAssignments(assignmentsData || []);
      setSequences(sequencesData || []);
      const currentSequence = sequencesData?.find(s => s.is_current);
      if (currentSequence) {
        setSelectedSequence(currentSequence.id);
      }
    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;
      const {
        data: classStudents,
        error: classError
      } = await supabase.from('students').select('id, full_name, admission_number').eq('class_id', assignment.class_id).order('full_name');
      if (classError) throw classError;
      if (!classStudents || classStudents.length === 0) {
        setStudents([]);
        setMarks({});
        return;
      }
      const studentIds = classStudents.map(s => s.id);
      const {
        data: enrollmentsData,
        error: enrollmentsError
      } = await supabase.from('enrollments').select('id, student_id').eq('subject_id', assignment.subject_id).in('student_id', studentIds);
      if (enrollmentsError) throw enrollmentsError;
      const studentsWithEnrollments: StudentWithEnrollment[] = classStudents.map(student => {
        const enrollment = enrollmentsData?.find(e => e.student_id === student.id);
        if (!enrollment) return null;
        return {
          ...student,
          enrollment_id: enrollment.id
        };
      }).filter(Boolean) as StudentWithEnrollment[];
      setStudents(studentsWithEnrollments);
      if (studentsWithEnrollments.length > 0) {
        const enrollmentIds = studentsWithEnrollments.map(s => s.enrollment_id);
        const {
          data: marksData,
          error: marksError
        } = await supabase.from('marks').select('enrollment_id, score, out_of, comments, approved').in('enrollment_id', enrollmentIds).eq('sequence_id', selectedSequence);
        if (marksError) throw marksError;
        const existingMarks: Record<string, MarkEntry> = {};
        studentsWithEnrollments.forEach(student => {
          const mark = marksData?.find(m => m.enrollment_id === student.enrollment_id);
          existingMarks[student.id] = {
            score: mark?.score?.toString() || '',
            outOf: mark?.out_of?.toString() || '20',
            comments: mark?.comments || '',
            changed: false,
            saved: !!mark
          };
        });
        setMarks(existingMarks);
      }
    } catch (err: any) {
      console.error('Error fetching students and marks:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };
  const getAutoComment = (score: number, outOf: number): string => {
    if (outOf === 0) return '';
    const percentage = score / outOf * 100;
    if (percentage >= 90) return 'Excellent work! Outstanding performance.';
    if (percentage >= 80) return 'Very good! Keep up the great work.';
    if (percentage >= 70) return 'Good performance. Well done.';
    if (percentage >= 60) return 'Satisfactory. Room for improvement.';
    if (percentage >= 50) return 'Fair. Needs more effort.';
    if (percentage >= 40) return 'Below average. Requires significant improvement.';
    return 'Poor performance. Needs immediate attention.';
  };
  const handleCellChange = useCallback((studentId: string, field: 'score' | 'outOf' | 'comments', value: string) => {
    setMarks(prev => {
      const currentMark = prev[studentId];
      const updatedMark = {
        ...currentMark,
        [field]: value,
        changed: true
      };
      // Auto-generate comment if score or outOf changes and comment is empty
      if ((field === 'score' || field === 'outOf') && !currentMark.comments) {
        const score = field === 'score' ? parseFloat(value) : parseFloat(currentMark.score);
        const outOf = field === 'outOf' ? parseFloat(value) : parseFloat(currentMark.outOf);
        if (!isNaN(score) && !isNaN(outOf) && outOf > 0) {
          updatedMark.comments = getAutoComment(score, outOf);
        }
      }
      return {
        ...prev,
        [studentId]: updatedMark
      };
    });
  }, []);
  const handleQuickFill = () => {
    const score = parseFloat(quickFillScore);
    const outOf = parseFloat(quickFillOutOf);
    if (isNaN(score) || isNaN(outOf) || outOf <= 0) {
      setError('Please enter valid numeric values for Score and Out Of.');
      return;
    }
    setMarks(prev => {
      const updatedMarks = {
        ...prev
      };
      students.forEach(student => {
        const currentMark = updatedMarks[student.id] || {
          score: '',
          outOf: '20',
          comments: '',
          changed: false,
          saved: false
        };
        if (!quickFillEmptyOnly || !currentMark.score) {
          const autoComment = !currentMark.comments ? getAutoComment(score, outOf) : currentMark.comments;
          updatedMarks[student.id] = {
            ...currentMark,
            score: quickFillScore,
            outOf: quickFillOutOf,
            comments: autoComment,
            changed: true
          };
        }
      });
      return updatedMarks;
    });
    setShowQuickFill(false);
    setSuccess('Quick fill applied successfully.');
    setTimeout(() => setSuccess(null), 3000);
  };
  const handleKeyDown = useCallback((e: React.KeyboardEvent, studentId: string, field: 'score' | 'outOf' | 'comments') => {
    const currentIndex = students.findIndex(s => s.id === studentId);
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < students.length) {
        const nextStudent = students[nextIndex];
        const refKey = `${nextStudent.id}-${field}`;
        inputRefs.current[refKey]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        const prevStudent = students[prevIndex];
        const refKey = `${prevStudent.id}-${field}`;
        inputRefs.current[refKey]?.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (field === 'score') {
        const refKey = `${studentId}-outOf`;
        inputRefs.current[refKey]?.focus();
      } else if (field === 'outOf') {
        const refKey = `${studentId}-comments`;
        inputRefs.current[refKey]?.focus();
      } else {
        const nextIndex = currentIndex + 1;
        if (nextIndex < students.length) {
          const nextStudent = students[nextIndex];
          const refKey = `${nextStudent.id}-score`;
          inputRefs.current[refKey]?.focus();
        }
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (field === 'comments') {
        const refKey = `${studentId}-outOf`;
        inputRefs.current[refKey]?.focus();
      } else if (field === 'outOf') {
        const refKey = `${studentId}-score`;
        inputRefs.current[refKey]?.focus();
      } else {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevStudent = students[prevIndex];
          const refKey = `${prevStudent.id}-comments`;
          inputRefs.current[refKey]?.focus();
        }
      }
    }
  }, [students]);
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const changedMarks = students.filter(s => marks[s.id]?.changed && marks[s.id]?.score);
      if (changedMarks.length === 0) {
        setError('No changes to save');
        return;
      }
      const marksToSave = changedMarks.map(student => {
        const mark = marks[student.id];
        return {
          enrollment_id: student.enrollment_id,
          sequence_id: selectedSequence,
          score: parseFloat(mark.score),
          out_of: parseFloat(mark.outOf),
          comments: mark.comments || null,
          submitted_by: user?.id,
          approved: false
        };
      });
      const invalid = marksToSave.find(m => isNaN(m.score) || isNaN(m.out_of) || m.score < 0 || m.out_of <= 0 || m.score > m.out_of);
      if (invalid) {
        setError('Invalid marks detected. Please check all entries.');
        return;
      }
      let savedCount = 0;
      for (const markData of marksToSave) {
        await supabase.from('marks').delete().eq('enrollment_id', markData.enrollment_id).eq('sequence_id', selectedSequence);
        const {
          error: insertError
        } = await supabase.from('marks').insert([markData]);
        if (insertError) throw insertError;
        savedCount++;
      }
      setMarks(prev => {
        const updated = {
          ...prev
        };
        changedMarks.forEach(student => {
          updated[student.id] = {
            ...updated[student.id],
            changed: false,
            saved: true
          };
        });
        return updated;
      });
      setSuccess(`Successfully saved ${savedCount} mark(s)`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving marks:', err);
      let errorMessage = 'Failed to save marks';
      if (err.code === '520') {
        errorMessage = '⚠️ DATABASE ERROR: The audit trigger is blocking saves. Run IMMEDIATE-FIX-disable-audit-trigger.sql in Supabase SQL Editor to fix this.';
      } else if (err.code === '42702') {
        errorMessage = '⚠️ DATABASE ERROR: Ambiguous column reference in audit trigger. Run IMMEDIATE-FIX-disable-audit-trigger.sql in Supabase SQL Editor to fix this.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  const changedCount = Object.values(marks).filter(m => m.changed).length;
  const savedCount = Object.values(marks).filter(m => m.saved && !m.changed).length;
  const totalCount = students.length;
  const coefficient = selectedAssignmentData?.subjects?.coefficient || 1;
  const averagePercentage = savedCount > 0 ? Object.entries(marks).filter(([_, m]) => m.saved && m.score && m.outOf).reduce((sum, [_, m]) => sum + parseFloat(m.score) / parseFloat(m.outOf) * 100, 0) / savedCount : 0;
  const showForm = selectedAssignment && selectedSequence;
  if (loading && assignments.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Marks Entry
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Excel-style marks entry with keyboard navigation
            </p>
          </div>
          {showForm && <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Zap className="w-4 h-4" />} onClick={() => setShowQuickFill(true)}>
                <span className="hidden sm:inline">Quick Fill</span>
              </Button>
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchStudentsAndMarks}>
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>}
        </div>

        {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
        {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

        {assignments.length === 0 ? <Card className="p-8 sm:p-12">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Teaching Assignments
              </h3>
              <p className="text-slate-500">
                Contact your administrator to get assigned to classes.
              </p>
            </div>
          </Card> : <>
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select Class & Subject *
                    </label>
                    <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a class and subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.map(a => <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2 py-1">
                              <span className="font-medium">
                                {a.subjects?.name}
                              </span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600">
                                {a.classes?.name}
                              </span>
                              <Badge variant="secondary" className="ml-auto text-xs">
                                Coef: {a.subjects?.coefficient}
                              </Badge>
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select Sequence *
                    </label>
                    <Select value={selectedSequence} onValueChange={setSelectedSequence}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a sequence..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sequences.map(s => <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2 py-1">
                              <span>{s.name}</span>
                              {s.is_current && <Badge variant="success" className="text-xs">
                                  Current
                                </Badge>}
                              {s.due_date && <span className="text-xs text-slate-500 ml-auto">
                                  Due:{' '}
                                  {new Date(s.due_date).toLocaleDateString()}
                                </span>}
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!showForm && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Please select both a class/subject and a sequence to begin
                      entering marks.
                    </p>
                  </div>}
              </CardContent>
            </Card>

            {showForm && <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 truncate">
                            Students
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                            {totalCount}
                          </h3>
                        </div>
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 truncate">
                            Saved
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                            {savedCount}
                          </h3>
                        </div>
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-20 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 truncate">
                            Unsaved
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                            {changedCount}
                          </h3>
                        </div>
                        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 opacity-20 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600 truncate">
                            Average
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                            {averagePercentage.toFixed(1)}%
                          </h3>
                        </div>
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-20 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardHeader className="border-b bg-slate-50/80 sticky top-0 z-10 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">
                          {selectedAssignmentData?.subjects?.name} -{' '}
                          {selectedAssignmentData?.classes?.name}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                            Coef: {coefficient}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>{students.length} students</span>
                        </div>
                      </div>
                      <Button onClick={handleSaveAll} disabled={changedCount === 0 || saving} leftIcon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} className="w-full sm:w-auto">
                        {saving ? 'Saving...' : `Save ${changedCount > 0 ? `(${changedCount})` : 'All'}`}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {loading ? <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div> : students.length > 0 ? <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[800px]">
                          <thead className="bg-slate-100 sticky top-0 z-10">
                            <tr>
                              <th className="text-left p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-12">
                                #
                              </th>
                              <th className="text-left p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-24 sm:w-32">
                                Adm. No.
                              </th>
                              <th className="text-left p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 min-w-[150px]">
                                Student Name
                              </th>
                              <th className="text-center p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-20 sm:w-24">
                                Score
                              </th>
                              <th className="text-center p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-20 sm:w-24">
                                Out Of
                              </th>
                              <th className="text-center p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-16 sm:w-20">
                                %
                              </th>
                              <th className="text-left p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 min-w-[200px]">
                                Comments
                              </th>
                              <th className="text-center p-2 sm:p-3 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 w-20 sm:w-24">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student, index) => {
                      const mark = marks[student.id] || {
                        score: '',
                        outOf: '20',
                        comments: '',
                        changed: false,
                        saved: false
                      };
                      const percentage = mark.score && mark.outOf ? parseFloat(mark.score) / parseFloat(mark.outOf) * 100 : null;
                      const isChanged = mark.changed;
                      const isFocused = focusedCell?.studentId === student.id;
                      return <tr key={student.id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${isChanged ? 'bg-amber-50/50' : ''} ${isFocused ? 'bg-blue-50/50' : ''}`}>
                                  <td className="p-2 sm:p-3 text-xs sm:text-sm text-slate-500 font-medium">
                                    {index + 1}
                                  </td>
                                  <td className="p-2 sm:p-3 text-xs sm:text-sm font-mono text-slate-600">
                                    {student.admission_number || 'N/A'}
                                  </td>
                                  <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-slate-900">
                                    {student.full_name}
                                  </td>
                                  <td className="p-1.5 sm:p-2">
                                    <input ref={el => {
                            if (el) inputRefs.current[`${student.id}-score`] = el;
                          }} type="number" min="0" step="0.5" value={mark.score} onChange={e => handleCellChange(student.id, 'score', e.target.value)} onFocus={() => setFocusedCell({
                            studentId: student.id,
                            field: 'score'
                          })} onBlur={() => setFocusedCell(null)} onKeyDown={e => handleKeyDown(e, student.id, 'score')} placeholder="0" className="w-full px-2 py-1.5 text-center text-sm sm:text-base font-semibold border-2 border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                                  </td>
                                  <td className="p-1.5 sm:p-2">
                                    <input ref={el => {
                            if (el) inputRefs.current[`${student.id}-outOf`] = el;
                          }} type="number" min="1" step="1" value={mark.outOf} onChange={e => handleCellChange(student.id, 'outOf', e.target.value)} onFocus={() => setFocusedCell({
                            studentId: student.id,
                            field: 'outOf'
                          })} onBlur={() => setFocusedCell(null)} onKeyDown={e => handleKeyDown(e, student.id, 'outOf')} className="w-full px-2 py-1.5 text-center text-sm sm:text-base font-semibold border-2 border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                                  </td>
                                  <td className="p-2 sm:p-3 text-center">
                                    {percentage !== null && <span className={`text-xs sm:text-sm font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {percentage.toFixed(1)}%
                                      </span>}
                                  </td>
                                  <td className="p-1.5 sm:p-2">
                                    <input ref={el => {
                            if (el) inputRefs.current[`${student.id}-comments`] = el;
                          }} type="text" value={mark.comments} onChange={e => handleCellChange(student.id, 'comments', e.target.value)} onFocus={() => setFocusedCell({
                            studentId: student.id,
                            field: 'comments'
                          })} onBlur={() => setFocusedCell(null)} onKeyDown={e => handleKeyDown(e, student.id, 'comments')} placeholder="Optional..." className="w-full px-2 py-1.5 text-xs sm:text-sm border-2 border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                                  </td>
                                  <td className="p-2 sm:p-3 text-center">
                                    {isChanged ? <Badge variant="warning" className="text-xs">
                                        Changed
                                      </Badge> : mark.saved ? <Badge variant="success" className="text-xs">
                                        Saved
                                      </Badge> : <Badge variant="secondary" className="text-xs">
                                        Empty
                                      </Badge>}
                                  </td>
                                </tr>;
                    })}
                          </tbody>
                        </table>
                      </div> : <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                          No students enrolled in this subject
                        </p>
                      </div>}
                  </CardContent>
                </Card>

                {students.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <div className="text-xs sm:text-sm text-blue-900 min-w-0">
                        <p className="font-medium mb-1">Keyboard Shortcuts:</p>
                        <ul className="space-y-1 text-blue-800">
                          <li className="flex flex-wrap items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                              Enter
                            </kbd>{' '}
                            or
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                              ↓
                            </kbd>{' '}
                            - Next row
                          </li>
                          <li className="flex flex-wrap items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                              Tab
                            </kbd>{' '}
                            - Next field •
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                              Shift+Tab
                            </kbd>{' '}
                            - Previous
                          </li>
                          <li className="flex flex-wrap items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono">
                              ↑
                            </kbd>{' '}
                            - Previous row
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>}
              </>}
          </>}

        <Dialog isOpen={showQuickFill} onClose={() => setShowQuickFill(false)} title="Quick Fill Marks">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Score
                </label>
                <Input type="number" value={quickFillScore} onChange={e => setQuickFillScore(e.target.value)} placeholder="e.g. 15" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Out Of
                </label>
                <Input type="number" value={quickFillOutOf} onChange={e => setQuickFillOutOf(e.target.value)} placeholder="e.g. 20" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="empty-only" checked={quickFillEmptyOnly} onCheckedChange={checked => setQuickFillEmptyOnly(checked as boolean)} />
              <label htmlFor="empty-only" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Apply to empty rows only
              </label>
            </div>
            <p className="text-sm text-slate-500">
              This will fill the selected rows with the specified score and out
              of value. Auto-comments will be generated based on the percentage.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowQuickFill(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickFill}>Apply Quick Fill</Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>;
}