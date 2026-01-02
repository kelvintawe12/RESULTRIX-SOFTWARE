import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabaseClient';
interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  fee_type: string;
}
interface CreateInvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}
export function CreateInvoiceForm({
  onClose,
  onSuccess
}: CreateInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    term_id: '',
    due_date: '',
    issue_date: new Date().toISOString().split('T')[0]
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{
    id: '1',
    description: '',
    amount: 0,
    fee_type: 'tuition'
  }]);
  useEffect(() => {
    fetchStudents();
    fetchTerms();
  }, []);
  useEffect(() => {
    if (formData.student_id) {
      fetchFeeStructure(formData.student_id);
    }
  }, [formData.student_id]);
  const fetchStudents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('students').select(`
          id,
          full_name,
          admission_number,
          classes (name)
        `).order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };
  const fetchTerms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('terms').select(`
          id,
          name,
          academic_years (year_name)
        `).order('start_date', {
        ascending: false
      });
      if (error) throw error;
      setTerms(data || []);
    } catch (err) {
      console.error('Error fetching terms:', err);
    }
  };
  const fetchFeeStructure = async (studentId: string) => {
    try {
      const {
        data: studentData,
        error: studentError
      } = await supabase.from('students').select('class_id').eq('id', studentId).single();
      if (studentError) throw studentError;
      const {
        data,
        error
      } = await supabase.from('fee_structures').select('*').eq('class_id', studentData.class_id);
      if (error) throw error;
      setFeeStructures(data || []);
      if (data && data.length > 0) {
        setInvoiceItems(data.map((fee: any, index: number) => ({
          id: String(index + 1),
          description: fee.description || 'Tuition Fee',
          amount: parseFloat(fee.amount),
          fee_type: 'tuition'
        })));
      }
    } catch (err) {
      console.error('Error fetching fee structure:', err);
    }
  };
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, {
      id: String(invoiceItems.length + 1),
      description: '',
      amount: 0,
      fee_type: 'other'
    }]);
  };
  const removeInvoiceItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };
  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(invoiceItems.map(item => item.id === id ? {
      ...item,
      [field]: value
    } : item));
  };
  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (parseFloat(String(item.amount)) || 0), 0);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const totalAmount = calculateTotal();
      // Create invoice record - using correct column names from schema
      const {
        data: invoiceData,
        error: invoiceError
      } = await supabase.from('invoices').insert({
        subscription_id: null,
        school_id: formData.student_id,
        invoice_number: invoiceNumber,
        amount_due: totalAmount,
        amount_paid: 0,
        currency_code: 'KES',
        status: 'draft',
        billing_reason: 'manual',
        period_start: formData.issue_date,
        period_end: formData.due_date,
        due_date: formData.due_date,
        description: `Student fees for ${formData.term_id}`,
        line_items: invoiceItems
      }).select().single();
      if (invoiceError) throw invoiceError;
      // Update student's total_fee
      const {
        error: studentError
      } = await supabase.from('students').update({
        total_fee: totalAmount,
        remaining: totalAmount
      }).eq('id', formData.student_id);
      if (studentError) throw studentError;
      alert('Invoice created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      alert(`Failed to create invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Create New Invoice
            </h2>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student *
                </label>
                <select required value={formData.student_id} onChange={e => setFormData({
                ...formData,
                student_id: e.target.value
              })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Student</option>
                  {students.map(student => <option key={student.id} value={student.id}>
                      {student.full_name} ({student.admission_number}) -{' '}
                      {student.classes?.name}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Term *
                </label>
                <select required value={formData.term_id} onChange={e => setFormData({
                ...formData,
                term_id: e.target.value
              })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Term</option>
                  {terms.map(term => <option key={term.id} value={term.id}>
                      {term.name} - {term.academic_years?.year_name}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Issue Date *
                </label>
                <Input type="date" required value={formData.issue_date} onChange={e => setFormData({
                ...formData,
                issue_date: e.target.value
              })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date *
                </label>
                <Input type="date" required value={formData.due_date} onChange={e => setFormData({
                ...formData,
                due_date: e.target.value
              })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Invoice Items
                </h3>
                <Button type="button" size="sm" onClick={addInvoiceItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {invoiceItems.map(item => <div key={item.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input placeholder="Description" value={item.description} onChange={e => updateInvoiceItem(item.id, 'description', e.target.value)} required />
                    </div>
                    <div className="w-32">
                      <Input type="number" placeholder="Amount" value={item.amount} onChange={e => updateInvoiceItem(item.id, 'amount', parseFloat(e.target.value) || 0)} required min="0" step="0.01" />
                    </div>
                    <select value={item.fee_type} onChange={e => updateInvoiceItem(item.id, 'fee_type', e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="tuition">Tuition</option>
                      <option value="transport">Transport</option>
                      <option value="meals">Meals</option>
                      <option value="books">Books</option>
                      <option value="uniform">Uniform</option>
                      <option value="other">Other</option>
                    </select>
                    <Button type="button" size="sm" variant="outline" onClick={() => removeInvoiceItem(item.id)} disabled={invoiceItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-indigo-600">
                    KES{' '}
                    {calculateTotal().toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {loading ? <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating Invoice...
                  </> : 'Create Invoice'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="px-8">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>;
}