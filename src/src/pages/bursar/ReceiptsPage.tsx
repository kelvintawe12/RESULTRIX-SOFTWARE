import React, { useEffect, useState, useRef, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Receipt, Search, Download, Printer, Eye, Calendar, DollarSign, Filter, FileText, TrendingUp, Users } from 'lucide-react';
type TabType = 'all' | 'today' | 'week' | 'month' | 'custom';
export function ReceiptsPage() {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Enhanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc, student_asc
  const [classes, setClasses] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch school info
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').select('*').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      setSchoolInfo(schoolData);
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);
      // Fetch students with payment info
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
          classes (name)
        `).eq('school_id', user?.school_id).order('full_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
      // Fetch all payments with student details
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
            total_fee,
            total_paid,
            remaining,
            classes(name)
          )
        `).eq('students.school_id', user?.school_id).order('date', {
        ascending: false
      });
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: schoolInfo?.currency_code || 'USD'
    }).format(amount);
  };
  const handlePrintReceipt = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const receiptHTML = printRef.current.innerHTML;
    const receiptNumber = selectedPayment?.students?.admission_number || 'N/A';
    printWindow.document.write('<!DOCTYPE html>');
    printWindow.document.write('<html><head>');
    printWindow.document.write('<title>Receipt - ' + receiptNumber + '</title>');
    printWindow.document.write('<style>{`');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }');
    printWindow.document.write('.receipt-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; position: relative; }');
    printWindow.document.write('.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: bold; color: rgba(0, 0, 0, 0.05); z-index: 0; pointer-events: none; }');
    printWindow.document.write('.content { position: relative; z-index: 1; }');
    printWindow.document.write('table { border-collapse: collapse; width: 100%; }');
    printWindow.document.write('th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }');
    printWindow.document.write('th { background-color: #f8fafc; font-weight: 600; }');
    printWindow.document.write('@media print { body { padding: 0; } .no-print { display: none; } }');
    printWindow.document.write('`}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptHTML);
    printWindow.document.write('<script>');
    printWindow.document.write('window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }');
    printWindow.document.write('</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
  };
  const handleViewReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowPreview(true);
  };
  const exportToCSV = () => {
    const csvData = filteredPayments.map(p => ({
      Date: new Date(p.date).toLocaleDateString(),
      'Receipt No': p.id.substring(0, 8).toUpperCase(),
      Student: p.students?.full_name || 'N/A',
      'Admission Number': p.students?.admission_number || 'N/A',
      Class: p.students?.classes?.name || 'N/A',
      Amount: p.amount,
      Method: p.method,
      Notes: p.notes || ''
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Receipts exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  // Apply tab filters
  const getTabFilteredPayments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    switch (activeTab) {
      case 'today':
        return payments.filter(p => new Date(p.date) >= today);
      case 'week':
        return payments.filter(p => new Date(p.date) >= weekAgo);
      case 'month':
        return payments.filter(p => new Date(p.date) >= monthAgo);
      case 'custom':
      case 'all':
      default:
        return payments;
    }
  };
  // Apply all filters
  let filteredPayments = getTabFilteredPayments().filter(p => {
    const matchesSearch = !searchTerm || p.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.students?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || p.students?.class_id === filterClass;
    const matchesMethod = !filterMethod || p.method === filterMethod;
    const matchesAmountMin = !filterAmountMin || p.amount >= parseFloat(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || p.amount <= parseFloat(filterAmountMax);
    const matchesDateFrom = !filterDateFrom || p.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || p.date <= filterDateTo;
    return matchesSearch && matchesClass && matchesMethod && matchesAmountMin && matchesAmountMax && matchesDateFrom && matchesDateTo;
  });
  // Apply sorting
  filteredPayments.sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'student_asc':
        return (a.students?.full_name || '').localeCompare(b.students?.full_name || '');
      default:
        return 0;
    }
  });
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const averageAmount = filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;
  const paymentColumns = [{
    header: 'Receipt No.',
    accessor: 'id' as const,
    render: (row: any) => <span className="font-mono text-sm font-medium text-slate-900">
          {row.id.substring(0, 8).toUpperCase()}
        </span>
  }, {
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
    render: (row: any) => <span className="font-bold text-green-600 text-lg">
          {formatCurrency(row.amount)}
        </span>
  }, {
    header: 'Method',
    accessor: 'method' as const,
    render: (row: any) => <Badge variant="secondary" className="capitalize">
          {row.method.replace('_', ' ')}
        </Badge>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleViewReceipt(row)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="primary" onClick={() => {
        setSelectedPayment(row);
        setTimeout(handlePrintReceipt, 100);
      }} leftIcon={<Printer className="w-4 h-4" />}>
            Print
          </Button>
        </div>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Receipt Management
          </h1>
          <p className="text-slate-500 mt-1">
            Generate and manage payment receipts
          </p>
        </div>
        <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={exportToCSV} disabled={filteredPayments.length === 0}>
          Export to CSV
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('all')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <FileText className="w-4 h-4" />
            All Receipts
          </button>
          <button onClick={() => setActiveTab('today')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'today' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button onClick={() => setActiveTab('week')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'week' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <TrendingUp className="w-4 h-4" />
            Last 7 Days
          </button>
          <button onClick={() => setActiveTab('month')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'month' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button onClick={() => setActiveTab('custom')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'custom' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Filter className="w-4 h-4" />
            Custom Range
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Receipts
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {filteredPayments.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Amount</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                Average Amount
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {formatCurrency(averageAmount)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">
                Unique Students
              </p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {new Set(filteredPayments.map(p => p.student_id)).size}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Advanced Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Input placeholder="Search by student, receipt no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="date_desc">Latest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
            <option value="student_asc">Student A-Z</option>
          </select>
        </div>

        {activeTab === 'custom' && <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
            <Input type="date" placeholder="From date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} label="From Date" />
            <Input type="date" placeholder="To date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} label="To Date" />
            <Input type="number" placeholder="Min amount" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} label="Min Amount" leftIcon={<DollarSign className="w-4 h-4" />} />
            <Input type="number" placeholder="Max amount" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} label="Max Amount" leftIcon={<DollarSign className="w-4 h-4" />} />
          </div>}
      </Card>

      {/* Receipts Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Payment Receipts ({filteredPayments.length})
          </h3>
        </div>

        {filteredPayments.length > 0 ? <Table data={filteredPayments} columns={paymentColumns} /> : <div className="text-center py-12 text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No receipts found matching your filters</p>
          </div>}
      </Card>

      {/* Receipt Preview Modal */}
      {showPreview && selectedPayment && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">
                Receipt Preview
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handlePrintReceipt} leftIcon={<Printer className="w-4 h-4" />}>
                  Print
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div ref={printRef}>
                <div className="receipt-container max-w-4xl mx-auto bg-white p-8 relative">
                  {/* Watermark */}
                  <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '120px',
                fontWeight: 'bold',
                color: 'rgba(0, 0, 0, 0.05)',
                zIndex: 0,
                pointerEvents: 'none',
                userSelect: 'none'
              }}>
                    {schoolInfo?.name?.split(' ')[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                    {/* Header */}
                    <div className="text-center mb-8 pb-6 border-b-2 border-slate-200">
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {schoolInfo?.name}
                      </h1>
                      {schoolInfo?.address && <p className="text-slate-600">{schoolInfo.address}</p>}
                      <div className="mt-4">
                        <Badge variant="success" className="text-lg px-4 py-2">
                          OFFICIAL RECEIPT
                        </Badge>
                      </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">
                          Receipt No.
                        </p>
                        <p className="font-bold text-slate-900">
                          {selectedPayment.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 mb-1">Date</p>
                        <p className="font-bold text-slate-900">
                          {new Date(selectedPayment.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                        </p>
                      </div>
                    </div>

                    {/* Student Information */}
                    <div className="bg-slate-50 p-6 rounded-lg mb-8">
                      <h3 className="font-bold text-slate-900 mb-4 text-lg">
                        Student Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Full Name</p>
                          <p className="font-medium text-slate-900">
                            {selectedPayment.students?.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">
                            Admission Number
                          </p>
                          <p className="font-medium text-slate-900">
                            {selectedPayment.students?.admission_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Class</p>
                          <p className="font-medium text-slate-900">
                            {selectedPayment.students?.classes?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">
                            Payment Method
                          </p>
                          <p className="font-medium text-slate-900 capitalize">
                            {selectedPayment.method.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="mb-8">
                      <h3 className="font-bold text-slate-900 mb-4 text-lg">
                        Fee Breakdown
                      </h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200">
                            <th className="text-left py-3 text-slate-700">
                              Description
                            </th>
                            <th className="text-right py-3 text-slate-700">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 text-slate-600">
                              Total Tuition Fee
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(selectedPayment.students?.total_fee || 0)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 text-slate-600">
                              Previous Payments
                            </td>
                            <td className="py-3 text-right font-medium text-green-600">
                              {formatCurrency((selectedPayment.students?.total_paid || 0) - selectedPayment.amount)}
                            </td>
                          </tr>
                          <tr className="border-b-2 border-slate-200 bg-blue-50">
                            <td className="py-3 font-bold text-slate-900">
                              Current Payment
                            </td>
                            <td className="py-3 text-right font-bold text-blue-600 text-lg">
                              {formatCurrency(selectedPayment.amount)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 text-slate-600">
                              Total Paid to Date
                            </td>
                            <td className="py-3 text-right font-medium text-green-600">
                              {formatCurrency(selectedPayment.students?.total_paid || 0)}
                            </td>
                          </tr>
                          <tr className="bg-amber-50">
                            <td className="py-3 font-bold text-slate-900">
                              Remaining Balance
                            </td>
                            <td className="py-3 text-right font-bold text-amber-600 text-lg">
                              {formatCurrency(selectedPayment.students?.remaining || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Payment History */}
                    <div className="mb-8">
                      <h3 className="font-bold text-slate-900 mb-4 text-lg">
                        Payment History
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-2 text-slate-600">
                                Date
                              </th>
                              <th className="text-left py-2 text-slate-600">
                                Method
                              </th>
                              <th className="text-right py-2 text-slate-600">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.filter(p => p.student_id === selectedPayment.student_id).slice(0, 5).map((p, idx) => <tr key={idx} className={`border-b border-slate-100 ${p.id === selectedPayment.id ? 'bg-blue-100' : ''}`}>
                                  <td className="py-2">
                                    {new Date(p.date).toLocaleDateString()}
                                  </td>
                                  <td className="py-2 capitalize">
                                    {p.method.replace('_', ' ')}
                                  </td>
                                  <td className="py-2 text-right font-medium">
                                    {formatCurrency(p.amount)}
                                  </td>
                                </tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedPayment.notes && <div className="mb-8">
                        <h3 className="font-bold text-slate-900 mb-2">Notes</h3>
                        <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                          {selectedPayment.notes}
                        </p>
                      </div>}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t-2 border-slate-200">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-sm text-slate-500 mb-2">
                            Received By
                          </p>
                          <div className="border-t-2 border-slate-300 pt-2 mt-8">
                            <p className="text-sm text-slate-600">
                              Bursar Signature
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-2">
                            Date Issued
                          </p>
                          <div className="border-t-2 border-slate-300 pt-2 mt-8">
                            <p className="text-sm text-slate-600">
                              {new Date(selectedPayment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 text-center text-sm text-slate-500">
                        <p>
                          This is an official receipt generated by{' '}
                          {schoolInfo?.name}
                        </p>
                        <p className="mt-1">
                          For inquiries, please contact the bursar's office
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
}