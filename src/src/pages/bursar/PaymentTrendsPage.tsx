import React, { useEffect, useState, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
export function PaymentTrendsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [payments, setPayments] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState<any[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  useEffect(() => {
    if (user?.school_id) {
      fetchPaymentTrends();
    }
  }, [user?.school_id, timeRange]);
  const fetchPaymentTrends = async () => {
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
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      // Fetch payments within time range
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select(`
          id,
          amount,
          date,
          method,
          student_id,
          students (full_name, classes(name))
        `).eq('school_id', user?.school_id).gte('date', startDate.toISOString().split('T')[0]).order('date', {
        ascending: false
      });
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
      // Calculate daily totals
      const dailyMap = new Map<string, number>();
      paymentsData?.forEach(p => {
        const date = p.date;
        dailyMap.set(date, (dailyMap.get(date) || 0) + p.amount);
      });
      const daily = Array.from(dailyMap.entries()).map(([date, total]) => ({
        date,
        total
      })).sort((a, b) => a.date.localeCompare(b.date));
      setDailyTotals(daily);
      // Calculate monthly totals
      const monthlyMap = new Map<string, number>();
      paymentsData?.forEach(p => {
        const month = p.date.substring(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + p.amount);
      });
      const monthly = Array.from(monthlyMap.entries()).map(([month, total]) => ({
        month,
        total
      })).sort((a, b) => a.month.localeCompare(b.month));
      setMonthlyTotals(monthly);
      // Calculate payment method breakdown
      const methodMap = new Map<string, {
        count: number;
        total: number;
      }>();
      paymentsData?.forEach(p => {
        const current = methodMap.get(p.method) || {
          count: 0,
          total: 0
        };
        methodMap.set(p.method, {
          count: current.count + 1,
          total: current.total + p.amount
        });
      });
      const methods = Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        ...data
      })).sort((a, b) => b.total - a.total);
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error('Error fetching payment trends:', err);
      setError(err.message || 'Failed to load payment trends');
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
  const exportTrendsData = () => {
    const csvData = dailyTotals.map(d => ({
      Date: new Date(d.date).toLocaleDateString(),
      'Total Amount': d.total,
      'Number of Payments': payments.filter(p => p.date === d.date).length
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_trends_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Payment trends exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment = payments.length > 0 ? totalAmount / payments.length : 0;
  const peakDay = dailyTotals.length > 0 ? dailyTotals.reduce((max, d) => d.total > max.total ? d : max, dailyTotals[0]) : null;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Trends</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Analyze payment patterns and trends over time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={timeRange} onChange={e => setTimeRange(e.target.value)} options={[{
          value: '7',
          label: 'Last 7 Days'
        }, {
          value: '30',
          label: 'Last 30 Days'
        }, {
          value: '90',
          label: 'Last 90 Days'
        }, {
          value: '365',
          label: 'Last Year'
        }]} className="w-full sm:w-40" />
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={exportTrendsData} disabled={dailyTotals.length === 0} className="w-full sm:w-auto">
            Export
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Collected
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Payments
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {payments.length}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Average Payment
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(averagePayment)}
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">Peak Day</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">
                {peakDay ? formatCurrency(peakDay.total) : 'N/A'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {peakDay ? new Date(peakDay.date).toLocaleDateString() : ''}
              </p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Trend */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
            Daily Collection Trend
          </h3>
          {dailyTotals.length > 0 ? <div className="space-y-3">
              {dailyTotals.slice(-10).reverse().map(day => <div key={day.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm sm:text-base">
                        {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payments.filter(p => p.date === day.date).length}{' '}
                        payment(s)
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-green-600 ml-2 truncate">
                      {formatCurrency(day.total)}
                    </p>
                  </div>)}
            </div> : <div className="text-center py-12 text-slate-500">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm sm:text-base">
                No payment data for selected period
              </p>
            </div>}
        </Card>

        {/* Payment Methods */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
            Payment Methods
          </h3>
          {paymentMethods.length > 0 ? <div className="space-y-4">
              {paymentMethods.map(method => <div key={method.method}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-700 capitalize truncate">
                      {method.method.replace('_', ' ')}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 ml-2 truncate">
                      {formatCurrency(method.total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{
                width: `${method.total / totalAmount * 100}%`
              }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {method.count} payment{method.count !== 1 ? 's' : ''} •{' '}
                    {Math.round(method.total / totalAmount * 100)}%
                  </p>
                </div>)}
            </div> : <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm sm:text-base">
                No payment method data available
              </p>
            </div>}
        </Card>
      </div>

      {/* Monthly Trend */}
      {monthlyTotals.length > 0 && <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
            Monthly Collection Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyTotals.map(month => <div key={month.month} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-600">
                  {new Date(month.month + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
                </p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
                  {formatCurrency(month.total)}
                </p>
              </div>)}
          </div>
        </Card>}
    </div>;
}