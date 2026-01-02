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
      // Fetch marks distribution
      const {
        data: marksData
      } = await supabase.from('marks').select('mark, students(full_name)').eq('subject_id', assignmentDetails.data.subject_id).eq('class_id', assignmentDetails.data.class_id);
      // Fetch attendance data
      const {
        data: attendanceData
      } = await supabase.from('attendance').select('status, date').eq('subject_id', assignmentDetails.data.subject_id).eq('class_id', assignmentDetails.data.class_id);
      // Process data
      const marksDistribution = [{
        range: '0-40',
        count: 0
      }, {
        range: '41-50',
        count: 0
      }, {
        range: '51-60',
        count: 0
      }, {
        range: '61-70',
        count: 0
      }, {
        range: '71-80',
        count: 0
      }, {
        range: '81-90',
        count: 0
      }, {
        range: '91-100',
        count: 0
      }];
      marksData?.forEach(m => {
        if (m.mark <= 40) marksDistribution[0].count++;else if (m.mark <= 50) marksDistribution[1].count++;else if (m.mark <= 60) marksDistribution[2].count++;else if (m.mark <= 70) marksDistribution[3].count++;else if (m.mark <= 80) marksDistribution[4].count++;else if (m.mark <= 90) marksDistribution[5].count++;else marksDistribution[6].count++;
      });
      const avgMark = marksData && marksData.length > 0 ? marksData.reduce((sum, m) => sum + (m.mark || 0), 0) / marksData.length : 0;
      const topPerformers = marksData?.sort((a, b) => (b.mark || 0) - (a.mark || 0)).slice(0, 5).map(m => ({
        name: m.students?.full_name || 'Unknown',
        mark: m.mark
      })) || [];
      const attendanceStats = attendanceData ? {
        present: attendanceData.filter(a => a.status === 'present').length,
        absent: attendanceData.filter(a => a.status === 'absent').length
      } : {
        present: 0,
        absent: 0
      };
      setReportData({
        marksDistribution,
        avgMark,
        topPerformers,
        attendanceStats,
        totalMarks: marksData?.length || 0,
        totalAttendance: attendanceData?.length || 0
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