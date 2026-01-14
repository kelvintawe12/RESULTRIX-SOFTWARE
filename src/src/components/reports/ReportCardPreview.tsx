import React from 'react';
import { Badge } from '../ui/Badge';
import { Award, Calendar, User, GraduationCap } from 'lucide-react';
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
  };
  subjects?: Array<{
    name: string;
    score: number;
    out_of: number;
    percentage: number;
    coefficient: number;
    comments?: string;
  }>;
  period: {
    scope: string;
    name: string;
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
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };
  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };
  return <div className="bg-white p-8 shadow-2xl rounded-lg max-w-4xl mx-auto" id="report-card-preview">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {template.showLogo && school.logo_path && <img src={school.logo_path} alt="School Logo" className="h-16 mb-4" />}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {school.name}
            </h1>
            {school.address && <p className="text-gray-600 text-sm">{school.address}</p>}
            {template.header && <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">
                {template.header}
              </p>}
          </div>
          <div className="text-right">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Report Card
              </p>
              <p className="text-lg font-bold text-blue-600">{period.scope}</p>
              <p className="text-sm text-gray-700">{period.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Student Details
            </p>
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">
            {student.full_name}
          </p>
          <p className="text-sm text-gray-600">
            Admission No: {student.admission_number}
          </p>
          <p className="text-sm text-gray-600">Class: {student.class_name}</p>
        </div>

        {(template.showRank || template.showAttendance) && <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Performance
              </p>
            </div>
            {template.showRank && reportData.rank && <div className="mb-2">
                <p className="text-sm text-gray-600">Class Rank</p>
                <p className="text-lg font-bold text-amber-600">
                  {reportData.rank} / {reportData.class_size || 'N/A'}
                </p>
              </div>}
            {template.showAttendance && reportData.attendance_percentage !== undefined && <div>
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="text-lg font-bold text-green-600">
                    {reportData.attendance_percentage.toFixed(1)}%
                  </p>
                </div>}
          </div>}
      </div>

      {/* Subjects Table */}
      {subjects.length > 0 && <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Performance
          </h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Coeff
                  </th>
                  {template.showComments && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Comments
                    </th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjects.map((subject, index) => <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {subject.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {subject.score} / {subject.out_of}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`font-semibold ${getGradeColor(subject.percentage)}`}>
                        {subject.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={subject.percentage >= 60 ? 'success' : 'warning'}>
                        {getGradeLetter(subject.percentage)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {subject.coefficient}
                    </td>
                    {template.showComments && <td className="px-4 py-3 text-xs text-gray-600">
                        {subject.comments || '-'}
                      </td>}
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}

      {/* Overall Performance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Overall Performance
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Overall Average</p>
            <p className={`text-3xl font-bold ${getGradeColor(reportData.final_average || 0)}`}>
              {reportData.final_average?.toFixed(1) || 'N/A'}%
            </p>
          </div>
          {reportData.letter_grade && <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Letter Grade</p>
              <p className="text-3xl font-bold text-blue-600">
                {reportData.letter_grade}
              </p>
            </div>}
          {template.showRank && reportData.rank && <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Class Position</p>
              <p className="text-3xl font-bold text-amber-600">
                #{reportData.rank}
              </p>
            </div>}
        </div>
      </div>

      {/* Footer */}
      {template.footer && <div className="border-t-2 border-gray-200 pt-6 mt-6">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {template.footer}
          </p>
        </div>}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-gray-200">
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Class Teacher</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Principal</p>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-xs text-gray-600 text-center">Parent/Guardian</p>
          </div>
        </div>
      </div>

      {/* Generation Date */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3" />
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>;
}