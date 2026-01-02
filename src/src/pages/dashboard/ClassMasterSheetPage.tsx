import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { Download, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
interface Class {
  id: string;
  name: string;
}
interface Sequence {
  id: string;
  name: string;
}
interface StudentMark {
  student_id: string;
  student_name: string;
  admission_number: string;
  subject_marks: {
    [subject_name: string]: {
      score: number;
      out_of: number;
      percentage: number;
      coefficient: number;
    };
  };
  total_score: number;
  total_possible: number;
  average: number;
  rank: number;
}
export function ClassMasterSheetPage() {
  const {
    user
  } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');
  const [masterSheet, setMasterSheet] = useState<StudentMark[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    classAverage: 0,
    highestAverage: 0,
    lowestAverage: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    if (selectedClass && selectedSequence) {
      fetchMasterSheet();
    }
  }, [selectedClass, selectedSequence]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const [classesData, sequencesData] = await Promise.all([supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'), supabase.from('sequences').select(`
          id,
          name,
          terms!inner(
            academic_year_id,
            academic_years!inner(school_id)
          )
        `).eq('terms.academic_years.school_id', user.school_id).order('name')]);
      if (classesData.error) throw classesData.error;
      if (sequencesData.error) throw sequencesData.error;
      setClasses(classesData.data || []);
      setSequences(sequencesData.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const fetchMasterSheet = async () => {
    if (!selectedClass || !selectedSequence) return;
    try {
      setLoading(true);
      setError('');
      // Get all students in the class
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('id, full_name, admission_number').eq('class_id', selectedClass).order('full_name');
      if (studentsError) throw studentsError;
      // Get all subjects for this class
      const {
        data: subjectMappings,
        error: subjectError
      } = await supabase.from('subject_class_mappings').select(`
          subjects(id, name, coefficient)
        `).eq('class_id', selectedClass);
      if (subjectError) throw subjectError;
      const subjectsList = subjectMappings?.map((m: any) => m.subjects) || [];
      const subjectNames = subjectsList.map((s: any) => s.name);
      setSubjects(subjectNames);
      // For each student, get their marks
      const masterSheetData = await Promise.all((studentsData || []).map(async student => {
        const subjectMarks: any = {};
        let totalWeighted = 0;
        let totalPossibleWeighted = 0;
        for (const subject of subjectsList) {
          // Get enrollment
          const {
            data: enrollment
          } = await supabase.from('enrollments').select('id').eq('student_id', student.id).eq('subject_id', subject.id).maybeSingle();
          if (enrollment) {
            // Get mark
            const {
              data: mark
            } = await supabase.from('marks').select('score, out_of').eq('enrollment_id', enrollment.id).eq('sequence_id', selectedSequence).maybeSingle();
            if (mark) {
              const percentage = mark.score / mark.out_of * 100;
              subjectMarks[subject.name] = {
                score: mark.score,
                out_of: mark.out_of,
                percentage,
                coefficient: subject.coefficient
              };
              totalWeighted += mark.score * subject.coefficient;
              totalPossibleWeighted += mark.out_of * subject.coefficient;
            }
          }
        }
        const average = totalPossibleWeighted > 0 ? totalWeighted / totalPossibleWeighted * 100 : 0;
        return {
          student_id: student.id,
          student_name: student.full_name,
          admission_number: student.admission_number,
          subject_marks: subjectMarks,
          total_score: totalWeighted,
          total_possible: totalPossibleWeighted,
          average,
          rank: 0 // Will be calculated after sorting
        };
      }));
      // Sort by average and assign ranks
      const sorted = masterSheetData.sort((a, b) => b.average - a.average);
      sorted.forEach((student, index) => {
        student.rank = index + 1;
      });
      setMasterSheet(sorted);
      // Calculate stats
      const averages = sorted.map(s => s.average).filter(a => a > 0);
      setStats({
        totalStudents: sorted.length,
        classAverage: averages.length > 0 ? Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length * 10) / 10 : 0,
        highestAverage: averages.length > 0 ? Math.round(Math.max(...averages) * 10) / 10 : 0,
        lowestAverage: averages.length > 0 ? Math.round(Math.min(...averages) * 10) / 10 : 0
      });
    } catch (err: any) {
      console.error('Error fetching master sheet:', err);
      setError(err.message || 'Failed to load master sheet');
    } finally {
      setLoading(false);
    }
  };
  const handleExport = () => {
    const exportData = masterSheet.map(student => {
      const row: any = {
        Rank: student.rank,
        'Admission No': student.admission_number,
        'Student Name': student.student_name
      };
      subjects.forEach(subject => {
        const mark = student.subject_marks[subject];
        if (mark) {
          row[`${subject} (Score)`] = mark.score;
          row[`${subject} (Out Of)`] = mark.out_of;
          row[`${subject} (%)`] = mark.percentage.toFixed(1);
        } else {
          row[`${subject} (Score)`] = '-';
          row[`${subject} (Out Of)`] = '-';
          row[`${subject} (%)`] = '-';
        }
      });
      row['Average (%)'] = student.average.toFixed(1);
      return row;
    });
    const className = classes.find(c => c.id === selectedClass)?.name || 'class';
    const sequenceName = sequences.find(s => s.id === selectedSequence)?.name || 'sequence';
    downloadCSV(exportData, `master_sheet_${className}_${sequenceName}_${new Date().toISOString().split('T')[0]}.csv`);
  };
  if (loading && classes.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Class Master Sheet
          </h1>
          <p className="text-gray-500">View comprehensive class performance</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={masterSheet.length === 0} leftIcon={<Download className="h-4 w-4" />}>
          Export CSV
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}

      <Card>
        <CardHeader>
          <CardTitle>Select Class & Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedSequence} onValueChange={setSelectedSequence}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sequence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map(sequence => <SelectItem key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClass && selectedSequence && masterSheet.length > 0 && <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-600">
                  Total Students
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalStudents}
                </h3>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-600">
                  Class Average
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.classAverage}%
                </h3>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-600">
                  Highest Average
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-green-600">
                    {stats.highestAverage}%
                  </h3>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-600">
                  Lowest Average
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-red-600">
                    {stats.lowestAverage}%
                  </h3>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Master Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div> : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-700 sticky left-0 bg-white">
                          Rank
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700 sticky left-12 bg-white">
                          Admission No.
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700 sticky left-32 bg-white">
                          Student Name
                        </th>
                        {subjects.map(subject => <th key={subject} className="text-center p-3 font-medium text-gray-700 min-w-[100px]">
                            {subject}
                          </th>)}
                        <th className="text-center p-3 font-medium text-gray-700 bg-blue-50">
                          Average
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterSheet.map(student => <tr key={student.student_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 sticky left-0 bg-white">
                            <div className="flex items-center gap-2">
                              {student.rank <= 3 && <Award className={`h-4 w-4 ${student.rank === 1 ? 'text-yellow-500' : student.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />}
                              <span className="font-bold">{student.rank}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs sticky left-12 bg-white">
                            {student.admission_number}
                          </td>
                          <td className="p-3 font-medium sticky left-32 bg-white">
                            {student.student_name}
                          </td>
                          {subjects.map(subject => {
                    const mark = student.subject_marks[subject];
                    return <td key={subject} className="p-3 text-center">
                                {mark ? <div>
                                    <div className="font-semibold">
                                      {mark.score}/{mark.out_of}
                                    </div>
                                    <div className={`text-xs ${mark.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                      {mark.percentage.toFixed(1)}%
                                    </div>
                                  </div> : <span className="text-gray-400">-</span>}
                              </td>;
                  })}
                          <td className="p-3 text-center bg-blue-50">
                            <div className="font-bold text-lg text-blue-600">
                              {student.average.toFixed(1)}%
                            </div>
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>}
            </CardContent>
          </Card>
        </>}

      {selectedClass && selectedSequence && masterSheet.length === 0 && !loading && <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No marks data available</p>
                <p className="text-gray-400 text-sm mt-2">
                  Marks will appear here once they are submitted for this class
                  and sequence.
                </p>
              </div>
            </CardContent>
          </Card>}
    </div>;
}