import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { Receipt, Download, Eye, Search, Filter, X, Printer, Calendar, DollarSign } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
interface PaymentReceipt {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
  receipt_path: string | null;
  created_at: string;
}
export function ReceiptsManagementPage() {
  const {
    user
  } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<PaymentReceipt[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [filterClass, setFilterClass] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalAmount: 0,
    avgAmount: 0,
    cashPayments: 0,
    bankTransfers: 0,
    otherMethods: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [receipts, filterClass, filterStudent, filterMethod, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount, searchQuery]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [schoolData, classesData, studentsData, paymentsData] = await Promise.all([supabase.from('schools').select('currency_code').eq('id', user.school_id).single(), supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'), supabase.from('students').select('id, full_name, admission_number, class_id').eq('school_id', user.school_id).order('full_name'), supabase.from('payments').select('*').order('date', {
        ascending: false
      })]);
      if (schoolData.error) throw schoolData.error;
      if (classesData.error) throw classesData.error;
      if (studentsData.error) throw studentsData.error;
      if (paymentsData.error) throw paymentsData.error;
      setCurrencyCode(schoolData.data?.currency_code || 'USD');
      const enrichedReceipts = (paymentsData.data || []).map(payment => {
        const student = studentsData.data?.find(s => s.id === payment.student_id);
        const classData = classesData.data?.find(c => c.id === student?.class_id);
        return {
          ...payment,
          student_name: student?.full_name || 'Unknown',
          admission_number: student?.admission_number || 'N/A',
          class_name: classData?.name || 'Unknown'
        };
      });
      setClasses(classesData.data || []);
      setStudents(studentsData.data || []);
      setReceipts(enrichedReceipts);
      const totalAmount = enrichedReceipts.reduce((sum, r) => sum + r.amount, 0);
      setStats({
        totalReceipts: enrichedReceipts.length,
        totalAmount,
        avgAmount: enrichedReceipts.length > 0 ? totalAmount / enrichedReceipts.length : 0,
        cashPayments: enrichedReceipts.filter(r => r.method === 'cash').length,
        bankTransfers: enrichedReceipts.filter(r => r.method === 'bank_transfer').length,
        otherMethods: enrichedReceipts.filter(r => !['cash', 'bank_transfer'].includes(r.method)).length
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...receipts];
    if (filterClass) {
      filtered = filtered.filter(r => {
        const student = students.find(s => s.full_name === r.student_name);
        return student?.class_id === filterClass;
      });
    }
    if (filterStudent) filtered = filtered.filter(r => r.student_id === filterStudent);
    if (filterMethod) filtered = filtered.filter(r => r.method === filterMethod);
    if (filterDateFrom) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(filterDateTo));
    }
    if (filterMinAmount) {
      filtered = filtered.filter(r => r.amount >= parseFloat(filterMinAmount));
    }
    if (filterMaxAmount) {
      filtered = filtered.filter(r => r.amount <= parseFloat(filterMaxAmount));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.student_name.toLowerCase().includes(query) || r.admission_number.toLowerCase().includes(query));
    }
    setFilteredReceipts(filtered);
  };
  const handleClearFilters = () => {
    setFilterClass('');
    setFilterStudent('');
    setFilterMethod('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setSearchQuery('');
  };
  const handlePrintReceipt = (receipt: PaymentReceipt) => {
    setSelectedReceipt(receipt);
    setViewModalOpen(true);
    setTimeout(() => window.print(), 500);
  };
  const handleExport = () => {
    const exportData = filteredReceipts.map(r => ({
      'Receipt ID': r.id.slice(0, 8),
      Date: new Date(r.date).toLocaleDateString(),
      Student: r.student_name,
      'Admission No': r.admission_number,
      Class: r.class_name,
      Amount: r.amount,
      Method: r.method,
      Notes: r.notes || ''
    }));
    downloadCSV(exportData, `receipts_${new Date().toISOString().split('T')[0]}.csv`);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
          <p className="text-gray-500">View and manage payment receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={filteredReceipts.length === 0} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Total Receipts</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalReceipts}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Total Amount</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(stats.totalAmount)}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Avg Amount</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">
              {formatCurrency(stats.avgAmount)}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Cash</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {stats.cashPayments}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Bank Transfer</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.bankTransfers}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Other Methods</p>
            <h3 className="text-2xl font-bold text-pink-600 mt-1">
              {stats.otherMethods}
            </h3>
          </CardContent>
        </Card>
      </div>

      {showFilters && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advanced Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} leftIcon={<X className="h-4 w-4" />}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Students</SelectItem>
                  {students.map(student => <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input type="date" label="From Date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              <Input type="date" label="To Date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              <Input type="number" label="Min Amount" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} placeholder="0" />
              <Input type="number" label="Max Amount" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} placeholder="0" />
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Receipts ({filteredReceipts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No receipts found</p>
              <p className="text-gray-400 text-sm mt-2">
                {receipts.length === 0 ? 'Receipts will appear here once payments are recorded' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {filteredReceipts.map(receipt => <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {receipt.student_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {receipt.admission_number}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {receipt.class_name}
                          </span>
                          <span className="text-gray-300">•</span>
                          <Badge variant="secondary">
                            {receipt.method.replace('_', ' ')}
                          </Badge>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(receipt.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(receipt.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedReceipt(receipt);
                setViewModalOpen(true);
              }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(receipt)} leftIcon={<Printer className="h-4 w-4" />}>
                      Print
                    </Button>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedReceipt && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedReceipt(null);
    }} title="Receipt Details" size="lg">
          <div className="space-y-4" id="receipt-print">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Payment Receipt
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Receipt ID: {selectedReceipt.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Student
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedReceipt.student_name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedReceipt.admission_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Class
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedReceipt.class_name}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Payment Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedReceipt.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Payment Method
                  </label>
                  <Badge variant="secondary" className="mt-1">
                    {selectedReceipt.method.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-600">
                Amount Paid
              </label>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(selectedReceipt.amount)}
              </p>
            </div>

            {selectedReceipt.notes && <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">
                  Notes
                </label>
                <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                  {selectedReceipt.notes}
                </p>
              </div>}

            <div className="border-t pt-4 text-center">
              <p className="text-xs text-gray-500">
                Generated on{' '}
                {new Date(selectedReceipt.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-6 print:hidden">
            <Button variant="outline" onClick={() => {
          setViewModalOpen(false);
          setSelectedReceipt(null);
        }}>
              Close
            </Button>
            <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
              Print Receipt
            </Button>
          </div>
        </Dialog>}
    </div>;
}