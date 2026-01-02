import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, FileText, TrendingUp, Users, Building2, DollarSign, GraduationCap, Calendar, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
export function PlatformReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalBursars: 0,
    totalPayments: 0,
    totalRevenue: 0
  });
  const [monthlyGrowth, setMonthlyGrowth] = useState({
    schools: 0,
    students: 0,
    users: 0
  });
  useEffect(() => {
    fetchStats();
  }, []);
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all stats in parallel
      const [schoolsData, studentsData, usersData, paymentsData] = await Promise.all([supabase.from('schools').select('id, approved, created_at'), supabase.from('students').select('id, created_at'), supabase.from('users').select('id, role, created_at'), supabase.from('payments').select('amount, created_at')]);
      const schools = schoolsData.data || [];
      const students = studentsData.data || [];
      const users = usersData.data || [];
      const payments = paymentsData.data || [];
      // Calculate stats
      setStats({
        totalSchools: schools.length,
        activeSchools: schools.filter(s => s.approved).length,
        totalStudents: students.length,
        totalTeachers: users.filter(u => u.role === 'teacher').length,
        totalAdmins: users.filter(u => u.role === 'school_admin').length,
        totalBursars: users.filter(u => u.role === 'bursar').length,
        totalPayments: payments.length,
        totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      });
      // Calculate monthly growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSchools = schools.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length;
      const recentStudents = students.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length;
      const recentUsers = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;
      setMonthlyGrowth({
        schools: recentSchools,
        students: recentStudents,
        users: recentUsers
      });
    } catch (err: any) {
      setError('Failed to fetch platform statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const exportReport = (type: string) => {
    // Placeholder for export functionality
    alert(`Exporting ${type} report... (Feature coming soon)`);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Comprehensive analytics and insights across the platform
          </p>
        </div>
        <Button variant="primary" onClick={() => exportReport('comprehensive')} leftIcon={<Download className="w-4 h-4" />}>
          Export Full Report
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Platform Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Total Schools
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats.totalSchools}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+{monthlyGrowth.schools}{' '}
                  this month
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Active Schools
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.activeSchools}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(stats.activeSchools / stats.totalSchools * 100).toFixed(1)}
                  % approval rate
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stats.totalStudents.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+{monthlyGrowth.students}{' '}
                  this month
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  From {stats.totalPayments.toLocaleString()} payments
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Administrators
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.totalAdmins}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Teachers</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.totalTeachers}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Bursars</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {stats.totalBursars}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Export Options */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Export Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('schools')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Schools Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Complete list of all schools with stats
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('users')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Users Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  All users by role and school
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('students')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Students Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Student enrollment across schools
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('payments')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Payments Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Financial transactions summary
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('growth')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Growth Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Monthly growth trends and metrics
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => exportReport('analytics')}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Analytics Report
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Detailed platform analytics
                </p>
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                  Export PDF
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
}