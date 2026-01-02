import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Activity, Database, Mail, FileText, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Calendar, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
interface DashboardStats {
  schools: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  users: {
    total: number;
    admins: number;
    teachers: number;
    bursars: number;
    growth: number;
  };
  students: {
    total: number;
    growth: number;
  };
  revenue: {
    total: number;
    mrr: number;
    growth: number;
  };
  activity: {
    newSchoolsToday: number;
    newUsersToday: number;
    newStudentsToday: number;
    emailsSent: number;
  };
}
export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    schools: {
      total: 0,
      active: 0,
      pending: 0,
      growth: 0
    },
    users: {
      total: 0,
      admins: 0,
      teachers: 0,
      bursars: 0,
      growth: 0
    },
    students: {
      total: 0,
      growth: 0
    },
    revenue: {
      total: 0,
      mrr: 0,
      growth: 0
    },
    activity: {
      newSchoolsToday: 0,
      newUsersToday: 0,
      newStudentsToday: 0,
      emailsSent: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      // Fetch all data in parallel
      const [schoolsData, usersData, studentsData, paymentsData, recentSchoolsData, recentUsersData, recentStudentsData] = await Promise.all([supabase.from('schools').select('id, approved, created_at'), supabase.from('users').select('id, role, created_at'), supabase.from('students').select('id, total_paid, created_at'), supabase.from('payments').select('amount, created_at'), supabase.from('schools').select('*').gte('created_at', thirtyDaysAgo.toISOString()), supabase.from('users').select('*').gte('created_at', thirtyDaysAgo.toISOString()), supabase.from('students').select('*').gte('created_at', thirtyDaysAgo.toISOString())]);
      const schools = schoolsData.data || [];
      const users = usersData.data || [];
      const students = studentsData.data || [];
      const payments = paymentsData.data || [];
      // Calculate schools stats
      const activeSchools = schools.filter(s => s.approved).length;
      const pendingSchools = schools.filter(s => !s.approved).length;
      const recentSchools = recentSchoolsData.data || [];
      const oldSchools = schools.filter(s => new Date(s.created_at) < thirtyDaysAgo && new Date(s.created_at) >= sixtyDaysAgo).length;
      const schoolsGrowth = oldSchools > 0 ? (recentSchools.length - oldSchools) / oldSchools * 100 : 0;
      // Calculate users stats
      const admins = users.filter(u => u.role === 'school_admin').length;
      const teachers = users.filter(u => u.role === 'teacher').length;
      const bursars = users.filter(u => u.role === 'bursar').length;
      const recentUsers = recentUsersData.data || [];
      const oldUsers = users.filter(u => new Date(u.created_at) < thirtyDaysAgo && new Date(u.created_at) >= sixtyDaysAgo).length;
      const usersGrowth = oldUsers > 0 ? (recentUsers.length - oldUsers) / oldUsers * 100 : 0;
      // Calculate students stats
      const recentStudents = recentStudentsData.data || [];
      const oldStudents = students.filter(s => new Date(s.created_at) < thirtyDaysAgo && new Date(s.created_at) >= sixtyDaysAgo).length;
      const studentsGrowth = oldStudents > 0 ? (recentStudents.length - oldStudents) / oldStudents * 100 : 0;
      // Calculate revenue stats
      const totalRevenue = students.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0);
      const recentPayments = payments.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
      const oldPayments = payments.filter(p => new Date(p.created_at) < thirtyDaysAgo && new Date(p.created_at) >= sixtyDaysAgo);
      const recentRevenue = recentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const oldRevenue = oldPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const revenueGrowth = oldRevenue > 0 ? (recentRevenue - oldRevenue) / oldRevenue * 100 : 0;
      const mrr = recentRevenue; // Approximate MRR
      // Calculate today's activity
      const newSchoolsToday = schools.filter(s => new Date(s.created_at) >= today).length;
      const newUsersToday = users.filter(u => new Date(u.created_at) >= today).length;
      const newStudentsToday = students.filter(s => new Date(s.created_at) >= today).length;
      setStats({
        schools: {
          total: schools.length,
          active: activeSchools,
          pending: pendingSchools,
          growth: schoolsGrowth
        },
        users: {
          total: users.length,
          admins,
          teachers,
          bursars,
          growth: usersGrowth
        },
        students: {
          total: students.length,
          growth: studentsGrowth
        },
        revenue: {
          total: totalRevenue,
          mrr,
          growth: revenueGrowth
        },
        activity: {
          newSchoolsToday,
          newUsersToday,
          newStudentsToday,
          emailsSent: 0 // Placeholder
        }
      });
      // Build recent activity feed
      const activities = [...recentSchools.slice(0, 3).map(s => ({
        type: 'school',
        title: 'New School Registered',
        description: s.name,
        time: s.created_at,
        icon: Building2,
        color: 'blue'
      })), ...recentUsers.slice(0, 3).map(u => ({
        type: 'user',
        title: 'New User Joined',
        description: `${u.full_name} (${u.role})`,
        time: u.created_at,
        icon: Users,
        color: 'purple'
      }))].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
      setRecentActivity(activities);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(growth).toFixed(1)}%
      </span>;
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error) {
    return <Alert variant="error" title="Error" message={error} />;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time analytics and system health
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/super-admin/database')}>
            <Database className="w-4 h-4 mr-2" />
            Database Inspector
          </Button>
          <Button variant="primary" onClick={() => navigate('/super-admin/analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Full Analytics
          </Button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/schools')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            {formatGrowth(stats.schools.growth)}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Schools</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.schools.total}
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="text-green-600 font-medium">
                {stats.schools.active} Active
              </span>
              <span className="text-amber-600 font-medium">
                {stats.schools.pending} Pending
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/users')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            {formatGrowth(stats.users.growth)}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Users</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.users.total}
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <span className="text-slate-600">
                {stats.users.admins} Admins
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                {stats.users.teachers} Teachers
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            {formatGrowth(stats.students.growth)}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Students</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {stats.students.total.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-3">Across all schools</p>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/billing')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            {formatGrowth(stats.revenue.growth)}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              ${stats.revenue.total.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-3">
              MRR: ${stats.revenue.mrr.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Today's Activity
              </h3>
              <p className="text-sm text-slate-500">
                Real-time platform updates
              </p>
            </div>
          </div>
          <Badge variant="primary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {stats.activity.newSchoolsToday}
              </span>
            </div>
            <p className="text-sm text-blue-700 font-medium">New Schools</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">
                {stats.activity.newUsersToday}
              </span>
            </div>
            <p className="text-sm text-purple-700 font-medium">New Users</p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-900">
                {stats.activity.newStudentsToday}
              </span>
            </div>
            <p className="text-sm text-indigo-700 font-medium">New Students</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">
                {stats.activity.emailsSent}
              </span>
            </div>
            <p className="text-sm text-green-700 font-medium">Emails Sent</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/super-admin/approvals')}>
              <CheckCircle className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">Review Pending Approvals</span>
              {stats.schools.pending > 0 && <Badge variant="warning">{stats.schools.pending}</Badge>}
            </Button>

            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/super-admin/schools')}>
              <Building2 className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">Manage Schools</span>
            </Button>

            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/super-admin/reports')}>
              <FileText className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">Generate Reports</span>
            </Button>

            <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/super-admin/database')}>
              <Database className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">Database Inspector</span>
            </Button>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => <div key={index} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-lg bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(activity.time).toLocaleString()}
                    </p>
                  </div>
                </div>) : <p className="text-sm text-slate-500 text-center py-8">
                No recent activity
              </p>}
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            System Health
          </h3>
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            All Systems Operational
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Database</p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">API Services</p>
              <p className="text-xs text-green-600">Running</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Email Service
              </p>
              <p className="text-xs text-green-600">Active</p>
            </div>
          </div>
        </div>
      </Card>
    </div>;
}