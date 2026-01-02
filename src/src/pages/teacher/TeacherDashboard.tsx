import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Users, CheckSquare, Clock, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
export function TeacherDashboard() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingMarks: 0
  });
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch teacher assignments
      const {
        data: assignmentsData,
        error: assignmentsError
      } = await supabase.from('teacher_assignments').select(`
          id,
          subject_id,
          class_id,
          subjects (name, subject_type),
          classes (name)
        `).eq('teacher_id', user?.id);
      if (assignmentsError) throw assignmentsError;
      // Get student counts for each assignment
      const assignmentsWithCounts = await Promise.all((assignmentsData || []).map(async assignment => {
        const {
          count
        } = await supabase.from('students').select('*', {
          count: 'exact',
          head: true
        }).eq('class_id', assignment.class_id);
        return {
          ...assignment,
          studentCount: count || 0
        };
      }));
      setAssignments(assignmentsWithCounts);
      // Calculate stats
      const totalStudents = assignmentsWithCounts.reduce((sum, a) => sum + a.studentCount, 0);
      setStats({
        totalClasses: assignmentsWithCounts.length,
        totalStudents,
        pendingMarks: 0 // Could be calculated from marks table
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
        <p className="text-slate-500">
          Manage your classes and student performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="My Classes" value={stats.totalClasses.toString()} trend={{
        value: 'Active',
        direction: 'neutral'
      }} icon={BookOpen} color="blue" />
        <MetricCard title="Total Students" value={stats.totalStudents.toString()} trend={{
        value: 'Enrolled',
        direction: 'neutral'
      }} icon={Users} color="green" />
        <MetricCard title="Pending Marks" value={stats.pendingMarks.toString()} trend={{
        value: 'To submit',
        direction: 'neutral'
      }} icon={CheckSquare} color="amber" />
        <MetricCard title="This Week" value={`${stats.totalClasses * 5}h`} trend={{
        value: 'Teaching hours',
        direction: 'neutral'
      }} icon={Clock} color="purple" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            My Teaching Assignments
          </h3>
          <Link to="/teacher/classes">
            <Button variant="secondary" size="sm">
              View All Classes
            </Button>
          </Link>
        </div>

        {assignments.length > 0 ? <div className="space-y-3">
            {assignments.map(assignment => <div key={assignment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {assignment.subjects?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {assignment.classes?.name} • {assignment.studentCount}{' '}
                      students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={assignment.subjects?.subject_type === 'core' ? 'primary' : 'secondary'}>
                    {assignment.subjects?.subject_type}
                  </Badge>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/teacher/marks`)} leftIcon={<Eye className="w-4 h-4" />}>
                    Enter Marks
                  </Button>
                </div>
              </div>)}
          </div> : <div className="text-center py-12">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Assignments Yet
            </h3>
            <p className="text-slate-500">
              You don't have any teaching assignments. Contact your
              administrator.
            </p>
          </div>}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/teacher/marks" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <CheckSquare className="w-4 h-4 mr-2" />
                Enter Marks
              </Button>
            </Link>
            <Link to="/teacher/attendance" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            </Link>
            <Link to="/teacher/classes" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                View My Classes
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Today's Schedule
          </h3>
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Schedule feature coming soon</p>
          </div>
        </Card>
      </div>
    </div>;
}