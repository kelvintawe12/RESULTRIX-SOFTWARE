import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  ResolvedTemplate,
  DEFAULT_TEMPLATE,
  fontSizeToPx,
  borderStyleToCss,
} from '../../types/reportTemplate';

interface DynamicReportCardProps {
  studentId: string;
  sequenceId?: string;
  termId?: string;
  academicYearId?: string;
  schoolId: string;
  transcriptType?: 'official' | 'unofficial';
  rank?: number;
  classSize?: number;
  /** School's active template (config + colors). Falls back to DEFAULT_TEMPLATE. */
  template?: ResolvedTemplate;
  /** Fired once the report data has loaded (success or failure). Used for off-screen PDF capture. */
  onReady?: () => void;
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
  sequenceMarks?: Record<string, { score: number; out_of: number; percentage: number; grade: string }>;
}

export function DynamicReportCard({
  studentId,
  sequenceId,
  termId,
  academicYearId,
  schoolId,
  transcriptType = 'unofficial',
  rank,
  classSize,
  template,
  onReady
}: DynamicReportCardProps) {
  const tpl = template ?? DEFAULT_TEMPLATE;
  const cfg = tpl.config;
  const cs = tpl.colorScheme;
  const signatureFields =
    cfg.includeDigitalSignatures && cfg.signatureFields && cfg.signatureFields.length > 0
      ? cfg.signatureFields
      : ['Class Master', 'Principal', 'Parent/Guardian'];
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [period, setPeriod] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectMark[]>([]);
  const [gradingScale] = useState<'out_of_20' | 'percentage'>('percentage');
  const [stats, setStats] = useState({
    finalAverage: 0,
    letterGrade: 'N/A',
    rank: rank,
    classSize: classSize || 0,
    totalAttendancePresent: 0,
    totalAttendanceTotal: 0,
    attendancePercentage: 0,
    totalSubjects: 0,
    subjectsPassed: 0,
    subjectsFailed: 0,
    termStatus: '',
  });
  const [sequences, setSequences] = useState<any[]>([]); // Store sequences for current term

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
      setClassInfo(Array.isArray(studentData.classes) ? studentData.classes[0] : studentData.classes);

      // Fetch school data with grading configuration
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData);
      // Fetch period data
      let periodData: any = {};
      let scope = '';
      let sequenceList: any[] = [];
      if (sequenceId) {
        scope = 'sequence';
        const { data, error } = await supabase
          .from('sequences')
          .select('*, terms(name, academic_years(year_name))')
          .eq('id', sequenceId)
          .single();
        if (!error && data) {
          const term = Array.isArray(data.terms) ? data.terms[0] : data.terms;
          const year = term && (Array.isArray(term.academic_years) ? term.academic_years[0] : term.academic_years);
          periodData = { ...data, scope, term: term?.name, year: year?.year_name };
        }
        sequenceList = data ? [data] : [];
      } else if (termId) {
        scope = 'term';
        const { data, error } = await supabase
          .from('terms')
          .select('*, academic_years(year_name)')
          .eq('id', termId)
          .single();
        if (!error && data) {
          const year = Array.isArray(data.academic_years) ? data.academic_years[0] : data.academic_years;
          periodData = { ...data, scope, term: data.name, year: year?.year_name };
        }
        // Fetch all sequences for this term
        const { data: seqs } = await supabase
          .from('sequences')
          .select('id, name')
          .eq('term_id', termId);
        sequenceList = seqs || [];
      } else if (academicYearId) {
        scope = 'year';
        const { data, error } = await supabase
          .from('academic_years')
          .select('*')
          .eq('id', academicYearId)
          .single();
        if (!error && data) periodData = { ...data, scope, year: data.year_name };
        // Fetch all terms for this year, then all sequences for those terms
        const { data: terms } = await supabase
          .from('terms')
          .select('id')
          .eq('academic_year_id', academicYearId);
        const termIds = terms?.map(t => t.id) || [];
        const { data: seqs } = await supabase
          .from('sequences')
          .select('id, name, term_id')
          .in('term_id', termIds);
        sequenceList = seqs || [];
      }
      setPeriod(periodData);
      setSequences(sequenceList);

      // Fetch enrollments and marks
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, subject_id, subjects(name, subject_type, coefficient)')
        .eq('student_id', studentId);
      if (enrollError) throw enrollError;

      // Fetch marks for each enrollment
      const subjectMarks: any[] = [];
      let totalWeightedScore = 0;
      let totalCoefficients = 0;
      let totalAttendancePresent = 0;
      let totalAttendanceTotal = 0;

      for (const enrollment of enrollments || []) {
        // Fetch all marks for this enrollment (all sequences in period)
        const { data: marksRaw } = await supabase
          .from('marks')
          .select('score, out_of, comments, attendance_present, attendance_total, users(full_name), sequence_id')
          .eq('enrollment_id', enrollment.id);
        const marks = marksRaw || [];

        // Map marks by sequence
        const sequenceMarks: Record<string, { score: number; out_of: number; percentage: number; grade: string }> = {};
        for (const seq of sequenceList) {
          const mark = marks.find(m => m.sequence_id === seq.id);
          if (mark) {
            const percentage = mark.out_of > 0 ? (mark.score / mark.out_of) * 100 : 0;
            sequenceMarks[seq.id] = {
              score: mark.score,
              out_of: mark.out_of,
              percentage,
              grade: getLetterGrade(percentage)
            };
          } else {
            sequenceMarks[seq.id] = {
              score: 0,
              out_of: 0,
              percentage: 0,
              grade: '-'
            };
          }
        }

        // Aggregate term average
        const totalScore = marks.length > 0 ? marks.reduce((sum, m) => sum + (m.score || 0), 0) : 0;
        const totalOutOf = marks.length > 0 ? marks.reduce((sum, m) => sum + (m.out_of || 0), 0) : 0;
        const attendancePresent = marks.length > 0 ? marks.reduce((sum, m) => sum + (m.attendance_present || 0), 0) : 0;
        const attendanceTotal = marks.length > 0 ? marks.reduce((sum, m) => sum + (m.attendance_total || 0), 0) : 0;
        const percentage = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : 0;
        const grade = getLetterGrade(percentage);
        const subjectData = Array.isArray(enrollment.subjects) ? enrollment.subjects[0] : enrollment.subjects;
        const coefficient = subjectData?.coefficient || 1;

        subjectMarks.push({
          subject_name: subjectData?.name || 'Unknown',
          subject_type: subjectData?.subject_type || 'core',
          coefficient,
          sequenceMarks,
          total_score: totalScore,
          total_out_of: totalOutOf,
          percentage,
          grade,
          teacher_name: marks.length > 0 ? (marks[0]?.users as any)?.full_name || undefined : undefined,
          comments: marks.length > 0 ? marks.find(m => m.comments)?.comments : undefined,
          attendance_present: attendancePresent,
          attendance_total: attendanceTotal
        });
        totalWeightedScore += percentage * coefficient;
        totalCoefficients += coefficient;
        totalAttendancePresent += attendancePresent;
        totalAttendanceTotal += attendanceTotal;
      }

      setSubjects(subjectMarks.sort((a, b) => a.subject_name.localeCompare(b.subject_name)));

      // Calculate final average
      const finalAverage = totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
      const attendancePercentage = totalAttendanceTotal > 0 
        ? (totalAttendancePresent / totalAttendanceTotal) * 100 
        : 0;

      // Determine class rank/size.
      // Prefer the server-computed rank/class_size passed via props (from report_cards.data,
      // where the SQL RPC computes RANK() accurately). When those are absent, fall back to
      // ranking against sibling students' stored reports for the same period.
      // Note: use studentData.classes directly — classInfo state is not yet updated this render.
      const studentClass = Array.isArray(studentData.classes) ? studentData.classes[0] : studentData.classes;
      let resolvedRank: number | undefined = typeof rank === 'number' ? rank : undefined;
      let resolvedClassSize: number = classSize && classSize > 0 ? classSize : 0;

      if (resolvedRank === undefined && studentClass?.id) {
        const fallback = await computeRankFallback(studentClass.id, finalAverage);
        if (fallback) {
          resolvedRank = fallback.rank;
          if (!resolvedClassSize) resolvedClassSize = fallback.classSize;
        }
      }

      // Calculate pass/fail and subject stats.
      // Pass threshold is 50% (10/20), matching the term Pass/Fail criteria.
      // Only count subjects that actually have marks (percentage > 0) toward pass/fail.
      const totalSubjects = subjectMarks.length;
      const gradedSubjects = subjectMarks.filter(s => s.total_out_of > 0);
      const subjectsPassed = gradedSubjects.filter(s => s.percentage >= 50).length;
      const subjectsFailed = gradedSubjects.filter(s => s.percentage < 50).length;
      const termStatus = finalAverage >= 50 ? 'Pass' : 'Fail';
      setStats({
        finalAverage,
        letterGrade: getLetterGrade(finalAverage),
        rank: resolvedRank,
        classSize: resolvedClassSize,
        totalAttendancePresent,
        totalAttendanceTotal,
        attendancePercentage,
        totalSubjects,
        subjectsPassed,
        subjectsFailed,
        termStatus,
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
      onReady?.();
    }
  };

  // Fallback ranking: rank this student against sibling students' stored reports for the
  // same period and class. Returns competition rank (ties share a rank, like SQL RANK()).
  const computeRankFallback = async (
    classId: string,
    thisAverage: number
  ): Promise<{ rank: number; classSize: number } | null> => {
    let periodCol: 'sequence_id' | 'term_id' | 'academic_year_id';
    let periodId: string | undefined;
    if (sequenceId) {
      periodCol = 'sequence_id';
      periodId = sequenceId;
    } else if (termId) {
      periodCol = 'term_id';
      periodId = termId;
    } else if (academicYearId) {
      periodCol = 'academic_year_id';
      periodId = academicYearId;
    } else {
      return null;
    }
    if (!periodId) return null;

    const { data, error } = await supabase
      .from('report_cards')
      .select('student_id, data, students!inner(class_id)')
      .eq('students.class_id', classId)
      .eq(periodCol, periodId);

    if (error || !data || data.length === 0) return null;

    const averages = data
      .map(r => (r.data as any)?.final_average)
      .filter((a: any) => typeof a === 'number');
    if (averages.length === 0) return null;

    const higher = averages.filter((a: number) => a > thisAverage).length;
    return { rank: higher + 1, classSize: data.length };
  };

  const getLetterGrade = (score: number): string => {
    // If school uses GPA mapping, use that
    // GPA mapping logic removed (not used)
    
    // Default letter grade calculation based on percentage
    const percentage = gradingScale === 'out_of_20' ? (score / 20) * 100 : score;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
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
    <div
      className="bg-white shadow-2xl rounded-xl max-w-6xl mx-auto overflow-hidden relative"
      id="dynamic-report-card"
      style={{ fontFamily: cfg.fontFamily, fontSize: fontSizeToPx(cfg.fontSize), border: borderStyleToCss(cfg.borderStyle) }}
    >
      {/* Watermark overlay */}
      {cfg.showWatermark && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          style={{ opacity: cfg.watermarkOpacity ?? 0.05 }}
        >
          <div className="text-9xl font-bold transform rotate-[-45deg] select-none" style={{ color: cs.primary }}>
            {cfg.watermarkText || 'OFFICIAL'}
          </div>
        </div>
      )}

      {/* Official stamp overlay */}
      {cfg.includeStamp && (
        <div
          className={`absolute z-10 ${
            cfg.stampPosition === 'bottom-left' ? 'bottom-8 left-8' :
            cfg.stampPosition === 'top-right' ? 'top-8 right-8' :
            cfg.stampPosition === 'top-left' ? 'top-8 left-8' : 'bottom-8 right-8'
          }`}
        >
          <div
            className="w-24 h-24 rounded-full border-4 flex items-center justify-center transform rotate-12 text-center text-xs font-bold"
            style={{ borderColor: cs.accent, color: cs.accent, backgroundColor: `${cs.accent}10` }}
          >
            {transcriptType === 'official' ? 'OFFICIAL' : 'PREVIEW'}
          </div>
        </div>
      )}

      <div className="relative z-[5]">
      {/* Header Section */}
      <div className="flex justify-between items-start p-8" style={{ borderBottom: `2px solid ${cs.primary}` }}>
        <div>
          {cfg.showLogo && school.logo_path && (
            <img src={school.logo_path} alt="School Logo" crossOrigin="anonymous" className="h-16 mb-2" />
          )}
          <h1 className="text-2xl font-bold uppercase" style={{ color: cs.primary }}>{school.name}</h1>
          {cfg.includeSchoolMotto !== false && (
            <p className="text-xs italic text-gray-600">{cfg.header || (school.motto ? school.motto : '"Building Hearts and Minds for a Better Future"')}</p>
          )}
          <p className="text-xs text-gray-500">{school.address}</p>
        </div>
        <div className="rounded-lg p-4 min-w-[180px] text-center" style={{ border: `1px solid ${cs.primary}` }}>
          <div className="text-xs font-semibold text-gray-700">ACADEMIC YEAR</div>
          <div className="font-bold text-lg text-black">{period?.year || '2025/2026'}</div>
          <div className="text-xs font-semibold text-gray-700 mt-2">TERM</div>
          <div className="font-bold text-base text-black">{period?.term || period?.name}</div>
          <div className="text-xs font-semibold text-gray-700 mt-2">CLASS</div>
          <div className="font-bold text-base text-black">{classInfo?.name}</div>
        </div>
      </div>
      <div className="px-8 pt-6">

      {/* Student Information Table */}
      <table className="w-full mb-6 border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left text-xs font-semibold text-gray-700">NAME:</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">ADMISSION NO:</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">CLASS:</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">TERM:</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 font-bold text-black">{student.full_name}</td>
            <td className="p-2 font-bold text-black">{student.admission_number}</td>
            <td className="p-2 font-bold text-black">{classInfo?.name}</td>
            <td className="p-2 font-bold text-black">{period?.term || period?.name}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td className="p-2 text-xs font-semibold text-gray-700">ACADEMIC YEAR: {period?.year || '2025/2026'}</td>
            <td className="p-2 text-xs font-semibold text-gray-700">DATE OF BIRTH: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

      {/* Academic Performance Table */}
      <h2 className="text-lg font-bold mb-2" style={{ color: cs.primary }}>ACADEMIC PERFORMANCE</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 text-xs">
          <thead style={{ backgroundColor: `${cs.primary}15` }}>
            <tr>
              <th className="p-2 border-r">SUBJECT</th>
              {cfg.showSubjectCoefficients !== false && <th className="p-2 border-r">COEF</th>}
              {sequences.map(seq => (
                <th key={seq.id + '-marks'} className="p-2 border-r">{seq.name} MARKS</th>
              ))}
              {sequences.map(seq => (
                <th key={seq.id + '-grade'} className="p-2 border-r">{seq.name} GRADE</th>
              ))}
              <th className="p-2 border-r">TERM AVERAGE</th>
              <th className="p-2 border-r">TERM GRADE</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, idx) => {
              const passing = subject.total_out_of > 0 && subject.percentage >= 50;
              const gradeStyle = cfg.colorCodeGrades && subject.total_out_of > 0
                ? { color: passing ? '#16a34a' : '#dc2626' }
                : undefined;
              return (
              <tr key={idx} className="border-t">
                <td className="p-2 font-medium text-black">{subject.subject_name}</td>
                {cfg.showSubjectCoefficients !== false && <td className="p-2 text-center">{subject.coefficient}</td>}
                {sequences.map(seq => (
                  <td key={seq.id + '-marks'} className="p-2 text-center">{
                    subject.sequenceMarks && subject.sequenceMarks[seq.id] && subject.sequenceMarks[seq.id].score > 0
                      ? `${subject.sequenceMarks[seq.id].score} / ${subject.sequenceMarks[seq.id].out_of}`
                      : '-'
                  }</td>
                ))}
                {sequences.map(seq => (
                  <td key={seq.id + '-grade'} className="p-2 text-center">{
                    subject.sequenceMarks && subject.sequenceMarks[seq.id]
                      ? subject.sequenceMarks[seq.id].grade
                      : '-'
                  }</td>
                ))}
                <td className="p-2 text-center font-bold" style={gradeStyle}>{
                  subject.percentage > 0 ? subject.percentage.toFixed(1) : '-'
                }</td>
                <td className="p-2 text-center font-bold" style={gradeStyle}>{subject.grade}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Performance Summary Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <table className="w-full border border-gray-300 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ACADEMIC PERFORMANCE</th>
              <th className="p-2">SCORE</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2">Term Average</td><td className="p-2">{stats.finalAverage ? stats.finalAverage.toFixed(1) : '-'}</td></tr>
            <tr><td className="p-2">Final Grade</td><td className="p-2">{stats.letterGrade ?? '-'}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-gray-300 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">CLASS STANDING</th>
              <th className="p-2">VALUE</th>
            </tr>
          </thead>
          <tbody>
            {cfg.showRank !== false && <tr><td className="p-2">Class Rank</td><td className="p-2">{typeof stats.rank === 'number' && stats.classSize ? `#${stats.rank} of ${stats.classSize}` : 'Not ranked'}</td></tr>}
            <tr><td className="p-2">Total Subjects</td><td className="p-2">{stats.totalSubjects ?? '-'}</td></tr>
            <tr><td className="p-2">Subjects Passed</td><td className="p-2">{stats.subjectsPassed ?? '-'}</td></tr>
            <tr><td className="p-2">Subjects Failed</td><td className="p-2">{stats.subjectsFailed ?? '-'}</td></tr>
            <tr><td className="p-2">Term Status</td><td className="p-2 font-bold text-black">{stats.termStatus ?? '-'}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Attendance & Conduct */}
      {cfg.showAttendance !== false && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="font-semibold text-xs text-gray-700 mb-2">ATTENDANCE:</div>
            <div className="text-lg font-bold text-black">{stats.attendancePercentage ? `${stats.attendancePercentage.toFixed(1)}%` : '-'}</div>
          </div>
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="font-semibold text-xs text-gray-700 mb-2">CONDUCT:</div>
            <div className="text-lg font-bold text-black">{'Very Good'}</div>
          </div>
        </div>
      )}

      {/* Pass/Fail Criteria */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 text-xs text-gray-600">
        Pass/Fail Criteria: Students must achieve an average of 10/20 or higher to pass the term. Current average: {stats.finalAverage ? stats.finalAverage.toFixed(1) : '-'} ({stats.termStatus ?? '-'})
      </div>

      {/* Signatures & Verification */}
      <table className="w-full border border-gray-300 mb-6 text-xs">
        <tbody>
          <tr className="bg-gray-100">
            <td className="p-2 font-semibold">DATE GENERATED:</td>
            <td className="p-2">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">STUDENT:</td>
            <td className="p-2">{student.full_name}</td>
            <td className="p-2 font-semibold">CLASS:</td>
            <td className="p-2">{classInfo?.name}</td>
          </tr>
          <tr className="bg-gray-100">
            <td className="p-2 font-semibold">ACADEMIC YEAR:</td>
            <td className="p-2">{period?.year || '2025/2026'}</td>
            <td className="p-2 font-semibold">TERM:</td>
            <td className="p-2">{period?.term || period?.name}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid gap-8 mt-8 pt-6 border-t border-gray-200" style={{ gridTemplateColumns: `repeat(${signatureFields.length}, minmax(0, 1fr))` }}>
        {signatureFields.map((field, i) => (
          <div key={i}>
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="text-xs text-gray-600 text-center">{field}<br />Name &amp; Signature<br />Date: ____________</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 mb-8 pt-6 text-center" style={{ borderTop: `2px solid ${cs.primary}` }}>
        {cfg.footer ? (
          <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap">{cfg.footer}</p>
        ) : (
          <p className="text-sm text-gray-600 font-medium">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          This is {transcriptType === 'official' ? 'an official' : 'an unofficial'} document from {school.name}
        </p>
      </div>
      </div>{/* end px-8 content wrapper */}
      </div>{/* end relative z-[5] wrapper */}
    </div>
  );
}
