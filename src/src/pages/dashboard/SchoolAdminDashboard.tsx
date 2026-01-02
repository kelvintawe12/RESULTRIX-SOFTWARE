import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, GraduationCap, CreditCard, AlertCircle, Download, TrendingUp, TrendingDown, BookOpen, DollarSign, UserCheck, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { exportStudents, exportTeachers, exportBursars, exportPayments } from '../../utils/csvExport';
export function SchoolAdminDashboard() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // School currency
  const [currencyCode, setCurrencyCode] = useState('USD');
  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalBursars: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalRevenue: 0,
    pendingFees: 0,
    collectionRate: 0
  });
  // Data for exports and displays
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [bursars, setBursars] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [classDistribution, setClassDistribution] = useState<any[]>([]);
  const [feesTrend, setFeesTrend] = useState<any[]>([]);
  useEffect(() => {
    if (user?.school_id) {
      fetchDashboardData();
    }
  }, [user?.school_id]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const schoolId = user?.school_id;
      // Fetch all data in parallel
      const [schoolResult, studentsResult, teachersResult, bursarsResult, classesResult, subjectsResult, paymentsResult] = await Promise.all([
      // School info (for currency)
      supabase.from('schools').select('currency_code').eq('id', schoolId).single(),
      // Students
      supabase.from('students').select('*').eq('school_id', schoolId),
      // Teachers
      supabase.from('users').select('*').eq('school_id', schoolId).eq('role', 'teacher'),
      // Bursars
      supabase.from('users').select('*').eq('school_id', schoolId).eq('role', 'bursar'),
      // Classes
      supabase.from('classes').select('*').eq('school_id', schoolId),
      // Subjects
      supabase.from('subjects').select('*').eq('school_id', schoolId),
      // All Payments (not just recent 10)
      supabase.from('payments').select(`
            *,
            students!inner(full_name, school_id)
          `).eq('students.school_id', schoolId).order('created_at', {
        ascending: false
      })]);
      if (schoolResult.error) throw schoolResult.error;
      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;
      if (bursarsResult.error) throw bursarsResult.error;
      if (classesResult.error) throw classesResult.error;
      if (subjectsResult.error) throw subjectsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      // Set currency code
      setCurrencyCode(schoolResult.data?.currency_code || 'USD');
      const studentsData = studentsResult.data || [];
      const teachersData = teachersResult.data || [];
      const bursarsData = bursarsResult.data || [];
      const classesData = classesResult.data || [];
      const subjectsData = subjectsResult.data || [];
      const paymentsData = paymentsResult.data || [];
      // Calculate financial stats
      const totalRevenue = studentsData.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0);
      const pendingFees = studentsData.reduce((sum, s) => sum + (Number(s.remaining) || 0), 0);
      const totalExpected = studentsData.reduce((sum, s) => sum + (Number(s.total_fee) || 0), 0);
      const collectionRate = totalExpected > 0 ? totalRevenue / totalExpected * 100 : 0;
      // Class distribution for pie chart
      const classGroups = classesData.map(cls => {
        const studentCount = studentsData.filter(s => s.class_id === cls.id).length;
        return {
          name: cls.name,
          value: studentCount
        };
      }).filter(g => g.value > 0);
      // REAL Fee Collection Trend (last 6 months based on actual payment data)
      const now = new Date();
      const monthlyData = Array.from({
        length: 6
      }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        // Calculate collected amount for this month from actual payments
        const monthPayments = paymentsData.filter(p => {
          const paymentDate = new Date(p.date || p.created_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });
        const collected = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        // Expected is total fees divided by 12 months (simplified)
        const expected = totalExpected / 12;
        return {
          month: monthDate.toLocaleDateString('en-US', {
            month: 'short'
          }),
          collected: Math.round(collected),
          expected: Math.round(expected)
        };
      });
      // Recent activities
      const activities = paymentsData.slice(0, 5).map(p => ({
        id: p.id,
        type: 'payment',
        description: `Payment received from ${p.students?.full_name}`,
        amount: p.amount,
        date: new Date(p.created_at).toLocaleDateString()
      }));
      setStats({
        totalStudents: studentsData.length,
        totalTeachers: teachersData.length,
        totalBursars: bursarsData.length,
        totalClasses: classesData.length,
        totalSubjects: subjectsData.length,
        totalRevenue,
        pendingFees,
        collectionRate
      });
      setStudents(studentsData);
      setTeachers(teachersData);
      setBursars(bursarsData);
      setPayments(paymentsData.map(p => ({
        ...p,
        student_name: p.students?.full_name
      })));
      setRecentActivities(activities);
      setClassDistribution(classGroups);
      setFeesTrend(monthlyData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error) {
    return <div className="p-6">
        <Alert variant="error" title="Error" message={error} />
      </div>;
  }
  return <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard/reports')} leftIcon={<Calendar className="h-4 w-4" />}>
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalStudents}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Active
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalTeachers}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <UserCheck className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">
                    Staff
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Revenue Collected
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalRevenue)}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {stats.collectionRate.toFixed(1)}% collected
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Fees
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.pendingFees)}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">
                    Outstanding
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <DollarSign className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/students')}>
              <GraduationCap className="h-6 w-6" />
              <span>Manage Students</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/teachers')}>
              <Users className="h-6 w-6" />
              <span>Manage Teachers</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/academics')}>
              <BookOpen className="h-6 w-6" />
              <span>Academics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/dashboard/fees')}>
              <CreditCard className="h-6 w-6" />
              <span>Fee Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{
                  fill: '#6B7280'
                }} />
                  <YAxis tick={{
                  fill: '#6B7280'
                }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2} name="Collected" />
                  <Line type="monotone" dataKey="expected" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name="Expected" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Student Distribution by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {classDistribution.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={classDistribution} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {classDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-gray-500">
                  No class data available
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between" onClick={() => exportStudents(students)} disabled={students.length === 0}>
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Export Students ({students.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => exportTeachers(teachers)} disabled={teachers.length === 0}>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Teachers ({teachers.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => exportBursars(bursars)} disabled={bursars.length === 0}>
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Export Bursars ({bursars.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => exportPayments(payments)} disabled={payments.length === 0}>
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Export Payments ({payments.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/payments')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map(activity => <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                    <Badge variant="success">
                      {formatCurrency(activity.amount)}
                    </Badge>
                  </div>) : <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/academics')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Classes
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalClasses}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/subjects')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Subjects
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalSubjects}
                </h3>
              </div>
              <div className="p-3 bg-pink-50 rounded-xl">
                <BookOpen className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/teachers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalTeachers}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/bursars')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bursars</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalBursars}
                </h3>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl">
                <UserCheck className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}