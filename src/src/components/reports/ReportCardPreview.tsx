interface ReportCardPreviewProps {
  student: {
    full_name: string;
    admission_number: string;
    class_name: string;
    profile_photo_path?: string;
  };
  reportData: {
    final_average?: number;
    rank?: number;
    class_size?: number;
    attendance_percentage?: number;
    letter_grade?: string;
    base_percentage?: number;
    total_subjects?: number;
    subjects_passed?: number;
    subjects_failed?: number;
    term_status?: string;
    seq1_average?: number | string;
    seq2_average?: number | string;
    term_average?: number | string;
    final_grade?: string;
    conduct?: string;
    report_id?: string;
    generated_at?: string;
  };
  subjects?: Array<{
    name?: string;
    subject_name?: string;
    score?: number;
    out_of?: number;
    percentage?: number;
    term_average?: number | string;
    coefficient?: number;
    comments?: string;
  }>;
  period: {
    scope: string;
    name: string;
    year?: string;
  };
  school: {
    name: string;
    logo_path?: string;
    address?: string;
  };
  template?: {
    header?: string;
    footer?: string;
    showLogo?: boolean;
    showRank?: boolean;
    showAttendance?: boolean;
    showComments?: boolean;
  };
}
export function ReportCardPreview({
  student,
  reportData,
  subjects = [],
  period,
  school,
  template = {}
}: ReportCardPreviewProps) {
  // Map raw subject marks to preview format
  const mapSubjects = (subjectsRaw: any[]) => {
    // Group marks by subject, then by sequence
    const mapped: any[] = [];
    subjectsRaw.forEach(subj => {
      mapped.push({
        name: subj.name || subj.subject_name,
        coefficient: subj.coefficient,
        seq1_marks: subj.seq1_marks ?? subj.seq1_score ?? '-',
        seq1_grade: subj.seq1_grade ?? '-',
        seq2_marks: subj.seq2_marks ?? subj.seq2_score ?? '-',
        seq2_grade: subj.seq2_grade ?? '-',
        term_average: subj.term_average ?? subj.percentage?.toFixed(1) ?? '-',
        term_grade: subj.term_grade ?? subj.grade ?? '-',
      });
    });
    return mapped;
  };

  // Use mapped subjects for the table
  const previewSubjects = mapSubjects(subjects);

  // Calculate summary stats if not provided
  const numericAverage = (s: any): number => {
    const v = s.percentage ?? s.term_average ?? 0;
    return typeof v === 'number' ? v : parseFloat(v) || 0;
  };
  const totalSubjects = reportData.total_subjects ?? subjects.length;
  const subjectsPassed = reportData.subjects_passed ?? subjects.filter(s => numericAverage(s) >= 50).length;
  const subjectsFailed = reportData.subjects_failed ?? subjects.filter(s => numericAverage(s) < 50).length;
  const termStatus = reportData.term_status ?? ((reportData.final_average ?? 0) >= 10 ? 'Pass' : 'Fail');

  return (
    <div className="bg-white p-8 shadow-2xl rounded-lg max-w-4xl mx-auto" id="report-card-preview">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {template.showLogo && school.logo_path && <img src={school.logo_path} alt="School Logo" className="h-16 mb-4" />}
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{school.name}</h1>
            {school.address && <p className="text-gray-600 text-sm">{school.address}</p>}
            {template.header && <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{template.header}</p>}
          </div>
          <div className="text-right">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Report Card</p>
              <p className="text-lg font-bold text-blue-600">{period.scope}</p>
              <p className="text-sm text-gray-700">{period.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information Table */}
      <table className="w-full mb-6 border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left text-xs font-semibold text-gray-700">NAME</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">ADMISSION NO</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">CLASS</th>
            <th className="p-2 text-left text-xs font-semibold text-gray-700">TERM</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 font-bold text-gray-900">{student.full_name}</td>
            <td className="p-2 font-bold text-gray-900">{student.admission_number}</td>
            <td className="p-2 font-bold text-gray-900">{student.class_name}</td>
            <td className="p-2 font-bold text-gray-900">{period.name}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td className="p-2 text-xs font-semibold text-gray-700">ACADEMIC YEAR: {period.year || '2025/2026'}</td>
            <td className="p-2 text-xs font-semibold text-gray-700">DATE OF BIRTH: N/A</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

      {/* Academic Performance Table */}
      <h2 className="text-lg font-bold text-gray-900 mb-2">ACADEMIC PERFORMANCE</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-r">SUBJECT</th>
              <th className="p-2 border-r">COEF</th>
              <th className="p-2 border-r">SEQ 1 MARKS</th>
              <th className="p-2 border-r">SEQ 1 GRADE</th>
              <th className="p-2 border-r">SEQ 2 MARKS</th>
              <th className="p-2 border-r">SEQ 2 GRADE</th>
              <th className="p-2 border-r">TERM AVERAGE</th>
              <th className="p-2 border-r">TERM GRADE</th>
            </tr>
          </thead>
          <tbody>
            {previewSubjects.map((subject, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 font-medium text-gray-900">{subject.name}</td>
                <td className="p-2 text-center">{subject.coefficient}</td>
                <td className="p-2 text-center">{subject.seq1_marks}</td>
                <td className="p-2 text-center">{subject.seq1_grade}</td>
                <td className="p-2 text-center">{subject.seq2_marks}</td>
                <td className="p-2 text-center">{subject.seq2_grade}</td>
                <td className="p-2 text-center font-bold">{subject.term_average}</td>
                <td className="p-2 text-center font-bold">{subject.term_grade}</td>
              </tr>
            ))}
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
            <tr><td className="p-2">Sequence 1 Average</td><td className="p-2">{reportData.seq1_average ?? '-'}</td></tr>
            <tr><td className="p-2">Sequence 2 Average</td><td className="p-2">{reportData.seq2_average ?? '-'}</td></tr>
            <tr><td className="p-2">Term Average</td><td className="p-2">{reportData.term_average ?? '-'}</td></tr>
            <tr><td className="p-2">Final Grade</td><td className="p-2">{reportData.final_grade ?? '-'}</td></tr>
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
            <tr><td className="p-2">Class Rank</td><td className="p-2">{(reportData.rank !== undefined && reportData.class_size !== undefined) ? `#${reportData.rank} / ${reportData.class_size}` : '-'}</td></tr>
            <tr><td className="p-2">Total Subjects</td><td className="p-2">{totalSubjects}</td></tr>
            <tr><td className="p-2">Subjects Passed</td><td className="p-2">{subjectsPassed}</td></tr>
            <tr><td className="p-2">Subjects Failed</td><td className="p-2">{subjectsFailed}</td></tr>
            <tr><td className="p-2">Term Status</td><td className="p-2 font-bold text-green-600">{termStatus}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Attendance & Conduct */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="font-semibold text-xs text-gray-700 mb-2">ATTENDANCE:</div>
          <div className="text-lg font-bold text-green-600">{reportData.attendance_percentage ? `${reportData.attendance_percentage}%` : '-'}</div>
        </div>
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="font-semibold text-xs text-gray-700 mb-2">CONDUCT:</div>
          <div className="text-lg font-bold text-gray-600">{reportData.conduct ?? 'Very Good'}</div>
        </div>
      </div>

      {/* Pass/Fail Criteria */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 text-xs text-gray-600">
        Pass/Fail Criteria: Students must achieve an average of 10/20 or higher to pass the term. Current average: {reportData.term_average ?? '-'} ({reportData.term_status ?? '-'})
      </div>

      {/* Signatures & Verification */}
      <table className="w-full border border-gray-300 mb-6 text-xs">
        <tbody>
          <tr className="bg-gray-100">
            <td className="p-2 font-semibold">REPORT ID:</td>
            <td className="p-2">{reportData.report_id ?? '-'}</td>
            <td className="p-2 font-semibold">DATE GENERATED:</td>
            <td className="p-2">{reportData.generated_at ?? '-'}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">STUDENT:</td>
            <td className="p-2">{student.full_name}</td>
            <td className="p-2 font-semibold">CLASS:</td>
            <td className="p-2">{student.class_name}</td>
          </tr>
          <tr className="bg-gray-100">
            <td className="p-2 font-semibold">ACADEMIC YEAR:</td>
            <td className="p-2">{period.year || '2025/2026'}</td>
            <td className="p-2 font-semibold">TERM:</td>
            <td className="p-2">{period.name}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-gray-200">
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Class Master<br />Name & Signature<br />Date: ____________</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Principal<br />Name & Signature<br />Date: ____________</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Parent/Guardian<br />Name & Signature<br />Date Received by Parent: ____________</p>
          </div>
        </div>
      </div>
    </div>
  );
}