import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, CreditCard, Download, Eye, Plus, Calendar, Receipt, PieChart, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle, FileText, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
export function BursarDashboard() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    totalStudents: 0,
    todayCollection: 0,
    weekCollection: 0,
    monthCollection: 0,
    paidStudents: 0,
    partiallyPaid: 0,
    notPaid: 0,
    overdueAmount: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [topDebtors, setTopDebtors] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  useEffect(() => {
    if (user?.school_id) {
      fetchDashboardData();
    }
  }, [user?.school_id]);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch school currency
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      setSchoolCurrency(schoolData?.currency_code || 'KES');
      // Fetch students financial data
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select('id, full_name, admission_number, total_fee, total_paid, remaining, class_id, classes(name)').eq('school_id', user?.school_id);
      if (studentsError) throw studentsError;
      const totalRevenue = studentsData?.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0) || 0;
      const pendingFees = studentsData?.reduce((sum, s) => sum + (Number(s.remaining) || 0), 0) || 0;
      const paidStudents = studentsData?.filter(s => Number(s.remaining) <= 0).length || 0;
      const partiallyPaid = studentsData?.filter(s => Number(s.total_paid) > 0 && Number(s.remaining) > 0).length || 0;
      const notPaid = studentsData?.filter(s => Number(s.total_paid) === 0).length || 0;
      // Get top 5 debtors
      const debtors = studentsData?.filter(s => Number(s.remaining) > 0).sort((a, b) => Number(b.remaining) - Number(a.remaining)).slice(0, 5) || [];
      setTopDebtors(debtors);
      // Fetch payments for different periods
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // Today's payments
      const {
        data: todayPayments,
        error: todayError
      } = await supabase.from('payments').select('amount, student_id, students!inner(school_id)').eq('students.school_id', user?.school_id).gte('date', todayStr);
      if (todayError) throw todayError;
      const todayCollection = todayPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      // Week's payments
      const {
        data: weekPayments,
        error: weekError
      } = await supabase.from('payments').select('amount, student_id, students!inner(school_id)').eq('students.school_id', user?.school_id).gte('date', weekAgo);
      if (weekError) throw weekError;
      const weekCollection = weekPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      // Month's payments
      const {
        data: monthPayments,
        error: monthError
      } = await supabase.from('payments').select('amount, student_id, students!inner(school_id)').eq('students.school_id', user?.school_id).gte('date', monthAgo);
      if (monthError) throw monthError;
      const monthCollection = monthPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      // Recent payments with details
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select(`
          id,
          amount,
          date,
          method,
          student_id,
          students (full_name, admission_number, classes(name))
        `).order('date', {
        ascending: false
      }).limit(10);
      if (paymentsError) throw paymentsError;
      // Payment methods breakdown
      const methodsBreakdown = paymentsData?.reduce((acc: any, payment: any) => {
        const method = payment.method || 'cash';
        if (!acc[method]) {
          acc[method] = {
            method,
            count: 0,
            total: 0
          };
        }
        acc[method].count++;
        acc[method].total += Number(payment.amount) || 0;
        return acc;
      }, {});
      setPaymentMethods(Object.values(methodsBreakdown || {}));
      setStats({
        totalRevenue,
        pendingFees,
        totalStudents: studentsData?.length || 0,
        todayCollection,
        weekCollection,
        monthCollection,
        paidStudents,
        partiallyPaid,
        notPaid,
        overdueAmount: pendingFees
      });
      setRecentPayments(paymentsData || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: schoolCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const collectionRate = stats.totalStudents > 0 ? Math.round(stats.paidStudents / stats.totalStudents * 100) : 0;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Financial Dashboard
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Real-time fee collection and revenue tracking
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link to="/bursar/invoicing" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-sm">Create Invoice</span>
            </Button>
          </Link>
          <Link to="/bursar/payments" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm">Record Payment</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Primary Stats - Today, Week, Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-emerald-100 text-xs sm:text-sm font-medium mb-1">
                  Today's Collection
                </p>
                <p className="text-2xl sm:text-3xl font-bold truncate">
                  {formatCurrency(stats.todayCollection)}
                </p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>
                {recentPayments.filter(p => p.date === new Date().toISOString().split('T')[0]).length}{' '}
                transactions
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">
                  This Week
                </p>
                <p className="text-2xl sm:text-3xl font-bold truncate">
                  {formatCurrency(stats.weekCollection)}
                </p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>7 days collection</span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="sm:col-span-2 lg:col-span-1">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">
                  This Month
                </p>
                <p className="text-2xl sm:text-3xl font-bold truncate">
                  {formatCurrency(stats.monthCollection)}
                </p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-purple-100 text-xs sm:text-sm">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>30 days collection</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">
              Total
            </Badge>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 truncate">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            Total Revenue Collected
          </p>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">Collection Rate</span>
              <span className="font-semibold text-blue-600">
                {collectionRate}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-amber-100 p-2 sm:p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
            <Badge variant="default" className="bg-amber-100 text-amber-700 text-xs">
              Pending
            </Badge>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 truncate">
            {formatCurrency(stats.pendingFees)}
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            Outstanding Balance
          </p>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">Students Owing</span>
              <span className="font-semibold text-amber-600">
                {stats.partiallyPaid + stats.notPaid}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-emerald-100 p-2 sm:p-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <Badge variant="success" className="text-xs">
              Paid
            </Badge>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            {stats.paidStudents}
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            Fully Paid Students
          </p>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">Partial</span>
              <span className="font-semibold text-slate-900">
                {stats.partiallyPaid}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-rose-100 p-2 sm:p-3 rounded-xl">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
            </div>
            <Badge variant="destructive" className="text-xs">
              Not Paid
            </Badge>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            {stats.notPaid}
          </p>
          <p className="text-xs sm:text-sm text-slate-600">Students Not Paid</p>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">Total Students</span>
              <span className="font-semibold text-slate-900">
                {stats.totalStudents}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Fee Collection Progress
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Overall payment status breakdown
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              {collectionRate}%
            </p>
            <p className="text-xs sm:text-sm text-slate-600">Collected</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Fully Paid */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-slate-600">
                Fully Paid ({stats.paidStudents} students)
              </span>
              <span className="font-semibold text-emerald-600">
                {stats.totalStudents > 0 ? Math.round(stats.paidStudents / stats.totalStudents * 100) : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 sm:h-3 rounded-full transition-all duration-500" style={{
              width: `${stats.totalStudents > 0 ? stats.paidStudents / stats.totalStudents * 100 : 0}%`
            }} />
            </div>
          </div>

          {/* Partially Paid */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-slate-600">
                Partially Paid ({stats.partiallyPaid} students)
              </span>
              <span className="font-semibold text-amber-600">
                {stats.totalStudents > 0 ? Math.round(stats.partiallyPaid / stats.totalStudents * 100) : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 sm:h-3 rounded-full transition-all duration-500" style={{
              width: `${stats.totalStudents > 0 ? stats.partiallyPaid / stats.totalStudents * 100 : 0}%`
            }} />
            </div>
          </div>

          {/* Not Paid */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-slate-600">
                Not Paid ({stats.notPaid} students)
              </span>
              <span className="font-semibold text-rose-600">
                {stats.totalStudents > 0 ? Math.round(stats.notPaid / stats.totalStudents * 100) : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
              <div className="bg-gradient-to-r from-rose-500 to-rose-600 h-2 sm:h-3 rounded-full transition-all duration-500" style={{
              width: `${stats.totalStudents > 0 ? stats.notPaid / stats.totalStudents * 100 : 0}%`
            }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Recent Payments
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Latest fee transactions
                </p>
              </div>
              <Link to="/bursar/reports">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>

            {recentPayments.length > 0 ? <div className="space-y-3">
                {recentPayments.map(payment => <motion.div key={payment.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-200">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                          {payment.students?.full_name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate">
                          {payment.students?.classes?.name} •{' '}
                          {payment.method.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-emerald-600 text-sm sm:text-lg whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>)}
              </div> : <div className="text-center py-12 text-slate-500">
                <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm sm:text-base">No recent payments</p>
              </div>}
          </Card>
        </div>

        {/* Top Debtors & Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Top Debtors */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              Top Outstanding Balances
            </h3>
            {topDebtors.length > 0 ? <div className="space-y-3">
                {topDebtors.map((student, index) => <div key={student.id} className="flex items-center justify-between p-2 sm:p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="bg-rose-100 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-rose-600 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {student.classes?.name}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-rose-600 text-xs sm:text-sm whitespace-nowrap ml-2">
                      {formatCurrency(student.remaining)}
                    </p>
                  </div>)}
              </div> : <p className="text-center text-slate-500 py-8 text-sm">
                No outstanding balances
              </p>}
          </Card>

          {/* Quick Actions */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/bursar/invoicing" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-indigo-50 hover:border-indigo-300 text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
              <Link to="/bursar/payments" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-300 text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </Link>
              <Link to="/bursar/student-balances" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-amber-50 hover:border-amber-300 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Student Balances
                </Button>
              </Link>
              <Link to="/bursar/reports" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 text-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </Button>
              </Link>
              <Link to="/bursar/fee-structure" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300 text-sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Fee Structure
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>;
}