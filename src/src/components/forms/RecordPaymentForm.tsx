import React, { useEffect, useState, createElement } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { recordPayment } from '../../utils/recordPayment';
import { Search, DollarSign, Receipt, Filter, X, CheckCircle, Download } from 'lucide-react';
interface RecordPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedStudent?: {
    id: string;
    full_name: string;
    total_paid: number;
    remaining: number;
    total_fee: number;
  } | null;
}
export function RecordPaymentForm({
  isOpen,
  onClose,
  onSuccess,
  preSelectedStudent
}: RecordPaymentFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('KES');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    notes: ''
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  useEffect(() => {
    if (isOpen && user?.school_id) {
      fetchSchoolCurrency();
      if (preSelectedStudent) {
        setSelectedStudent(preSelectedStudent);
        setFormData(prev => ({
          ...prev,
          studentId: preSelectedStudent.id
        }));
      } else {
        fetchClasses();
        fetchStudents();
      }
    }
  }, [isOpen, user?.school_id, preSelectedStudent]);
  const fetchSchoolCurrency = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (error) throw error;
      setCurrencyCode(data?.currency_code || 'KES');
    } catch (err: any) {
      console.error('Error fetching school currency:', err);
    }
  };
  const fetchClasses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };
  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const {
        data,
        error
      } = await supabase.from('students').select('id, full_name, admission_number, total_fee, total_paid, remaining, class_id, classes(name)').eq('school_id', user?.school_id).order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };
  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId
    }));
  };
  const generateReceipt = (paymentId: string, student: any, amount: number, date: string, method: string) => {
    return {
      receiptNumber: `RCP-${paymentId.slice(0, 8).toUpperCase()}`,
      date: new Date(date).toLocaleDateString(),
      student: {
        name: student.full_name,
        admissionNumber: student.admission_number,
        class: student.classes?.name
      },
      payment: {
        amount: amount,
        method: method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        previousBalance: student.total_fee - (student.total_paid - amount),
        amountPaid: amount,
        newBalance: student.remaining
      },
      school: user?.school_id
    };
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!formData.studentId) {
        throw new Error('Please select a student');
      }
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      // Check for overpayment and warn user
      if (selectedStudent && amount > selectedStudent.remaining && selectedStudent.remaining > 0) {
        const overpayment = amount - selectedStudent.remaining;
        const confirmed = confirm(`This payment of ${formatCurrency(amount)} exceeds the remaining balance of ${formatCurrency(selectedStudent.remaining)} by ${formatCurrency(overpayment)}. This will result in a credit balance. Continue?`);
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      console.log('Recording payment using utility function...');
      // Use the utility function that properly handles school_id
      const result = await recordPayment({
        studentId: formData.studentId,
        amount,
        date: formData.date,
        method: formData.method,
        notes: formData.notes
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to record payment');
      }
      console.log('Payment recorded successfully!');
      setReceiptData(result.receiptData);
      setShowReceipt(true);
      setSuccess('Payment recorded successfully!');
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };
  const handlePrintReceipt = () => {
    window.print();
  };
  const handleDownloadReceipt = () => {
    const receiptContent = `
PAYMENT RECEIPT
Receipt #: ${receiptData.receiptNumber}
Date: ${receiptData.date}

STUDENT INFORMATION
Name: ${receiptData.student.name}
Admission #: ${receiptData.student.admissionNumber}
Class: ${receiptData.student.class}

PAYMENT DETAILS
Previous Balance: ${formatCurrency(receiptData.payment.previousBalance)}
Amount Paid: ${formatCurrency(receiptData.payment.amountPaid)}
New Balance: ${formatCurrency(receiptData.payment.newBalance)}
Payment Method: ${receiptData.payment.method}

Thank you for your payment!
    `;
    const blob = new Blob([receiptContent], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleClose = () => {
    setFormData({
      studentId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      notes: ''
    });
    setSelectedStudent(null);
    setSearchQuery('');
    setFilterClass('all');
    setError(null);
    setSuccess(null);
    setShowReceipt(false);
    setReceiptData(null);
    onClose();
  };
  const handleFinish = () => {
    onSuccess();
    handleClose();
  };
  // Payment method options - MUST match your database enum exactly
  const paymentMethodOptions = [{
    value: 'cash',
    label: 'Cash'
  }, {
    value: 'bank_transfer',
    label: 'Bank Transfer'
  }, {
    value: 'credit_card',
    label: 'Credit Card'
  }, {
    value: 'mobile_money',
    label: 'Mobile Money (M-Pesa)'
  }, {
    value: 'other',
    label: 'Other'
  }];
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || s.class_id === filterClass;
    return matchesSearch && matchesClass;
  });
  // Receipt View
  if (showReceipt && receiptData) {
    return <Dialog isOpen={isOpen} onClose={handleClose} title="Payment Receipt" size="md">
        <div className="space-y-6">
          <Alert variant="success" title="Payment Successful" message="The payment has been recorded successfully." />

          {/* Receipt Content */}
          <div className="border-2 border-slate-200 rounded-lg p-6 bg-white" id="receipt-content">
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Payment Receipt
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Receipt #{receiptData.receiptNumber}
              </p>
              <p className="text-sm text-slate-500">{receiptData.date}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Student Information
                </h3>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{' '}
                    {receiptData.student.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Admission #:</span>{' '}
                    {receiptData.student.admissionNumber}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Class:</span>{' '}
                    {receiptData.student.class}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Payment Details
                </h3>

                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Previous Balance:</span>
                    <span className="font-semibold">
                      {formatCurrency(receiptData.payment.previousBalance)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">
                      -
                      {formatCurrency(receiptData.payment.amountPaid).replace(/^[^\d-]+/, '')}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-semibold text-slate-900">
                      New Balance:
                    </span>
                    <span className="font-bold text-lg text-slate-900">
                      {formatCurrency(receiptData.payment.newBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-600">Payment Method:</span>
                    <span className="font-medium">
                      {receiptData.payment.method}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Thank you for your payment!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleDownloadReceipt} leftIcon={<Download className="h-4 w-4" />}>
              Download
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintReceipt} leftIcon={<Receipt className="h-4 w-4" />}>
                Print Receipt
              </Button>
              <Button variant="primary" onClick={handleFinish}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </Dialog>;
  }
  // Payment Form View
  return <Dialog isOpen={isOpen} onClose={handleClose} title="Record Payment" size="md">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Payment Error" message={error} onClose={() => setError(null)} />}

        {/* Student Selection */}
        {!preSelectedStudent && <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Student <span className="text-red-500">*</span>
            </label>

            {loadingStudents ? <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div> : <>
                {/* Search and Filter */}
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by name or admission number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                  <div className="w-40">
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Classes</option>
                      {classes.map(cls => <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>)}
                    </select>
                  </div>
                </div>

                {/* Student List */}
                <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg">
                  {filteredStudents.length > 0 ? filteredStudents.map(student => <div key={student.id} onClick={() => handleStudentSelect(student.id)} className={`p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 transition-colors ${formData.studentId === student.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {student.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {student.admission_number} •{' '}
                              {student.classes?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-rose-600">
                              {formatCurrency(student.remaining)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Outstanding
                            </p>
                          </div>
                        </div>
                      </div>) : <div className="p-8 text-center text-slate-500">
                      {searchQuery || filterClass !== 'all' ? 'No students found matching filters' : students.length === 0 ? 'No students enrolled yet. Add students first.' : 'No students found'}
                    </div>}
                </div>
              </>}
          </div>}

        {/* Selected Student Summary */}
        {selectedStudent && <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-lg">
                  {selectedStudent.full_name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedStudent.admission_number} •{' '}
                  {selectedStudent.classes?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">
                  Outstanding Balance
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatCurrency(selectedStudent.remaining)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-200">
              <div>
                <p className="text-xs text-slate-500">Total Fee</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(selectedStudent.total_fee)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Paid</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(selectedStudent.total_paid)}
                </p>
              </div>
            </div>
          </div>}

        {/* Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Amount" type="number" step="0.01" min="0" required value={formData.amount} onChange={e => setFormData({
          ...formData,
          amount: e.target.value
        })} placeholder="0.00" leftIcon={<DollarSign className="h-4 w-4 text-gray-400" />} />

          <Input label="Payment Date" type="date" required value={formData.date} onChange={e => setFormData({
          ...formData,
          date: e.target.value
        })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Payment Method
          </label>
          <select value={formData.method} onChange={e => setFormData({
          ...formData,
          method: e.target.value
        })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {paymentMethodOptions.map(option => <option key={option.value} value={option.value}>
                {option.label}
              </option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Notes (Optional)
          </label>
          <textarea value={formData.notes} onChange={e => setFormData({
          ...formData,
          notes: e.target.value
        })} placeholder="Add any additional notes about this payment..." rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        {/* Quick Amount Buttons */}
        {selectedStudent && <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Quick fill:</span>
            <Button size="sm" variant="outline" onClick={() => setFormData({
          ...formData,
          amount: (selectedStudent.remaining / 2).toFixed(2)
        })}>
              Half
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFormData({
          ...formData,
          amount: selectedStudent.remaining.toFixed(2)
        })}>
              Full Balance
            </Button>
          </div>}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={!formData.amount || !formData.studentId} leftIcon={<Receipt className="h-4 w-4" />}>
            Record Payment
          </Button>
        </div>
      </div>
    </Dialog>;
}