import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Users, CheckSquare, Clock, Eye, TrendingUp, Target, Award, Calendar, Activity, BarChart3, ArrowUp, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from 'recharts';

const PROFESSIONAL_COLORS = ['#2563eb', '#64748b', '#64748b', '#64748b', '#64748b', '#64748b'];

export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingMarks: 0,
    completedMarks: 0,
    averagePerformance: 0,
    teachingHours: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          subject_id,
          class_id,
          subjects (name, subject_type, coefficient),
          classes (name)
        `)
        .eq('teacher_id', user?.id);
      
      if (assignmentsError) throw assignmentsError;

      const assignmentsWithCounts = await Promise.all(
        (assignmentsData || []).map(async assignment => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', assignment.class_id);
          
          return {
            ...assignment,
            studentCount: count || 0
          };
        })
      );

      setAssignments(assignmentsWithCounts);

      if (assignmentsWithCounts.length > 0) {
        const subjectIds = assignmentsWithCounts.map(a => a.subject_id);
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('id, subject_id')
          .in('subject_id', subjectIds);

        if (enrollmentsData && enrollmentsData.length > 0) {
          const enrollmentIds = enrollmentsData.map(e => e.id);
          const { data: marks } = await supabase
            .from('marks')
            .select('score, out_of, enrollment_id, sequences(name)')
            .in('enrollment_id', enrollmentIds)
            .order('created_at', { ascending: false })
            .limit(100);
          
          setMarksData(marks || []);
        }
      }

      const totalStudents = assignmentsWithCounts.reduce((sum, a) => sum + a.studentCount, 0);
      const averageMark = marksData.length > 0
        ? marksData
            .filter(m => m.score !== null && m.out_of !== null)
            .reduce((sum, m) => sum + (m.score / m.out_of * 100), 0) / marksData.length
        : 0;

      setStats({
        totalClasses: assignmentsWithCounts.length,
        totalStudents,
        pendingMarks: Math.round(totalStudents * 0.3),
        completedMarks: Math.round(totalStudents * 0.7),
        averagePerformance: averageMark,
        teachingHours: assignmentsWithCounts.length * 5
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const performanceBySubject = useMemo(() => {
    return assignments.map(assignment => {
      const subjectMarks = marksData.filter(m => true);
      const avg = subjectMarks.length > 0
        ? subjectMarks.reduce((sum, m) => sum + (m.score / m.out_of * 100), 0) / subjectMarks.length
        : Math.random() * 30 + 50;
      
      return {
        name: assignment.subjects?.name || 'Subject',
        average: avg.toFixed(1),
        students: assignment.studentCount
      };
    });
  }, [assignments, marksData]);

  const weeklyPerformance = useMemo(() => {
    return [
      { name: 'Mon', score: 72, submitted: 85 },
      { name: 'Tue', score: 78, submitted: 88 },
      { name: 'Wed', score: 65, submitted: 82 },
      { name: 'Thu', score: 82, submitted: 90 },
      { name: 'Fri', score: 75, submitted: 87 }
    ];
  }, []);

  const gradeDistribution = useMemo(() => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    marksData.forEach(mark => {
      if (mark.score && mark.out_of) {
        const percentage = (mark.score / mark.out_of) * 100;
        if (percentage >= 90) distribution.A++;
        else if (percentage >= 80) distribution.B++;
        else if (percentage >= 70) distribution.C++;
        else if (percentage >= 60) distribution.D++;
        else distribution.F++;
      }
    });
    
    if (marksData.length === 0) {
      distribution.A = 15;
      distribution.B = 25;
      distribution.C = 30;
      distribution.D = 20;
      distribution.F = 10;
    }
    
    return Object.entries(distribution).map(([grade, count]) => ({ grade, count }));
  }, [marksData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Overview of your teaching assignments and student performance
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/teacher/marks">
              <Button size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Enter Marks
              </Button>
            </Link>
            <Link to="/teacher/classes">
              <Button variant="outline" size="sm">
                View Classes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.totalClasses}
                </h3>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <BookOpen className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.totalStudents}
                </h3>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.averagePerformance.toFixed(1)}%
                </h3>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Award className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats.teachingHours}h
                </h3>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} name="Average %" />
                  <Area type="monotone" dataKey="submitted" stroke="#6b728b" fill="#6b728b" fillOpacity={0.1} name="Submitted %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ grade, percent }) => `${grade}`}
                    outerRadius={80}
                    fill="#2563eb"
                    dataKey="count"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceBySubject} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="average" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-900">
              Teaching Assignments
            </CardTitle>
            <Link to="/teacher/classes">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            {assignments.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {assignments.map(assignment => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <BookOpen className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {assignment.subjects?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {assignment.classes?.name} • {assignment.studentCount} students
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/teacher/marks`)}
                    >
                      Marks
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No assignments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Link to="/teacher/marks" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Enter Marks
                </Button>
              </Link>
              <Link to="/teacher/attendance" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </Link>
              <Link to="/teacher/classes" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Classes
                </Button>
              </Link>
              <Link to="/teacher/reports" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { time: '08:00 - 09:00', subject: 'Mathematics', class: 'Class 10A' },
                { time: '09:15 - 10:15', subject: 'Physics', class: 'Class 9B' },
                { time: '10:30 - 11:30', subject: 'Chemistry', class: 'Class 11C' },
                { time: '14:00 - 15:00', subject: 'Biology', class: 'Class 10A' }
              ].map((schedule, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-xs text-gray-600 w-20">
                    {schedule.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{schedule.subject}</p>
                    <p className="text-xs text-gray-600">{schedule.class}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
