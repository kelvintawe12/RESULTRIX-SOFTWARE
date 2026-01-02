import React, { useEffect, useState, createElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RecordPaymentForm } from '../../components/forms/RecordPaymentForm';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Download, Filter, Search, DollarSign, CreditCard, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
export function PaymentsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingPayments: 0,
    todayRevenue: 0,
    averagePayment: 0,
    totalTransactions: 0,
    overdueCount: 0
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paymentTrends, setPaymentTrends] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  useEffect(() => {
    if (user?.school_id) {
      fetchPaymentsData();
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
  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch school currency
      const {
        data: schoolData
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      setCurrencyCode(schoolData?.currency_code || 'USD');
      // Fetch payments first
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select('*').order('date', {
        ascending: false
      }).limit(100);
      if (paymentsError) throw paymentsError;
      // Get unique student IDs from payments
      const studentIds = [...new Set(paymentsData?.map(p => p.student_id) || [])];
      // Fetch student details for these payments
      const {
        data: studentsFromPayments,
        error: studentsPayError
      } = await supabase.from('students').select('id, full_name, admission_number, class_id, school_id, classes(name)').in('id', studentIds).eq('school_id', user?.school_id);
      if (studentsPayError) throw studentsPayError;
      // Create a map for quick lookup
      const studentMap = new Map(studentsFromPayments?.map(s => [s.id, s]) || []);
      // Filter payments for this school and enrich with student data
      const paymentsWithDetails = (paymentsData || []).filter(p => {
        const student = studentMap.get(p.student_id);
        return student && student.school_id === user?.school_id;
      }).map(p => {
        const student = studentMap.get(p.student_id);
        return {
          id: p.id,
          receiptId: `PAY-${p.id.slice(0, 8).toUpperCase()}`,
          student: student?.full_name || 'Unknown',
          class: student?.classes?.name || 'N/A',
          amount: p.amount,
          date: new Date(p.date).toLocaleDateString(),
          method: p.method,
          status: 'Completed',
          type: p.notes || 'Tuition Fee',
          created_at: p.created_at
        };
      });
      // Fetch all students for stats
      const {
        data: allStudents,
        error: studentsError
      } = await supabase.from('students').select('total_fee, total_paid, remaining').eq('school_id', user?.school_id);
      if (studentsError) throw studentsError;
      // Calculate stats
      const totalCollected = allStudents?.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0) || 0;
      const pendingPayments = allStudents?.reduce((sum, s) => sum + (Number(s.remaining) || 0), 0) || 0;
      const overdueCount = allStudents?.filter(s => Number(s.remaining) > 0).length || 0;
      // Today's revenue
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = paymentsWithDetails.filter(p => {
        const pDate = new Date(p.created_at).toISOString().split('T')[0];
        return pDate === today;
      });
      const todayRevenue = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      // Average payment
      const averagePayment = paymentsWithDetails.length > 0 ? totalCollected / paymentsWithDetails.length : 0;
      // Payment trends (last 7 days)
      const trends = Array.from({
        length: 7
      }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayPayments = paymentsWithDetails.filter(p => {
          const pDate = new Date(p.created_at).toISOString().split('T')[0];
          return pDate === dateStr;
        });
        const amount = dayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
          name: date.toLocaleDateString('en-US', {
            weekday: 'short'
          }),
          amount
        };
      });
      // Payment methods distribution
      const methodCounts: Record<string, number> = {};
      paymentsWithDetails.forEach(p => {
        const method = p.method || 'cash';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });
      const methodsData = Object.entries(methodCounts).map(([name, value], i) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: ['#4F46E5', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][i % 5]
      }));
      setPayments(paymentsWithDetails);
      setStats({
        totalCollected,
        pendingPayments,
        todayRevenue,
        averagePayment,
        totalTransactions: paymentsWithDetails.length,
        overdueCount
      });
      setPaymentTrends(trends);
      setPaymentMethods(methodsData);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.student.toLowerCase().includes(searchQuery.toLowerCase()) || payment.receiptId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });
  const exportToCSV = () => {
    const headers = ['Receipt ID', 'Student', 'Class', 'Type', 'Date', 'Amount', 'Method', 'Status'];
    const rows = filteredPayments.map(p => [p.receiptId, p.student, p.class, p.type, p.date, p.amount, p.method, p.status]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments & Transactions
          </h1>
          <p className="text-gray-500">
            Manage and track all school financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} leftIcon={<Download className="h-4 w-4" />}>
            Export Report
          </Button>
          <Button onClick={() => setPaymentModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Record New Payment
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Collected
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalCollected)}
                </h3>
                <div className="flex items-center mt-1 text-green-600 text-sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>{stats.totalTransactions} transactions</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending Payments
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.pendingPayments)}
                </h3>
                <div className="flex items-center mt-1 text-amber-600 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{stats.overdueCount} students overdue</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Today's Revenue
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.todayRevenue)}
                </h3>
                <div className="flex items-center mt-1 text-gray-500 text-sm">
                  <span>Real-time tracking</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Payment
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(Math.round(stats.averagePayment))}
                </h3>
                <div className="flex items-center mt-1 text-gray-500 text-sm">
                  <span>Per transaction</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                  fill: '#6B7280'
                }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{
                  fill: '#6B7280'
                }} tickFormatter={value => `$${value}`} />
                  <Tooltip contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} formatter={value => [`$${value}`, 'Revenue']} />
                  <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} dot={{
                  r: 4,
                  fill: '#4F46E5',
                  strokeWidth: 2,
                  stroke: '#fff'
                }} activeDot={{
                  r: 6
                }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {paymentMethods.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {paymentMethods.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-gray-500">
                  No payment data available
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Search by student, ID..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={[{
              value: 'all',
              label: 'All Status'
            }, {
              value: 'completed',
              label: 'Completed'
            }, {
              value: 'pending',
              label: 'Pending'
            }, {
              value: 'failed',
              label: 'Failed'
            }]} />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Receipt ID
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Student
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Type
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Date
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Method
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.slice(0, 15).map(payment => <tr key={payment.id} className="border-b hover:bg-gray-50/50">
                        <td className="p-3 text-sm font-medium text-gray-900">
                          {payment.receiptId}
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {payment.student}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.class}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{payment.type}</td>
                        <td className="p-3 text-sm">{payment.date}</td>
                        <td className="p-3 text-sm font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            {payment.method === 'credit_card' && <CreditCard className="h-3 w-3 text-gray-500" />}
                            {payment.method === 'cash' && <DollarSign className="h-3 w-3 text-gray-500" />}
                            {payment.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {payment.status}
                          </Badge>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {Math.min(15, filteredPayments.length)} of{' '}
                  {filteredPayments.length} transactions
                </p>
              </div>
            </> : <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No payments found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search' : 'Payments will appear here once recorded'}
              </p>
            </div>}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {paymentModalOpen && <RecordPaymentForm isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} onSuccess={() => {
      setPaymentModalOpen(false);
      fetchPaymentsData();
    }} />}
    </div>;
}