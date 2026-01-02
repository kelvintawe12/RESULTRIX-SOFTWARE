import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, FileText, Eye, TrendingUp, Award, Calendar, BookOpen, User, GraduationCap, ChevronDown, ChevronRight, Printer, Mail, X, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabaseClient';
interface Student {
  id: string;
  admission_number: string;
  full_name: string;
  class_name?: string;
  years_enrolled?: string;
  total_subjects?: number;
  photo_url?: string;
  overall_average?: number;
  rank?: number;
}
interface AcademicYear {
  year_name: string;
  class_name: string;
  subjects: SubjectRecord[];
  overall_avg: number;
  overall_rank: string;
  attendance: string;
}
interface SubjectRecord {
  code: string;
  name: string;
  term1?: number;
  term2?: number;
  term3?: number;
  year_avg: number;
  rank: string;
}
interface SequenceMark {
  year: string;
  term: string;
  sequence: string;
  subject: string;
  score: string;
  percentage: number;
  comments?: string;
}
interface Transcript {
  id: string;
  type: string;
  scope: string;
  date: string;
  status: string;
}
export function StudentAcademicRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('academic-history');
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [academicHistory, setAcademicHistory] = useState<AcademicYear[]>([]);
  const [sequenceMarks, setSequenceMarks] = useState<SequenceMark[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);
  // Fetch student data when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAcademicHistory(selectedStudent.id);
      fetchStudentSequenceMarks(selectedStudent.id);
      fetchStudentTranscripts(selectedStudent.id);
    }
  }, [selectedStudent]);
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('students').select(`
          id,
          admission_number,
          full_name,
          profile_photo_path,
          classes (name),
          academic_years (year_name)
        `).order('full_name');
      if (error) throw error;
      const formattedStudents: Student[] = (data || []).map((student: any) => ({
        id: student.id,
        admission_number: student.admission_number,
        full_name: student.full_name,
        class_name: student.classes?.name,
        photo_url: student.profile_photo_path,
        years_enrolled: student.academic_years?.year_name
      }));
      setStudents(formattedStudents);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };
  const fetchStudentAcademicHistory = async (studentId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('enrollments').select(`
          *,
          subjects (code, name),
          academic_years (year_name),
          classes (name)
        `).eq('student_id', studentId);
      if (error) throw error;
      setAcademicHistory([]);
    } catch (err: any) {
      console.error('Error fetching academic history:', err);
    }
  };
  const fetchStudentSequenceMarks = async (studentId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('marks').select(`
          *,
          sequences (name),
          terms (name),
          academic_years (year_name),
          subjects (code, name)
        `).eq('student_id', studentId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setSequenceMarks([]);
    } catch (err: any) {
      console.error('Error fetching sequence marks:', err);
    }
  };
  const fetchStudentTranscripts = async (studentId: string) => {
    try {
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
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class_name === selectedClass;
    return matchesSearch && matchesClass;
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
      {!selectedStudent && <Card>
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
                  </tr> : filteredStudents.map(student => <motion.tr key={student.id} initial={{
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
                            {student.photo_url ? <img src={student.photo_url} alt={student.full_name} className="w-10 h-10 rounded-full object-cover" /> : <User className="h-5 w-5 text-indigo-600" />}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {student.full_name}
                          </span>
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
                    </motion.tr>)}
              </tbody>
            </table>
          </div>
        </Card>}

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
                    {selectedStudent.photo_url ? <img src={selectedStudent.photo_url} alt={selectedStudent.full_name} className="w-20 h-20 rounded-full object-cover" /> : <User className="h-10 w-10 text-indigo-600" />}
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
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      {/* Academic history will be populated from database */}
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
                            {/* Sequence marks will be populated from database */}
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
                    <div className="text-center py-12 text-slate-500">
                      Personal information will be loaded from the database.
                    </div>
                  </Card>
                </Tabs.Content>
              </Tabs>
            </Card>
          </motion.div>}
      </AnimatePresence>
    </div>;
}