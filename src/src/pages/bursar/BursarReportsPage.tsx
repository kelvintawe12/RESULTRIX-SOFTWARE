import React, { useEffect, useState, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Download, DollarSign, TrendingUp, Users, Calendar, FileText, Filter } from 'lucide-react';
export function BursarReportsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportType, setReportType] = useState('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    totalStudents: 0,
    paidStudents: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchReportsData();
    }
  }, [user?.school_id, reportType]);
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch school currency first
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      setSchoolCurrency(schoolData?.currency_code || 'KES');
      // Fetch students data
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select(`
          id,
          full_name,
          admission_number,
          total_fee,
          total_paid,
          remaining,
          classes (name)
        `).eq('school_id', user?.school_id).order('full_name');
      if (studentsError) throw studentsError;
      const totalRevenue = studentsData?.reduce((sum, s) => sum + (Number(s.total_paid) || 0), 0) || 0;
      const pendingFees = studentsData?.reduce((sum, s) => sum + (Number(s.remaining) || 0), 0) || 0;
      const paidStudents = studentsData?.filter(s => Number(s.remaining) <= 0).length || 0;
      setStats({
        totalRevenue,
        pendingFees,
        totalStudents: studentsData?.length || 0,
        paidStudents
      });
      setStudents(studentsData || []);
      // Fetch payments data
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select(`
          id,
          amount,
          date,
          method,
          notes,
          students (full_name, admission_number, classes(name))
        `).order('date', {
        ascending: false
      }).limit(100);
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err: any) {
      console.error('Error fetching reports data:', err);
      setError(err.message || 'Failed to load reports data');
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
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      setError('No data to export');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Report exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  const exportArrearsReport = () => {
    const arrearsData = students.filter(s => s.remaining > 0).map(s => ({
      'Admission Number': s.admission_number || 'N/A',
      'Student Name': s.full_name,
      Class: s.classes?.name || 'N/A',
      'Total Fee': s.total_fee,
      'Amount Paid': s.total_paid,
      Balance: s.remaining
    }));
    exportToCSV(arrearsData, 'arrears_report');
  };
  const exportPaymentHistory = () => {
    const paymentData = payments.map(p => ({
      Date: new Date(p.date).toLocaleDateString(),
      Student: p.students?.full_name || 'N/A',
      'Admission Number': p.students?.admission_number || 'N/A',
      Class: p.students?.classes?.name || 'N/A',
      Amount: p.amount,
      Method: p.method,
      Notes: p.notes || ''
    }));
    exportToCSV(paymentData, 'payment_history');
  };
  const exportFullReport = () => {
    const fullData = students.map(s => ({
      'Admission Number': s.admission_number || 'N/A',
      'Student Name': s.full_name,
      Class: s.classes?.name || 'N/A',
      'Total Fee': s.total_fee,
      'Amount Paid': s.total_paid,
      Balance: s.remaining,
      Status: s.remaining <= 0 ? 'Fully Paid' : 'Pending'
    }));
    exportToCSV(fullData, 'financial_report');
  };
  const arrearsColumns = [{
    header: 'Admission No.',
    accessor: 'admission_number' as const,
    render: (row: any) => <span className="text-sm">{row.admission_number || 'N/A'}</span>
  }, {
    header: 'Student Name',
    accessor: 'full_name' as const,
    render: (row: any) => <span className="font-medium">{row.full_name}</span>
  }, {
    header: 'Class',
    accessor: 'classes' as const,
    render: (row: any) => <span className="text-sm">{row.classes?.name}</span>
  }, {
    header: 'Total Fee',
    accessor: 'total_fee' as const,
    render: (row: any) => <span className="text-sm">{formatCurrency(row.total_fee)}</span>
  }, {
    header: 'Paid',
    accessor: 'total_paid' as const,
    render: (row: any) => <span className="text-sm text-green-600">
          {formatCurrency(row.total_paid)}
        </span>
  }, {
    header: 'Balance',
    accessor: 'remaining' as const,
    render: (row: any) => <Badge variant="warning">{formatCurrency(row.remaining)}</Badge>
  }];
  const paymentColumns = [{
    header: 'Date',
    accessor: 'date' as const,
    render: (row: any) => <span className="text-sm">
          {new Date(row.date).toLocaleDateString()}
        </span>
  }, {
    header: 'Student',
    accessor: 'students' as const,
    render: (row: any) => <div>
          <p className="font-medium">{row.students?.full_name}</p>
          <p className="text-xs text-slate-500">
            {row.students?.admission_number}
          </p>
        </div>
  }, {
    header: 'Class',
    accessor: 'students' as const,
    render: (row: any) => <span className="text-sm">{row.students?.classes?.name}</span>
  }, {
    header: 'Amount',
    accessor: 'amount' as const,
    render: (row: any) => <span className="font-bold text-green-600">
          {formatCurrency(row.amount)}
        </span>
  }, {
    header: 'Method',
    accessor: 'method' as const,
    render: (row: any) => <Badge variant="secondary">{row.method}</Badge>
  }];
  const collectionRate = stats.totalStudents > 0 ? Math.round(stats.paidStudents / stats.totalStudents * 100) : 0;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Financial Reports
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            View and export financial summaries
          </p>
        </div>
        <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={exportFullReport} className="w-full sm:w-auto">
          Export Full Report
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(stats.totalRevenue)}
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
              <p className="text-xs sm:text-sm text-slate-500">Pending Fees</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(stats.pendingFees)}
              </p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Students
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {stats.totalStudents}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Collection Rate
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {collectionRate}%
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
          Fee Collection Progress
        </h3>
        <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4 mb-2">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 sm:h-4 rounded-full transition-all" style={{
          width: `${collectionRate}%`
        }} />
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-slate-600">
          <span>{stats.paidStudents} students fully paid</span>
          <span>
            {stats.totalStudents - stats.paidStudents} students with balance
          </span>
        </div>
      </Card>

      {/* Report Type Selection */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Detailed Reports
          </h3>
          <Select value={reportType} onChange={e => setReportType(e.target.value)} options={[{
          value: 'overview',
          label: 'Overview'
        }, {
          value: 'arrears',
          label: 'Arrears Report'
        }, {
          value: 'payments',
          label: 'Payment History'
        }]} className="w-full sm:w-48" />
        </div>

        {reportType === 'arrears' && <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-xs sm:text-sm text-slate-600">
                {students.filter(s => s.remaining > 0).length} student(s) with
                outstanding balance
              </p>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportArrearsReport} className="w-full sm:w-auto">
                Export Arrears
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table data={students.filter(s => s.remaining > 0)} columns={arrearsColumns} />
            </div>
          </div>}

        {reportType === 'payments' && <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <p className="text-xs sm:text-sm text-slate-600">
                {payments.length} payment(s) recorded
              </p>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportPaymentHistory} className="w-full sm:w-auto">
                Export Payments
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table data={payments} columns={paymentColumns} />
            </div>
          </div>}

        {reportType === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
                Quick Export Options
              </h4>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start text-sm" leftIcon={<FileText className="w-4 h-4" />} onClick={exportArrearsReport}>
                  Export Arrears Report
                </Button>
                <Button variant="secondary" className="w-full justify-start text-sm" leftIcon={<FileText className="w-4 h-4" />} onClick={exportPaymentHistory}>
                  Export Payment History
                </Button>
                <Button variant="secondary" className="w-full justify-start text-sm" leftIcon={<FileText className="w-4 h-4" />} onClick={exportFullReport}>
                  Export Full Financial Report
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
                Payment Statistics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Fully Paid Students
                  </span>
                  <span className="font-bold text-green-600">
                    {stats.paidStudents}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Students with Balance
                  </span>
                  <span className="font-bold text-amber-600">
                    {stats.totalStudents - stats.paidStudents}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600">
                    Average Payment
                  </span>
                  <span className="font-bold text-blue-600 truncate ml-2">
                    {formatCurrency(stats.totalStudents > 0 ? stats.totalRevenue / stats.totalStudents : 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>}
      </Card>
    </div>;
}