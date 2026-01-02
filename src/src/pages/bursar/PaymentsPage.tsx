import React, { useEffect, useState, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { RecordPaymentForm } from '../../components/forms/RecordPaymentForm';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Search, DollarSign, Download, CreditCard, Calendar, Filter, Receipt, Users, AlertCircle, CheckCircle, TrendingUp, Plus } from 'lucide-react';
type TabType = 'pending' | 'recent' | 'history';
export function PaymentsPage() {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('USD');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  // Payment History Tab filters
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterClass, setHistoryFilterClass] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch school currency
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      setSchoolCurrency(schoolData?.currency_code || 'USD');
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);
      // Fetch students
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
          class_id,
          created_at,
          classes (name)
        `).eq('school_id', user?.school_id).order('full_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
      // Fetch payment history
      const {
        data: paymentsData,
        error: paymentsError
      } = await supabase.from('payments').select(`
          id,
          amount,
          date,
          method,
          notes,
          created_at,
          student_id,
          students!inner (
            id,
            full_name,
            admission_number,
            class_id,
            school_id,
            classes(name)
          )
        `).eq('students.school_id', user?.school_id).order('date', {
        ascending: false
      }).limit(200);
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const handlePayNow = (student: any) => {
    setSelectedStudentForPayment(student);
    setPaymentModalOpen(true);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: schoolCurrency
    }).format(amount);
  };
  const exportPayments = () => {
    const csvData = filteredPayments.map(p => ({
      Date: new Date(p.date).toLocaleDateString(),
      Student: p.students?.full_name || 'N/A',
      'Admission Number': p.students?.admission_number || 'N/A',
      Class: p.students?.classes?.name || 'N/A',
      Amount: p.amount,
      Method: p.method,
      Notes: p.notes || ''
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
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Payments exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  // Filter payments for history tab
  let filteredPayments = payments.filter(p => {
    const matchesSearch = !historySearchTerm || p.students?.full_name?.toLowerCase().includes(historySearchTerm.toLowerCase()) || p.students?.admission_number?.toLowerCase().includes(historySearchTerm.toLowerCase());
    const matchesClass = !historyFilterClass || p.students?.class_id === historyFilterClass;
    const matchesMethod = !filterMethod || p.method === filterMethod;
    const matchesDateFrom = !filterDateFrom || p.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || p.date <= filterDateTo;
    return matchesSearch && matchesClass && matchesMethod && matchesDateFrom && matchesDateTo;
  });
  // Pending payments (students with outstanding balance)
  const pendingPayments = students.filter(s => s.remaining > 0);
  // Recent payments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPayments = payments.filter(p => new Date(p.date) >= sevenDaysAgo);
  const paymentColumns = [{
    header: 'Date',
    accessor: 'date' as const,
    render: (row: any) => <div>
          <p className="font-medium text-slate-900">
            {new Date(row.date).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(row.created_at).toLocaleTimeString()}
          </p>
        </div>
  }, {
    header: 'Student',
    accessor: 'students' as const,
    render: (row: any) => <div>
          <p className="font-medium text-slate-900">
            {row.students?.full_name}
          </p>
          <p className="text-xs text-slate-500">
            {row.students?.admission_number} • {row.students?.classes?.name}
          </p>
        </div>
  }, {
    header: 'Amount',
    accessor: 'amount' as const,
    render: (row: any) => <span className="font-bold text-green-600">
          {formatCurrency(row.amount)}
        </span>
  }, {
    header: 'Method',
    accessor: 'method' as const,
    render: (row: any) => <Badge variant="secondary" className="capitalize">
          {row.method.replace('_', ' ')}
        </Badge>
  }, {
    header: 'Notes',
    accessor: 'notes' as const,
    render: (row: any) => <span className="text-sm text-slate-600">{row.notes || '-'}</span>
  }];
  const pendingColumns = [{
    header: 'Student',
    accessor: 'full_name' as const,
    render: (row: any) => <div>
          <p className="font-medium text-slate-900">{row.full_name}</p>
          <p className="text-xs text-slate-500">
            {row.admission_number} • {row.classes?.name}
          </p>
        </div>
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
    render: (row: any) => <Badge variant="warning" className="font-bold">
          {formatCurrency(row.remaining)}
        </Badge>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <Button size="sm" variant="primary" onClick={() => handlePayNow(row)} leftIcon={<DollarSign className="w-4 h-4" />}>
          Pay Now
        </Button>
  }];
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, s) => sum + s.remaining, 0);
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payment Management
          </h1>
          <p className="text-slate-500 mt-1">
            Record payments and manage student balances
          </p>
        </div>
        <Button variant="primary" onClick={() => {
        setSelectedStudentForPayment(null);
        setPaymentModalOpen(true);
      }} leftIcon={<Plus className="w-4 h-4" />}>
          Record Payment
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <AlertCircle className="w-4 h-4" />
            Pending ({pendingPayments.length})
          </button>
          <button onClick={() => setActiveTab('recent')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'recent' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <TrendingUp className="w-4 h-4" />
            Recent (7 days)
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Receipt className="w-4 h-4" />
            All History
          </button>
        </div>
      </Card>

      {/* Pending Payments Tab */}
      {activeTab === 'pending' && <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Total Outstanding
                </p>
                <p className="text-3xl font-bold text-amber-900 mt-1">
                  {formatCurrency(totalPending)}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  {pendingPayments.length} student
                  {pendingPayments.length !== 1 ? 's' : ''} with balance
                </p>
              </div>
              <div className="bg-amber-100 p-4 rounded-xl">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Students with Outstanding Balance
            </h3>
            {pendingPayments.length > 0 ? <Table data={pendingPayments} columns={pendingColumns} /> : <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>All students have paid their fees!</p>
              </div>}
          </Card>
        </div>}

      {/* Recent Payments Tab */}
      {activeTab === 'recent' && <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Last 7 Days
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(recentPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {recentPayments.length} payment
                    {recentPayments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Average Payment
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(recentPayments.length > 0 ? recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length : 0)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Unique Students
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {new Set(recentPayments.map(p => p.student_id)).size}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Payment Records
            </h3>
            {recentPayments.length > 0 ? <Table data={recentPayments} columns={paymentColumns} /> : <div className="text-center py-12 text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No payments in the last 7 days</p>
              </div>}
          </Card>
        </div>}

      {/* All History Tab */}
      {activeTab === 'history' && <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Total Collected
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(totalCollected)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Payments
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {filteredPayments.length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Average Payment
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {formatCurrency(filteredPayments.length > 0 ? totalCollected / filteredPayments.length : 0)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input placeholder="Search student..." value={historySearchTerm} onChange={e => setHistorySearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
              <select value={historyFilterClass} onChange={e => setHistoryFilterClass(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}
              </select>
              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
              <Input type="date" placeholder="From date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              <Input type="date" placeholder="To date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </Card>

          {/* Payments Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Payment Records ({filteredPayments.length})
              </h3>
              <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportPayments} disabled={filteredPayments.length === 0}>
                Export
              </Button>
            </div>

            {filteredPayments.length > 0 ? <Table data={filteredPayments} columns={paymentColumns} /> : <div className="text-center py-12 text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No payments found matching your filters</p>
              </div>}
          </Card>
        </div>}

      {/* Record Payment Modal */}
      {paymentModalOpen && <RecordPaymentForm isOpen={paymentModalOpen} onClose={() => {
      setPaymentModalOpen(false);
      setSelectedStudentForPayment(null);
    }} onSuccess={() => {
      setPaymentModalOpen(false);
      setSelectedStudentForPayment(null);
      fetchData();
    }} preSelectedStudent={selectedStudentForPayment} />}
    </div>;
}