import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { School, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
export function GlobalAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeUsers: 0,
    totalRevenue: 0,
    growthRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Fetch total schools
      const {
        count: schoolsCount,
        error: schoolsError
      } = await supabase.from('schools').select('*', {
        count: 'exact',
        head: true
      }).eq('approved', true);
      if (schoolsError) throw schoolsError;
      // Fetch active users
      const {
        count: usersCount,
        error: usersError
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      });
      if (usersError) throw usersError;
      // Fetch total revenue from all students
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('total_paid');
      if (studentsError) throw studentsError;
      const totalRevenue = studentsData?.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0) || 0;
      // Fetch monthly school registrations for chart
      const {
        data: schoolsData,
        error: monthlyError
      } = await supabase.from('schools').select('created_at, id').order('created_at', {
        ascending: true
      });
      if (monthlyError) throw monthlyError;
      // Group by month
      const monthlyGroups: Record<string, {
        schools: number;
        revenue: number;
      }> = {};
      schoolsData?.forEach(school => {
        const date = new Date(school.created_at);
        const monthKey = date.toLocaleString('default', {
          month: 'short'
        });
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            schools: 0,
            revenue: 0
          };
        }
        monthlyGroups[monthKey].schools += 1;
      });
      // Fetch monthly revenue (simplified - in real app would need proper date grouping)
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select('amount, date').order('date', {
        ascending: true
      });
      if (paymentsError) throw paymentsError;
      paymentsData?.forEach(payment => {
        const date = new Date(payment.date);
        const monthKey = date.toLocaleString('default', {
          month: 'short'
        });
        if (monthlyGroups[monthKey]) {
          monthlyGroups[monthKey].revenue += Number(payment.amount) || 0;
        }
      });
      const chartData = Object.entries(monthlyGroups).map(([name, data]) => ({
        name,
        schools: data.schools,
        revenue: data.revenue
      }));
      // Calculate growth rate (simple: compare last 2 months)
      const growthRate = chartData.length >= 2 ? (chartData[chartData.length - 1].schools - chartData[chartData.length - 2].schools) / chartData[chartData.length - 2].schools * 100 : 0;
      setStats({
        totalSchools: schoolsCount || 0,
        activeUsers: usersCount || 0,
        totalRevenue,
        growthRate: Math.round(growthRate)
      });
      setMonthlyData(chartData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error) {
    return <Alert variant="error" title="Error" message={error} />;
  }
  return <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Global Analytics
          </h1>
          <p className="text-slate-500">
            Platform performance and growth metrics
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Schools" value={stats.totalSchools.toString()} trend={{
        value: 'Active',
        direction: 'neutral'
      }} icon={School} color="blue" />
        <MetricCard title="Active Users" value={stats.activeUsers.toLocaleString()} trend={{
        value: 'Platform-wide',
        direction: 'up'
      }} icon={Users} color="purple" />
        <MetricCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} trend={{
        value: 'All time',
        direction: 'up'
      }} icon={DollarSign} color="green" />
        <MetricCard title="Growth Rate" value={`${stats.growthRate}%`} trend={{
        value: 'Monthly',
        direction: stats.growthRate > 0 ? 'up' : 'down'
      }} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="School Growth Trend" className="min-h-[400px]">
          <div className="h-[300px] w-full mt-4">
            {monthlyData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                fill: '#64748B'
              }} />
                  <YAxis axisLine={false} tickLine={false} tick={{
                fill: '#64748B'
              }} />
                  <Tooltip contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                  <Line type="monotone" dataKey="schools" stroke="#2563EB" strokeWidth={3} dot={{
                fill: '#2563EB',
                strokeWidth: 2,
                r: 4,
                stroke: '#fff'
              }} activeDot={{
                r: 6,
                strokeWidth: 0
              }} />
                </LineChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-slate-500">
                No data available
              </div>}
          </div>
        </Card>

        <Card title="Revenue Overview" className="min-h-[400px]">
          <div className="h-[300px] w-full mt-4">
            {monthlyData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                fill: '#64748B'
              }} />
                  <YAxis axisLine={false} tickLine={false} tick={{
                fill: '#64748B'
              }} />
                  <Tooltip cursor={{
                fill: '#F1F5F9'
              }} contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-slate-500">
                No data available
              </div>}
          </div>
        </Card>
      </div>
    </div>;
}