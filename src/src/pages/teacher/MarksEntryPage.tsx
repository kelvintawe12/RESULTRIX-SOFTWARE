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
import { Save, BookOpen, CheckCircle, AlertCircle, Download, TrendingUp, Users, Award, RefreshCw, ChevronRight, Zap, PieChart, Activity, Target, Star, Clock, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

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

// Keyboard Icon Component
const KeyboardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M6 12h.01" />
    <path d="M10 12h.01" />
    <path d="M14 12h.01" />
    <path d="M18 12h.01" />
    <path d="M7 16h10" />
  </svg>
);

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
  
  // Student Details State
  const [selectedStudent, setSelectedStudent] = useState<StudentWithEnrollment | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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

  const handleStudentClick = async (student: StudentWithEnrollment) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
    setLoadingStudentDetails(true);
    setStudentDetails(null);
    
    try {
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;

      // Fetch student basic info
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*, classes(name)')
        .eq('id', student.id)
        .single();

      if (studentError) throw studentError;

      // Fetch student's marks history for this subject
      const { data: marksHistory } = await supabase
        .from('marks')
        .select(`
          score,
          out_of,
          comments,
          sequences(name, created_at)
        `)
        .eq('enrollment_id', student.enrollment_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate average mark
      const validMarks = marksHistory?.filter(m => m.score !== null && m.out_of !== null) || [];
      const averageMark = validMarks.length > 0 
        ? validMarks.reduce((sum, m) => sum + (m.score / m.out_of * 100), 0) / validMarks.length 
        : 0;

      setStudentDetails({
        ...studentData,
        marksHistory: marksHistory || [],
        averageMark,
        totalAssessments: marksHistory?.length || 0
      });
    } catch (err: any) {
      console.error('Error fetching student details:', err);
      setError(err.message || 'Failed to load student details');
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  const changedCount = Object.values(marks).filter(m => m.changed).length;
  const savedCount = Object.values(marks).filter(m => m.saved && !m.changed).length;
  const totalCount = students.length;
  const coefficient = selectedAssignmentData?.subjects?.coefficient || 1;
  const averagePercentage = savedCount > 0 ? Object.entries(marks).filter(([_, m]) => m.saved && m.score && m.outOf).reduce((sum, [_, m]) => sum + parseFloat(m.score) / parseFloat(m.outOf) * 100, 0) / savedCount : 0;
  const showForm = selectedAssignment && selectedSequence;

  // Analytics data
  const gradeDistribution = React.useMemo(() => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    Object.values(marks).forEach(mark => {
      if (mark.score && mark.outOf) {
        const percentage = parseFloat(mark.score) / parseFloat(mark.outOf) * 100;
        if (percentage >= 90) distribution.A++;
        else if (percentage >= 80) distribution.B++;
        else if (percentage >= 70) distribution.C++;
        else if (percentage >= 60) distribution.D++;
        else distribution.F++;
      }
    });
    return Object.entries(distribution).map(([grade, count]) => ({ grade, count }));
  }, [marks]);

  const marksTrendData = React.useMemo(() => {
    // Simulate trend data (in real implementation, this would come from historical data)
    return [
      { name: 'Week 1', average: 72, submitted: 85 },
      { name: 'Week 2', average: 75, submitted: 88 },
      { name: 'Week 3', average: 78, submitted: 82 },
      { name: 'Week 4', average: averagePercentage, submitted: (savedCount / totalCount * 100) || 0 }
    ];
  }, [averagePercentage, savedCount, totalCount]);

  if (loading && assignments.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-gray-600 mt-1">
            Excel-style marks entry with analytics and performance insights
          </p>
        </div>
        {showForm && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Zap className="w-4 h-4" />} 
              onClick={() => setShowQuickFill(true)}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Quick Fill
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<RefreshCw className="w-4 h-4" />} 
              onClick={fetchStudentsAndMarks}
              className="hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Download className="w-4 h-4" />}
              className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              Export
            </Button>
          </div>
        )}
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {assignments.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teaching Assignments</h3>
            <p className="text-gray-500">Contact your administrator to get assigned to classes.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Selection Section */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Select Class & Subject *
                  </label>
                  <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a class and subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2 py-1">
                            <span className="font-medium">{a.subjects?.name}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600">{a.classes?.name}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              Coef: {a.subjects?.coefficient}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Select Sequence *
                  </label>
                  <Select value={selectedSequence} onValueChange={setSelectedSequence}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a sequence..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sequences.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2 py-1">
                            <span>{s.name}</span>
                            {s.is_current && <Badge variant="success" className="text-xs">Current</Badge>}
                            {s.due_date && (
                              <span className="text-xs text-gray-500 ml-auto">
                                Due: {new Date(s.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!showForm && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Please select both a class/subject and a sequence to begin entering marks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {showForm && (
            <>
              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50/30 border-l-4 border-l-blue-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                          {totalCount}
                        </h3>
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Enrolled</span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 ml-2">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-green-50/30 border-l-4 border-l-green-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Marks Saved</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">
                          {savedCount}
                        </h3>
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            {totalCount > 0 ? ((savedCount / totalCount) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-50 rounded-xl group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300 ml-2">
                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-amber-50/30 border-l-4 border-l-amber-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Unsaved Changes</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">
                          {changedCount}
                        </h3>
                        <div className="flex items-center gap-1 mt-2">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <span className="text-xs text-amber-600 font-medium">Pending</span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 bg-amber-50 rounded-xl group-hover:bg-amber-600 group-hover:scale-110 transition-all duration-300 ml-2">
                        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50/30 border-l-4 border-l-purple-500">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Class Average</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-purple-600 transition-colors">
                          {averagePercentage.toFixed(1)}%
                        </h3>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="h-3 w-3 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">{coefficient}x Coef</span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 ml-2">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Grade Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {gradeDistribution.some(d => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={gradeDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ grade, percent }) => `${grade} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {gradeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <PieChart className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-sm">No marks data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Trend */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marksTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="average" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Average %" />
                          <Area type="monotone" dataKey="submitted" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Submitted %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Marks Entry Table */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        {selectedAssignmentData?.subjects?.name} - {selectedAssignmentData?.classes?.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                          Coef: {coefficient}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{students.length} students</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Sequence: {sequences.find(s => s.id === selectedSequence)?.name}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={changedCount === 0 || saving} 
                      leftIcon={saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                      {saving ? 'Saving...' : `Save ${changedCount > 0 ? `(${changedCount})` : 'All'}`}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[800px]">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="text-left p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-12">#</th>
                            <th className="text-left p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-24 sm:w-32">Adm. No.</th>
                            <th className="text-left p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 min-w-[150px]">Student Name</th>
                            <th className="text-center p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-20 sm:w-24">Score</th>
                            <th className="text-center p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-20 sm:w-24">Out Of</th>
                            <th className="text-center p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-16 sm:w-20">%</th>
                            <th className="text-left p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 min-w-[200px]">Comments</th>
                            <th className="text-center p-2 sm:p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 w-20 sm:w-24">Status</th>
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
                            
                            return (
                              <tr 
                                key={student.id} 
                                className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                                  isChanged ? 'bg-amber-50/50' : ''
                                } ${
                                  isFocused ? 'bg-blue-100 ring-2 ring-blue-300' : ''
                                }`}
                              >
                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-500 font-medium">{index + 1}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm font-mono text-gray-600">{student.admission_number || 'N/A'}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-900">
                                  <button
                                    onClick={() => handleStudentClick(student)}
                                    className="text-left hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {student.full_name}
                                  </button>
                                </td>
                                <td className="p-1.5 sm:p-2">
                                  <input 
                                    ref={el => {
                                      if (el) inputRefs.current[`${student.id}-score`] = el;
                                    }}
                                    type="number" 
                                    min="0" 
                                    step="0.5" 
                                    value={mark.score} 
                                    onChange={e => handleCellChange(student.id, 'score', e.target.value)}
                                    onFocus={() => setFocusedCell({ studentId: student.id, field: 'score' })}
                                    onBlur={() => setFocusedCell(null)}
                                    onKeyDown={e => handleKeyDown(e, student.id, 'score')}
                                    placeholder="0" 
                                    className="w-full px-2 py-1.5 text-center text-sm sm:text-base font-semibold border-2 border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                  />
                                </td>
                                <td className="p-1.5 sm:p-2">
                                  <input 
                                    ref={el => {
                                      if (el) inputRefs.current[`${student.id}-outOf`] = el;
                                    }}
                                    type="number" 
                                    min="1" 
                                    step="1" 
                                    value={mark.outOf}
                                    onChange={e => handleCellChange(student.id, 'outOf', e.target.value)}
                                    onFocus={() => setFocusedCell({ studentId: student.id, field: 'outOf' })}
                                    onBlur={() => setFocusedCell(null)}
                                    onKeyDown={e => handleKeyDown(e, student.id, 'outOf')}
                                    className="w-full px-2 py-1.5 text-center text-sm sm:text-base font-semibold border-2 border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                  />
                                </td>
                                <td className="p-2 sm:p-3 text-center">
                                  {percentage !== null && (
                                    <span 
                                      className={`text-xs sm:text-sm font-bold ${
                                        percentage >= 70 
                                          ? 'text-green-600 bg-green-100 px-2 py-1 rounded-full' 
                                          : percentage >= 50 
                                            ? 'text-amber-600 bg-amber-100 px-2 py-1 rounded-full' 
                                            : 'text-red-600 bg-red-100 px-2 py-1 rounded-full'
                                      }`}
                                    >
                                      {percentage.toFixed(1)}%
                                    </span>
                                  )}
                                </td>
                                <td className="p-1.5 sm:p-2">
                                  <input 
                                    ref={el => {
                                      if (el) inputRefs.current[`${student.id}-comments`] = el;
                                    }}
                                    type="text" 
                                    value={mark.comments} 
                                    onChange={e => handleCellChange(student.id, 'comments', e.target.value)}
                                    onFocus={() => setFocusedCell({ studentId: student.id, field: 'comments' })}
                                    onBlur={() => setFocusedCell(null)}
                                    onKeyDown={e => handleKeyDown(e, student.id, 'comments')}
                                    placeholder="Optional..."
                                    className="w-full px-2 py-1.5 text-xs sm:text-sm border-2 border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                  />
                                </td>
                                <td className="p-2 sm:p-3 text-center">
                                  {isChanged ? (
                                    <Badge variant="warning" className="text-xs">Changed</Badge>
                                  ) : mark.saved ? (
                                    <Badge variant="success" className="text-xs">Saved</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Empty</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No students enrolled in this subject</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              {students.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                      <KeyboardIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <div className="text-xs sm:text-sm text-blue-900 min-w-0">
                      <p className="font-medium mb-1 flex items-center gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                        Keyboard Shortcuts:
                      </p>
                      <ul className="space-y-1 text-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <li className="flex flex-wrap items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-300">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-300">↓</kbd> - Next row
                        </li>
                        <li className="flex flex-wrap items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-300">Tab</kbd> - Next field • <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-300">Shift+Tab</kbd> - Previous
                        </li>
                        <li className="flex flex-wrap items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-300">↑</kbd> - Previous row
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        <Dialog isOpen={showQuickFill} onClose={() => setShowQuickFill(false)} title="Quick Fill Marks">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Score</label>
                <Input type="number" value={quickFillScore} onChange={e => setQuickFillScore(e.target.value)} placeholder="e.g. 15" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Out Of</label>
                <Input type="number" value={quickFillOutOf} onChange={e => setQuickFillOutOf(e.target.value)} placeholder="e.g. 20" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="empty-only" 
                checked={quickFillEmptyOnly} 
                onCheckedChange={checked => setQuickFillEmptyOnly(checked as boolean)} 
              />
              <label htmlFor="empty-only" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Apply to empty rows only
              </label>
            </div>
            <p className="text-sm text-gray-500">
              This will fill the selected rows with the specified score and out of value. Auto-comments will be generated based on the percentage.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowQuickFill(false)}>Cancel</Button>
              <Button onClick={handleQuickFill}>Apply Quick Fill</Button>
            </div>
          </div>
        </Dialog>

        {/* Student Details Dialog */}
        <Dialog 
          isOpen={showStudentDetails} 
          onClose={() => setShowStudentDetails(false)} 
          title=""
          size="full"
        >
          {loadingStudentDetails ? (
            <div className="flex items-center justify-center min-h-[600px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : studentDetails ? (
            <div className="space-y-0">
              {/* Hero Header */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-8 rounded-b-3xl shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-4xl font-bold shadow-xl border-4 border-white/30">
                      {selectedStudent?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {studentDetails.classes?.name || 'Student'}
                        </Badge>
                        {studentDetails.averageMark >= 70 && (
                          <Badge className="bg-green-500 text-white border-green-400">
                            Excellent
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-1 flex items-center gap-3">
                        {selectedStudent?.full_name}
                      </h2>
                      <p className="text-blue-100 text-lg">Adm. No: {selectedStudent?.admission_number || 'N/A'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStudentDetails(false)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    Close
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-yellow-300" />
                      <span className="text-xs text-blue-100">Average</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{studentDetails.averageMark.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      <span className="text-xs text-blue-100">Assessments</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{studentDetails.totalAssessments}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-purple-300" />
                      <span className="text-xs text-blue-100">Current</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">Active</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-300" />
                      <span className="text-xs text-blue-100">Status</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">Good</p>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 py-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  {/* Personal Information Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {studentDetails.date_of_birth 
                              ? new Date(studentDetails.date_of_birth).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                }) 
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                          <p className="font-semibold text-gray-900 mt-1">{studentDetails.gender || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Parent Contact</p>
                          <p className="font-semibold text-gray-900 mt-1">{studentDetails.parent_contact || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                          <p className="font-semibold text-gray-900 mt-1">{studentDetails.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Overall Average</span>
                            <span className="font-bold text-gray-900">{studentDetails.averageMark.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                studentDetails.averageMark >= 70 
                                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                  : studentDetails.averageMark >= 50 
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                                    : 'bg-gradient-to-r from-red-400 to-red-600'
                              }`}
                              style={{ width: `${Math.min(studentDetails.averageMark, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{studentDetails.totalAssessments}</p>
                            <p className="text-xs text-gray-600">Total Tests</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {studentDetails.marksHistory.filter((m: any) => (m.score / m.out_of) >= 70).length}
                            </p>
                            <p className="text-xs text-gray-600">Passed</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Middle/Right Column - Performance */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Academic Performance Card */}
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Academic Performance History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {studentDetails.marksHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                              <tr>
                                <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                  Assessment
                                </th>
                                <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                  Score
                                </th>
                                <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                  Total
                                </th>
                                <th className="text-center p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                  Percentage
                                </th>
                                <th className="text-left p-4 text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                  Comments
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetails.marksHistory.map((mark: any, index: number) => {
                                const percentage = (mark.score / mark.out_of) * 100;
                                return (
                                  <tr 
                                    key={index} 
                                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                                  >
                                    <td className="p-4 text-sm text-gray-900 font-semibold">
                                      {mark.sequences?.name || `Assessment ${index + 1}`}
                                    </td>
                                    <td className="p-4 text-center">
                                      <span className="text-lg font-bold text-gray-900">{mark.score}</span>
                                    </td>
                                    <td className="p-4 text-center text-gray-600">{mark.out_of}</td>
                                    <td className="p-4 text-center">
                                      <div className="inline-flex items-center gap-2">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold" style={{
                                          background: percentage >= 90 
                                            ? 'linear-gradient(to bottom right, #4ade80, #16a34a)'
                                            : percentage >= 70 
                                              ? 'linear-gradient(to bottom right, #60a5fa, #2563eb)'
                                              : percentage >= 50 
                                                ? 'linear-gradient(to bottom right, #fbbf24, #f59e0b)'
                                                : 'linear-gradient(to bottom right, #f87171, #ef4444)',
                                          color: 'white'
                                        }}>
                                          {percentage.toFixed(0)}%
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 max-w-xs">
                                      <div className="bg-gray-50 rounded-lg p-2">
                                        {mark.comments || 'No comments'}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Performance Data</h3>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            This student hasn't completed any assessments yet.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      <Award className="w-6 h-6" />
                      <span className="text-sm font-medium">View Full Report</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col justify-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all"
                    >
                      <Download className="w-6 h-6" />
                      <span className="text-sm font-medium">Download Records</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all"
                    >
                      <Mail className="w-6 h-6" />
                      <span className="text-sm font-medium">Contact Parent</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">No Student Details Available</p>
              <p className="text-gray-500 max-w-sm mx-auto">Unable to load student information. Please try again.</p>
            </div>
          )}
        </Dialog>
        </>
      )}
    </div>
  );
}
