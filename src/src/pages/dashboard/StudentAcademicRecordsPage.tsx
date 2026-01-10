import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, Eye, Award, BookOpen, User, GraduationCap, Printer, Mail, X, Loader, ChevronLeft, ChevronRight, ChevronDown, Calendar, Phone, MapPin, Heart, Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

// Enhanced interfaces
interface Student {
  id: string;
  admission_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  profile_photo_path?: string;
  class_id?: string;
  class_name?: string;
  academic_year_id?: string;
  academic_year_name?: string;
  enrollment_date?: string;
  previous_school?: string;
  medical_conditions?: string;
  allergies?: string;
  special_needs?: string;
  blood_type?: string;
  total_fee?: number;
  total_paid?: number;
  remaining?: number;
  overall_average?: number;
  class_rank?: number;
  school_rank?: number;
}

interface Guardian {
  id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  address?: string;
  occupation?: string;
  id_number?: string;
}

// ...existing code...

interface PerformanceStats {
  avgScore: number;
  highest: number;
  lowest: number;
  status: string;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

interface Enrollment {
  id: string;
  subject_name: string;
  academic_year: string;
}

interface SequenceMark {
  year: string;
  term: string;
  sequence: string;
  subject: string;
  score: string;
  percentage: number;
  comments?: string;
  coefficient?: number;
}

interface Mark extends SequenceMark {
  id: string;
}

interface Transcript {
  id: string;
  type: string;
  scope: string;
  date: string;
  status: string;
}

// Helper components
// ...existing code...

export function StudentAcademicRecordsPage() {
  const { user } = useAuth();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'excellent' | 'good' | 'average' | 'poor'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('academic-history');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  // ...existing code...
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicHistory, setAcademicHistory] = useState<any[]>([]);
  const [sequenceMarks, setSequenceMarks] = useState<SequenceMark[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Performance summary state
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  
  // Transcript generation modal
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);
  // Fetch students on mount
  useEffect(() => {
    if (user?.school_id) {
      fetchStudents();
    }
  }, [user?.school_id, currentPage, searchTerm, selectedClass]);

  // Fetch student data when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAcademicHistory(selectedStudent.id);
      fetchStudentSequenceMarks(selectedStudent.id);
      fetchStudentTranscripts(selectedStudent.id);
      fetchStudentGuardians(selectedStudent.id);
    }
  }, [selectedStudent]);


  // Calculate performance summary when sequenceMarks change
  useEffect(() => {
    if (!selectedStudent || sequenceMarks.length === 0) {
      setPerformanceStats(null);
      return;
    }
    const scores = sequenceMarks.map(m => typeof m.percentage === 'number' ? m.percentage : 0);
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highest = scores.length ? Math.max(...scores) : 0;
    const lowest = scores.length ? Math.min(...scores) : 0;
    let status = 'Needs Improvement';
    if (avgScore >= 80) status = 'Excellent';
    else if (avgScore >= 60) status = 'Good';
    else if (avgScore >= 50) status = 'Fair';
    setPerformanceStats({ avgScore, highest, lowest, status });
  }, [sequenceMarks, selectedStudent]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      if (!user?.school_id) {
        setError('No school ID found');
        setLoading(false);
        return;
      }
      
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from('students').select(`
          id,
          admission_number,
          full_name,
          profile_photo_path,
          email,
          phone,
          address,
          date_of_birth,
          gender,
          medical_conditions,
          allergies,
          blood_type,
          classes (name),
          academic_years (year_name)
        `, { count: 'exact' })
        .eq('school_id', user.school_id)
        .order('full_name');

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%`);
      }

      // Note: Filtering by joined column (classes.name) requires !inner join or client-side filtering
      // For now, we fetch page and filter client side if needed, or rely on search
      
      const {
        data,
        error,
        count
      } = await query.range(from, to);

      if (error) throw error;
      
      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

      const formattedStudents: Student[] = (data || []).map((student: any) => ({
        id: student.id,
        admission_number: student.admission_number,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        medical_conditions: student.medical_conditions,
        allergies: student.allergies,
        blood_type: student.blood_type,
        class_name: student.classes?.name,
        photo_url: student.profile_photo_path,
        years_enrolled: student.academic_years?.year_name,
        overall_average: undefined // will be set later
      }));
      setStudents(formattedStudents);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGuardians = async (studentId: string) => {
    const { data, error } = await supabase
      .from('guardians')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) console.error('Error fetching guardians:', error);
    if (data) setGuardians(data);
  };

  const fetchStudentAcademicHistory = async (studentId: string) => {
    try {
      if (!user?.school_id) return;
      
      const {
        data,
        error
      } = await supabase.from('enrollments').select(`
          *,
          subjects (name),
          students (
            classes (name),
            academic_years (year_name)
          )
        `).eq('student_id', studentId).eq('school_id', user.school_id);
      if (error) throw error;
      
      // Group by academic year
      const grouped = (data || []).reduce((acc: any, curr: any) => {
        const year = curr.students?.academic_years?.year_name || 'Unknown Year';
        if (!acc[year]) {
          acc[year] = {
            year,
            class: curr.students?.classes?.name,
            subjects: []
          };
        }
        acc[year].subjects.push(curr);
        return acc;
      }, {});

      setAcademicHistory(Object.values(grouped));
    } catch (err: any) {
      console.error('Error fetching academic history:', err);
    }
  };

  const fetchStudentSequenceMarks = async (studentId: string) => {
    try {
      if (!user?.school_id) return;
      
      // marks -> enrollments -> student_id
      // marks -> sequences -> terms -> academic_years
      const {
        data,
        error
      } = await supabase.from('marks').select(`
          *,
          sequences (
            name,
            terms (
              name,
              academic_years (year_name)
            )
          ),
          enrollments!inner (
            student_id,
            subjects (name)
          )
        `)
        .eq('enrollments.student_id', studentId)
        .order('created_at', {
        ascending: false
      });
      if (error) throw error;
      
      const formattedMarks: SequenceMark[] = (data || []).map((mark: any) => ({
        year: mark.sequences?.terms?.academic_years?.year_name,
        term: mark.sequences?.terms?.name,
        sequence: mark.sequences?.name,
        subject: mark.enrollments?.subjects?.name,
        score: mark.score.toString(),
        percentage: (mark.score / mark.out_of) * 100,
        comments: mark.comments
      }));
      setSequenceMarks(formattedMarks);
    } catch (err: any) {
      console.error('Error fetching sequence marks:', err);
    }
  };

  const fetchStudentTranscripts = async (studentId: string) => {
    try {
      if (!user?.school_id) return;
      
      // report_cards does not have school_id in schema, relying on student_id
      const {
        data,
        error
      } = await supabase.from('report_cards').select('*').eq('student_id', studentId).order('generated_at', {
        ascending: false
      });
      if (error) throw error;
      setTranscripts([]);
    } catch (err: any) {
      console.error('Error fetching transcripts:', err);
    }
  };

  const filteredStudents = students.filter(student => {
    // Search is handled server-side now, but we keep class filter client-side for the page
    const matchesClass = selectedClass === 'all' || student.class_name === selectedClass;
    return matchesClass;
  });

  const toggleYear = (yearName: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearName)) {
        newSet.delete(yearName);
      } else {
        newSet.add(yearName);
      }
      return newSet;
    });
  };

  const handleGenerateTranscript = async (type: 'official' | 'unofficial') => {
    if (!selectedStudent) return;
    try {
      alert(`Generating ${type} transcript for ${selectedStudent.full_name}...`);
    } catch (err: any) {
      console.error('Error generating transcript:', err);
      alert('Failed to generate transcript');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>;
  }

  if (error) {
    return <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error loading students: {error}
        </div>
      </div>;
  }

  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Student Academic Records
          </h1>
          <p className="text-slate-600 mt-1">
            Complete academic history and transcript management
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Download className="h-4 w-4 mr-2" />
          Export All Records
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input placeholder="Search by name or admission number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Years</option>
          </select>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Classes</option>
          </select>
        </div>
      </Card>

      {/* Students Table */}
      {!selectedStudent && (
        <>
          {/* Mobile/Tablet Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                No students found. Try adjusting your search or filters.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        {student.profile_photo_path ? <img src={student.profile_photo_path} alt={student.full_name} className="w-10 h-10 rounded-full object-cover" /> : <User className="h-5 w-5 text-indigo-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{student.full_name}</h3>
                        <p className="text-sm text-slate-500">{student.admission_number}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Class:</span> {student.class_name || 'N/A'}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedStudent(student)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedStudent(student); setActiveTab('transcripts'); }}>
                      <FileText className="h-4 w-4 mr-1" /> Transcript
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Admission No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Full Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Current Class
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No students found. Try adjusting your search or filters.
                    </td>
                  </tr> : filteredStudents.map(student => {
                    // Dummy average for demo; replace with real calculation if available
                    const avg = typeof student.overall_average === 'number' ? student.overall_average : null;
                    let badge = null;
                    if (avg !== null) {
                      if (avg >= 80) badge = <span className="ml-2 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Top Performer</span>;
                      else if (avg < 50) badge = <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Low Performer</span>;
                    }
                    return <motion.tr key={student.id} initial={{
                      opacity: 0
                    }} animate={{
                      opacity: 1
                    }} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {student.admission_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            {student.profile_photo_path ? <img src={student.profile_photo_path} alt={student.full_name} className="w-10 h-10 rounded-full object-cover" /> : <User className="h-5 w-5 text-indigo-600" />}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {student.full_name}
                          </span>
                          {badge}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.class_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedStudent(student)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Record
                          </Button>
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                            setSelectedStudent(student);
                            setActiveTab('transcripts');
                          }}>
                            <FileText className="h-4 w-4 mr-1" />
                            Transcript
                          </Button>
                        </div>
                      </td>
                    </motion.tr>;
                  })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} students
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          </Card>
        </>
      )}

      {/* Student Detail View */}
      <AnimatePresence>
        {selectedStudent && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 20
      }}>
            <Card className="p-6">
              {/* Student Header */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                    {selectedStudent.profile_photo_path ? <img src={selectedStudent.profile_photo_path} alt={selectedStudent.full_name} className="w-20 h-20 rounded-full object-cover" /> : <User className="h-10 w-10 text-indigo-600" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedStudent.full_name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {selectedStudent.admission_number}
                      </span>
                      {selectedStudent.class_name && <>
                          <span>•</span>
                          <span>{selectedStudent.class_name}</span>
                        </>}
                    </div>
                    {/* Performance Summary */}
                    {performanceStats && (
                      <div className="mt-3 flex gap-6 text-sm">
                        <span className={`font-semibold ${performanceStats.avgScore >= 80 ? 'text-green-600' : performanceStats.avgScore >= 60 ? 'text-blue-600' : performanceStats.avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          Avg: {performanceStats.avgScore.toFixed(1)}%
                        </span>
                        <span className="text-slate-600">High: {performanceStats.highest.toFixed(1)}%</span>
                        <span className="text-slate-600">Low: {performanceStats.lowest.toFixed(1)}%</span>
                        <span className={`px-2 py-1 rounded ${performanceStats.status === 'Excellent' ? 'bg-green-100 text-green-700' : performanceStats.status === 'Good' ? 'bg-blue-100 text-blue-700' : performanceStats.status === 'Fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{performanceStats.status}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} defaultValue="academic-history" onValueChange={setActiveTab}>
                <Tabs.List className="mb-6">
                  <Tabs.Trigger value="academic-history">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Academic History
                  </Tabs.Trigger>
                  <Tabs.Trigger value="sequence-marks">
                    <Award className="h-4 w-4 mr-2" />
                    Sequence Marks
                  </Tabs.Trigger>
                  <Tabs.Trigger value="transcripts">
                    <FileText className="h-4 w-4 mr-2" />
                    Transcripts
                  </Tabs.Trigger>
                  <Tabs.Trigger value="personal-info">
                    <User className="h-4 w-4 mr-2" />
                    Personal Info
                  </Tabs.Trigger>
                </Tabs.List>

                {/* Academic History Tab */}
                <Tabs.Content value="academic-history">
                  {academicHistory.length === 0 ? <div className="text-center py-12 text-slate-500">
                      No academic history available for this student.
                    </div> : <div className="space-y-6">
                      {academicHistory.map((yearRecord: any) => (
                        <Card key={yearRecord.year} className="overflow-hidden">
                          <div 
                            className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleYear(yearRecord.year)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white rounded-lg border border-slate-200">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{yearRecord.year}</h3>
                                <p className="text-sm text-slate-500">{yearRecord.class} • {yearRecord.subjects.length} Subjects</p>
                              </div>
                            </div>
                            {expandedYears.has(yearRecord.year) ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                          </div>
                          
                          <AnimatePresence>
                            {expandedYears.has(yearRecord.year) && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {yearRecord.subjects.map((sub: any) => (
                                    <div key={sub.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                                      <div className="font-medium text-slate-900">{sub.subjects?.name}</div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      ))}
                    </div>}
                </Tabs.Content>

                {/* Sequence Marks Tab */}
                <Tabs.Content value="sequence-marks">
                  {sequenceMarks.length === 0 ? <div className="text-center py-12 text-slate-500">
                      No sequence marks available for this student.
                    </div> : <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                Year
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                Term
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                Sequence
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                Subject
                              </th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                                Score
                              </th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                                %
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                                Comments
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {sequenceMarks.map((mark, idx) => (
                              <tr key={idx}>
                                <td className="px-6 py-4 text-sm text-slate-700">{mark.year}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{mark.term}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{mark.sequence}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{mark.subject}</td>
                                <td className="px-6 py-4 text-center text-sm font-semibold"
                                  style={{ color: mark.percentage >= 80 ? '#16a34a' : mark.percentage >= 60 ? '#2563eb' : mark.percentage >= 50 ? '#ca8a04' : '#dc2626' }}>
                                  {mark.score}
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-semibold"
                                  style={{ color: mark.percentage >= 80 ? '#16a34a' : mark.percentage >= 60 ? '#2563eb' : mark.percentage >= 50 ? '#ca8a04' : '#dc2626' }}>
                                  {mark.percentage.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{mark.comments || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>}
                </Tabs.Content>

                {/* Transcripts Tab */}
                <Tabs.Content value="transcripts">
                  <div className="space-y-6">
                    {/* Generate Buttons */}
                    <div className="flex gap-4">
                      <Button onClick={() => handleGenerateTranscript('official')} className="bg-indigo-600 hover:bg-indigo-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Official Transcript
                      </Button>
                      <Button onClick={() => handleGenerateTranscript('unofficial')} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Generate Unofficial Transcript
                      </Button>
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Transcript
                      </Button>
                    </div>

                    {/* Existing Transcripts */}
                    {transcripts.length === 0 ? <div className="text-center py-12 text-slate-500">
                        No transcripts generated yet. Click the buttons above to
                        generate one.
                      </div> : <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-slate-900 mb-4">
                            Generated Transcripts
                          </h3>
                          <div className="space-y-3">
                            {/* Transcripts will be populated from database */}
                          </div>
                        </div>
                      </Card>}
                  </div>
                </Tabs.Content>

                {/* Personal Info Tab */}
                <Tabs.Content value="personal-info">
                  <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-indigo-600" />
                          Student Details
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date of Birth</div>
                              <div className="mt-1 font-medium text-slate-900">{selectedStudent.date_of_birth || 'Not set'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gender</div>
                              <div className="mt-1 font-medium text-slate-900">{selectedStudent.gender || 'Not set'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Blood Type</div>
                              <div className="mt-1 font-medium text-slate-900">{selectedStudent.blood_type || 'N/A'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Address</div>
                              <div className="mt-1 font-medium text-slate-900 truncate" title={selectedStudent.address}>{selectedStudent.address || 'Not set'}</div>
                            </div>
                          </div>
                          
                          <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
                            <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Medical Information
                            </h4>
                            <div className="text-sm text-red-700">
                              <span className="font-semibold">Conditions:</span> {selectedStudent.medical_conditions || 'None listed'}
                            </div>
                            <div className="text-sm text-red-700 mt-1">
                              <span className="font-semibold">Allergies:</span> {selectedStudent.allergies || 'None listed'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Heart className="h-5 w-5 text-indigo-600" />
                          Guardian Information
                        </h3>
                        <div className="space-y-4">
                          {guardians.map((guardian, idx) => (
                            <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-white">
                              <div className="font-bold text-slate-900">{guardian.full_name}</div>
                              <div className="text-sm text-indigo-600 font-medium mb-2">{guardian.relationship}</div>
                              <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-slate-400" />
                                  {guardian.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-slate-400" />
                                  {guardian.email || 'No email provided'}
                                </div>
                              </div>
                            </div>
                          ))}
                          {guardians.length === 0 && (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                              No guardian information available.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Tabs.Content>
              </Tabs>
            </Card>
          </motion.div>}
      </AnimatePresence>
    </div>;
}