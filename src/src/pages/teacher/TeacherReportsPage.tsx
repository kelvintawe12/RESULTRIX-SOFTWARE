import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Award, Download, FileText } from 'lucide-react';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
export function TeacherReportsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
  }, [user?.id]);
  useEffect(() => {
    if (selectedAssignment) {
      fetchReportData();
    }
  }, [selectedAssignment]);
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('teacher_assignments').select(`
          id,
          subjects (name),
          classes (name)
        `).eq('teacher_id', user?.id);
      if (error) throw error;
      setAssignments(data || []);
      if (data && data.length > 0) {
        setSelectedAssignment(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;
      const assignmentDetails = await supabase.from('teacher_assignments').select('subject_id, class_id').eq('id', selectedAssignment).single();
      if (!assignmentDetails.data) return;
      const { subject_id, class_id } = assignmentDetails.data;

      // Marks live on the `marks` table, linked to a student+subject through
      // `enrollments`. Filter enrollments to this subject and (via the student)
      // this class. Scores are score/out_of, not a single `mark` column.
      const {
        data: marksData,
        error: marksError
      } = await supabase
        .from('marks')
        .select('score, out_of, attendance_present, attendance_total, enrollments!inner(subject_id, students!inner(full_name, class_id))')
        .eq('enrollments.subject_id', subject_id)
        .eq('enrollments.students.class_id', class_id);
      if (marksError) throw marksError;

      const rows = (marksData || []).map((m: any) => {
        const enrollment = Array.isArray(m.enrollments) ? m.enrollments[0] : m.enrollments;
        const student = enrollment && (Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students);
        const percentage = m.out_of > 0 ? (m.score / m.out_of) * 100 : 0;
        return {
          name: student?.full_name || 'Unknown',
          percentage,
          attendance_present: m.attendance_present || 0,
          attendance_total: m.attendance_total || 0,
        };
      });

      // Distribution by percentage band.
      const marksDistribution = [
        { range: '0-40', count: 0 },
        { range: '41-50', count: 0 },
        { range: '51-60', count: 0 },
        { range: '61-70', count: 0 },
        { range: '71-80', count: 0 },
        { range: '81-90', count: 0 },
        { range: '91-100', count: 0 },
      ];
      rows.forEach(r => {
        const p = r.percentage;
        if (p <= 40) marksDistribution[0].count++;
        else if (p <= 50) marksDistribution[1].count++;
        else if (p <= 60) marksDistribution[2].count++;
        else if (p <= 70) marksDistribution[3].count++;
        else if (p <= 80) marksDistribution[4].count++;
        else if (p <= 90) marksDistribution[5].count++;
        else marksDistribution[6].count++;
      });

      const avgMark = rows.length > 0
        ? rows.reduce((sum, r) => sum + r.percentage, 0) / rows.length
        : 0;
      const topPerformers = [...rows]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5)
        .map(r => ({ name: r.name, mark: parseFloat(r.percentage.toFixed(1)) }));

      // Attendance is aggregated from the marks rows (present vs missed days).
      const present = rows.reduce((sum, r) => sum + r.attendance_present, 0);
      const total = rows.reduce((sum, r) => sum + r.attendance_total, 0);
      const attendanceStats = { present, absent: Math.max(0, total - present) };

      setReportData({
        marksDistribution,
        avgMark,
        topPerformers,
        attendanceStats,
        totalMarks: rows.length,
        totalAttendance: total,
      });
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  if (loading && !reportData) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Class Reports</h1>
          <p className="text-slate-500 mt-1">
            View performance analytics for your classes
          </p>
        </div>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Export Report
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

      {assignments.length === 0 ? <Card className="p-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Assignments Found
            </h3>
            <p className="text-slate-500">
              You don't have any teaching assignments yet.
            </p>
          </div>
        </Card> : <>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Class & Subject
                </label>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map(a => <SelectItem key={a.id} value={a.id}>
                        {a.subjects?.name} - {a.classes?.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {reportData && <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600">Average Mark</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {reportData.avgMark.toFixed(1)}%
                        </h3>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600">Total Marks</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {reportData.totalMarks}
                        </h3>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600">
                          Attendance Rate
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {reportData.totalAttendance > 0 ? (reportData.attendanceStats.present / reportData.totalAttendance * 100).toFixed(0) : 0}
                          %
                        </h3>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-600">Top Performer</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {reportData.topPerformers[0]?.mark || 0}%
                        </h3>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Marks Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.marksDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{
                      name: 'Present',
                      value: reportData.attendanceStats.present
                    }, {
                      name: 'Absent',
                      value: reportData.attendanceStats.absent
                    }]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.topPerformers.length > 0 ? <div className="space-y-3">
                      {reportData.topPerformers.map((student: any, index: number) => <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <span className="font-medium text-slate-900">
                                {student.name}
                              </span>
                            </div>
                            <Badge variant="success">{student.mark}%</Badge>
                          </div>)}
                    </div> : <p className="text-center py-8 text-slate-500">
                      No marks recorded yet
                    </p>}
                </CardContent>
              </Card>
            </>}
        </>}
    </div>;
}