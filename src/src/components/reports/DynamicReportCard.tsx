import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Award, Calendar, User, GraduationCap, Phone, Mail, MapPin } from 'lucide-react';

interface DynamicReportCardProps {
  studentId: string;
  sequenceId?: string;
  termId?: string;
  academicYearId?: string;
  schoolId: string;
  transcriptType?: 'official' | 'unofficial';
}

interface SubjectMark {
  subject_name: string;
  subject_type: 'core' | 'elective';
  coefficient: number;
  total_score: number;
  total_out_of: number;
  percentage: number;
  grade: string;
  teacher_name?: string;
  comments?: string;
  attendance_present: number;
  attendance_total: number;
}

export function DynamicReportCard({
  studentId,
  sequenceId,
  termId,
  academicYearId,
  schoolId,
  transcriptType = 'unofficial'
}: DynamicReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectMark[]>([]);
  const [gradingScale, setGradingScale] = useState<'out_of_20' | 'percentage' | 'gpa_4_0' | 'gpa_5_0' | 'custom'>('percentage');
  const [defaultExamOutOf, setDefaultExamOutOf] = useState(100);
  const [gpaMapping, setGpaMapping] = useState<any>(null);
  const [stats, setStats] = useState({
    finalAverage: 0,
    letterGrade: 'N/A',
    rank: 0,
    classSize: 0,
    totalAttendancePresent: 0,
    totalAttendanceTotal: 0,
    attendancePercentage: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [studentId, sequenceId, termId, academicYearId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*, classes(id, name, description)')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);
      setClassInfo(studentData.classes);

      // Fetch school data with grading configuration
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData);
      
      // Set grading configuration
      setGradingScale(schoolData.grading_scale || 'percentage');
      setDefaultExamOutOf(schoolData.default_exam_out_of || 100);
      setGpaMapping(schoolData.gpa_mapping);

      // Fetch period data
      let periodData: any = {};
      let scope = '';
      
      if (sequenceId) {
        scope = 'sequence';
        const { data, error } = await supabase
          .from('sequences')
          .select('*, terms(name, academic_years(year_name))')
          .eq('id', sequenceId)
          .single();
        if (!error) periodData = { ...data, scope };
      } else if (termId) {
        scope = 'term';
        const { data, error } = await supabase
          .from('terms')
          .select('*, academic_years(year_name)')
          .eq('id', termId)
          .single();
        if (!error) periodData = { ...data, scope };
      } else if (academicYearId) {
        scope = 'year';
        const { data, error } = await supabase
          .from('academic_years')
          .select('*')
          .eq('id', academicYearId)
          .single();
        if (!error) periodData = { ...data, scope };
      }
      
      setPeriod(periodData);

      // Fetch enrollments and marks
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, subject_id, subjects(name, subject_type, coefficient)')
        .eq('student_id', studentId);

      if (enrollError) throw enrollError;

      // Fetch marks for each enrollment
      const subjectMarks: SubjectMark[] = [];
      let totalWeightedScore = 0;
      let totalCoefficients = 0;
      let totalAttendancePresent = 0;
      let totalAttendanceTotal = 0;

      for (const enrollment of enrollments || []) {
        let marksQuery = supabase
          .from('marks')
          .select('score, out_of, comments, attendance_present, attendance_total, users(full_name)')
          .eq('enrollment_id', enrollment.id);

        // Filter by period
        if (sequenceId) {
          marksQuery = marksQuery.eq('sequence_id', sequenceId);
        } else if (termId) {
          const { data: sequences } = await supabase
            .from('sequences')
            .select('id')
            .eq('term_id', termId);
          const sequenceIds = sequences?.map(s => s.id) || [];
          marksQuery = marksQuery.in('sequence_id', sequenceIds);
        } else if (academicYearId) {
          const { data: terms } = await supabase
            .from('terms')
            .select('id')
            .eq('academic_year_id', academicYearId);
          const termIds = terms?.map(t => t.id) || [];
          
          const { data: sequences } = await supabase
            .from('sequences')
            .select('id')
            .in('term_id', termIds);
          const sequenceIds = sequences?.map(s => s.id) || [];
          marksQuery = marksQuery.in('sequence_id', sequenceIds);
        }

        const { data: marks } = await marksQuery;

        if (marks && marks.length > 0) {
          const totalScore = marks.reduce((sum, m) => sum + (m.score || 0), 0);
          const totalOutOf = marks.reduce((sum, m) => sum + (m.out_of || 0), 0);
          const attendancePresent = marks.reduce((sum, m) => sum + (m.attendance_present || 0), 0);
          const attendanceTotal = marks.reduce((sum, m) => sum + (m.attendance_total || 0), 0);
          const percentage = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : 0;
          const grade = getLetterGrade(percentage);
          const subjectData = Array.isArray(enrollment.subjects) ? enrollment.subjects[0] : enrollment.subjects;
          const coefficient = subjectData?.coefficient || 1;

          subjectMarks.push({
            subject_name: subjectData?.name || 'Unknown',
            subject_type: subjectData?.subject_type || 'core',
            coefficient,
            total_score: totalScore,
            total_out_of: totalOutOf,
            percentage,
            grade,
            teacher_name: (marks[0]?.users as any)?.full_name || undefined,
            comments: marks.find(m => m.comments)?.comments,
            attendance_present: attendancePresent,
            attendance_total: attendanceTotal
          });

          totalWeightedScore += percentage * coefficient;
          totalCoefficients += coefficient;
          totalAttendancePresent += attendancePresent;
          totalAttendanceTotal += attendanceTotal;
        }
      }

      setSubjects(subjectMarks.sort((a, b) => a.subject_name.localeCompare(b.subject_name)));

      // Calculate final average
      const finalAverage = totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
      const attendancePercentage = totalAttendanceTotal > 0 
        ? (totalAttendancePresent / totalAttendanceTotal) * 100 
        : 0;

      // Calculate rank (simplified - would need all students' data for accurate ranking)
      const { count: classSize } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', studentData.class_id);

      setStats({
        finalAverage,
        letterGrade: getLetterGrade(finalAverage),
        rank: 0, // Would need to calculate based on all students
        classSize: classSize || 0,
        totalAttendancePresent,
        totalAttendanceTotal,
        attendancePercentage
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (score: number): string => {
    // If school uses GPA mapping, use that
    if (gpaMapping && ['gpa_4_0', 'gpa_5_0', 'custom'].includes(gradingScale)) {
      for (const [range, value] of Object.entries(gpaMapping)) {
        const [min, max] = range.split('-').map(Number);
        if (score >= min && score <= max) {
          return (value as any).letter;
        }
      }
    }
    
    // Default letter grade calculation based on percentage
    const percentage = gradingScale === 'out_of_20' ? (score / 20) * 100 : score;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const formatScore = (score: number): string => {
    if (gradingScale === 'out_of_20') {
      return `${score.toFixed(2)}/20`;
    } else if (gradingScale === 'percentage') {
      return `${score.toFixed(1)}%`;
    } else {
      // For GPA scales, show the percentage
      return `${score.toFixed(1)}%`;
    }
  };

  const convertToDisplayScore = (percentage: number): number => {
    if (gradingScale === 'out_of_20') {
      return (percentage / 100) * 20;
    }
    return percentage;
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!student || !school) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Unable to load report card data</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-2xl rounded-xl max-w-6xl mx-auto overflow-hidden relative" id="dynamic-report-card">
      {/* Watermark for unofficial transcripts */}
      {transcriptType === 'unofficial' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
          <div className="transform -rotate-45 text-9xl font-bold text-gray-400">
            UNOFFICIAL
          </div>
        </div>
      )}

      {/* Decorative Header Stripe */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 h-2"></div>

      {/* Header with School Info */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 border-b-4 border-blue-600 relative z-10">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-6 flex-1">
            {school.logo_path && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-xl border-4 border-white shadow-xl bg-white p-2 flex items-center justify-center">
                  <img 
                    src={school.logo_path} 
                    alt="School Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                {school.name}
              </h1>
              {school.address && (
                <div className="text-sm text-gray-700 space-y-1.5 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium">{school.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="bg-white px-6 py-4 rounded-xl border-4 border-blue-600 shadow-xl">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-1">
                {transcriptType === 'official' ? 'Official Transcript' : 'Report Card'}
              </p>
              <p className="text-2xl font-bold text-blue-700 capitalize mb-1">
                {period?.scope || 'Academic'}
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                {period?.name || 'Full Year'}
              </p>
              {transcriptType === 'official' && (
                <div className="mt-3 pt-3 border-t-2 border-red-200">
                  <p className="text-xs text-red-600 font-bold flex items-center justify-center gap-1">
                    <Award className="h-3 w-3" />
                    OFFICIAL DOCUMENT
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-3 gap-6 m-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-200">
            <User className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Student Information
            </p>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-xl font-bold text-gray-900">{student.full_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Admission Number</p>
                <p className="text-sm font-semibold text-gray-700">{student.admission_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class</p>
                <p className="text-sm font-semibold text-gray-700">{classInfo?.name}</p>
              </div>
              {student.date_of_birth && (
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-sm text-gray-700">
                    {new Date(student.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {student.gender && (
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm text-gray-700 capitalize">{student.gender}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-amber-200">
            <Award className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Performance
            </p>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Overall Average</p>
              <p className={`text-3xl font-bold ${getGradeColor(stats.finalAverage)}`}>
                {formatScore(convertToDisplayScore(stats.finalAverage))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Grade</p>
              <p className="text-3xl font-bold text-blue-600">{stats.letterGrade}</p>
            </div>
            {stats.attendancePercentage > 0 && (
              <div className="bg-white p-4 rounded-xl border-2 border-green-200 shadow-md">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-1">Attendance</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.attendancePercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalAttendancePresent}/{stats.totalAttendanceTotal} days
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      {subjects.length > 0 ? (
        <div className="mx-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b-2 border-blue-600">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Academic Performance
          </h3>
          <div className="overflow-hidden border-2 border-blue-200 rounded-xl shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    Coeff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Teacher
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subjects.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{subject.subject_name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={subject.subject_type === 'core' ? 'success' : 'info'} size="sm">
                        {subject.subject_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {subject.total_score} / {subject.total_out_of}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${getGradeColor(subject.percentage)}`}>
                        {formatScore(convertToDisplayScore(subject.percentage))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={subject.percentage >= 60 ? 'success' : 'warning'}>
                        {subject.grade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                      ×{subject.coefficient}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {subject.teacher_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-900">
                    Overall Average:
                  </td>
                  <td colSpan={2} className="px-4 py-3 text-center">
                    <span className={`text-xl font-bold ${getGradeColor(stats.finalAverage)}`}>
                      {formatScore(convertToDisplayScore(stats.finalAverage))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={stats.finalAverage >= 60 ? 'success' : 'danger'} size="sm">
                      {stats.letterGrade}
                    </Badge>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No marks available for this period</p>
        </div>
      )}

      {/* Comments Section */}
      {subjects.some(s => s.comments) && (
        <div className="mx-8 mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-6 rounded-xl shadow-md">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-yellow-600" />
            Teacher Comments
          </h4>
          <div className="space-y-3">
            {subjects
              .filter(s => s.comments)
              .map((subject, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-yellow-200">
                  <span className="font-semibold text-gray-800">{subject.subject_name}:</span>{' '}
                  <span className="text-gray-700">{subject.comments}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mx-8 mt-8 pt-6 border-t-2 border-gray-300">
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <div className="border-t-2 border-gray-500 pt-2">
            <p className="text-sm text-gray-800 font-bold">Class Teacher</p>
            <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
          </div>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <div className="border-t-2 border-gray-500 pt-2">
            <p className="text-sm text-gray-800 font-bold">Principal</p>
            <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
          </div>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2"></div>
          <div className="border-t-2 border-gray-500 pt-2">
            <p className="text-sm text-gray-800 font-bold">Parent/Guardian</p>
            <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 mx-8 mb-8 pt-6 border-t-2 border-gray-300 text-center relative z-10">
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2 font-medium">
          <Calendar className="h-4 w-4" />
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          This is {transcriptType === 'official' ? 'an official' : 'an unofficial'} document from {school.name}
        </p>
        {transcriptType === 'official' && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
            <p className="text-xs text-red-700 font-bold flex items-center justify-center gap-2">
              <Award className="h-4 w-4" />
              ⚠️ OFFICIAL TRANSCRIPT
            </p>
            <p className="text-xs text-red-600 mt-2">
              This document bears the official seal and signature of the institution.
              Any alteration or unauthorized reproduction is strictly prohibited.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
