import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, GraduationCap, CreditCard, AlertCircle, Download, TrendingUp, TrendingDown, BookOpen, DollarSign, UserCheck, Calendar, ArrowRight, Keyboard } from 'lucide-react';
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + K: Open keyboard shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        alert('Keyboard Shortcuts:\n\nS: Students\nT: Teachers\nF: Fees\nA: Academics\nR: Reports\nD: Dashboard\nEsc: Close dialogs');
      }

      // Single key shortcuts
      switch (e.key.toLowerCase()) {
        case 's':
          navigate('/dashboard/students');
          break;
        case 't':
          navigate('/dashboard/teachers');
          break;
        case 'f':
          navigate('/dashboard/fees');
          break;
        case 'a':
          navigate('/dashboard/academics');
          break;
        case 'r':
          navigate('/dashboard/reports');
          break;
        case 'd':
          navigate('/dashboard');
          break;
        case 'escape':
          // Close any open modals or dialogs
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
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
  return <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => {
            alert('Keyboard Shortcuts:\n\nS: Students\nT: Teachers\nF: Fees\nA: Academics\nR: Reports\nD: Dashboard\nCtrl/Cmd + K: Show this help');
          }} leftIcon={<Keyboard className="h-4 w-4" />} className="text-xs sm:text-sm">
            Shortcuts
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/reports')} leftIcon={<Calendar className="h-4 w-4" />} className="text-xs sm:text-sm">
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
                  {stats.totalStudents}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Active
                  </span>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 hidden sm:block">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Enrollment Rate</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-l-4 border-l-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Teachers</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-purple-600 transition-colors">
                  {stats.totalTeachers}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <UserCheck className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">
                    Staff
                  </span>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 hidden sm:block">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Teacher-Student Ratio</span>
                    <span>1:20</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-l-4 border-l-green-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenue Collected
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-green-600 transition-colors">
                  {formatCurrency(stats.totalRevenue)}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {stats.collectionRate.toFixed(1)}% collected
                  </span>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 hidden sm:block">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Collection Rate</span>
                    <span>{stats.collectionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-l-4 border-l-amber-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Fees
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-amber-600 transition-colors">
                  {formatCurrency(stats.pendingFees)}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">
                    Outstanding
                  </span>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 hidden sm:block">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Outstanding Rate</span>
                    <span>{(100 - stats.collectionRate).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, 100 - stats.collectionRate)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Button variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-2 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => navigate('/dashboard/students')}>
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Manage Students</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-2 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => navigate('/dashboard/teachers')}>
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Manage Teachers</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-2 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => navigate('/dashboard/academics')}>
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Academics</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 sm:py-4 flex-col gap-2 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => navigate('/dashboard/fees')}>
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Fee Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection Trend */}
        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white">Fee Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feesTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{
                  fill: '#6B7280',
                  fontSize: 12
                }} className="text-gray-600 dark:text-gray-400" />
                  <YAxis tick={{
                  fill: '#6B7280',
                  fontSize: 12
                }} className="text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="collected" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    name="Collected" 
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expected" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                    name="Expected" 
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white">Student Distribution by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {classDistribution.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <Pie 
                      data={classDistribution} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false} 
                      label={({
                  name,
                  percent
                }) => `${name} (${(percent * 100).toFixed(0)}%)`} 
                      outerRadius={80} 
                      fill="#8884d8" 
                      dataKey="value"
                      animationDuration={1000}
                    >
                      {classDistribution.map((entry, index) => <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="hover:opacity-80 transition-opacity"
                      />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer> : <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <GraduationCap className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium">No class data available</p>
                  <p className="text-xs text-gray-400 mt-1">Add classes to see distribution</p>
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white">Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => exportStudents(students)} disabled={students.length === 0}>
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Export Students ({students.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => exportTeachers(teachers)} disabled={teachers.length === 0}>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Export Teachers ({teachers.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => exportBursars(bursars)} disabled={bursars.length === 0}>
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Export Bursars ({bursars.length})
                </span>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white" onClick={() => exportPayments(payments)} disabled={payments.length === 0}>
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
        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold dark:text-white">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/payments')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => <div key={activity.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg hover:from-blue-50 hover:to-blue-100/50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-700">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        {index === 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                          {activity.date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm group-hover:shadow-md transition-all">
                      {formatCurrency(activity.amount)}
                    </Badge>
                  </div>) : <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Payments will appear here</p>
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