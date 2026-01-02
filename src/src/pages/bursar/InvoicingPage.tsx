import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Download, Send, Eye, Printer, Mail, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, X, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabaseClient';
import { CreateInvoiceForm } from '../../components/forms/CreateInvoiceForm';
interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  student_name: string;
  class_name: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  term: string;
  academic_year: string;
  items: InvoiceItem[];
}
interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  fee_type: string;
}
export function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  useEffect(() => {
    fetchInvoices();
  }, []);
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('invoices').select(`
          *,
          students (
            full_name,
            admission_number,
            classes (name)
          ),
          terms (
            name,
            academic_years (year_name)
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      const formattedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        student_id: inv.student_id,
        student_name: inv.students?.full_name || 'Unknown',
        class_name: inv.students?.classes?.name || 'N/A',
        amount: parseFloat(inv.amount) || 0,
        amount_paid: parseFloat(inv.amount_paid) || 0,
        balance: parseFloat(inv.balance) || 0,
        status: inv.status,
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        term: inv.terms?.name || 'N/A',
        academic_year: inv.terms?.academic_years?.year_name || 'N/A',
        items: inv.items || []
      }));
      setInvoices(formattedInvoices);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'secondary';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const {
        error
      } = await supabase.from('invoices').update({
        status: 'sent',
        sent_at: new Date().toISOString()
      }).eq('id', invoiceId);
      if (error) throw error;
      fetchInvoices();
      alert('Invoice sent successfully!');
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      alert('Failed to send invoice');
    }
  };
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      alert('Generating invoice PDF...');
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
    }
  };
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    totalPaid: invoices.reduce((sum, i) => sum + i.amount_paid, 0),
    totalBalance: invoices.reduce((sum, i) => sum + i.balance, 0)
  };
  if (loading) {
    return <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Invoice Management
          </h1>
          <p className="text-slate-600 mt-1">
            Create, send, and track student invoices
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Paid</p>
              <p className="text-3xl font-bold text-emerald-600">
                {stats.paid}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input placeholder="Search by invoice number or student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Term
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                  Paid
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm || statusFilter !== 'all' ? 'No invoices found matching your filters.' : 'No invoices yet. Create your first invoice to get started.'}
                  </td>
                </tr> : filteredInvoices.map(invoice => <motion.tr key={invoice.id} initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-indigo-600">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">
                        {invoice.student_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {invoice.class_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {invoice.term}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-900">
                        KES {invoice.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-emerald-600">
                        KES {invoice.amount_paid.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-900">
                        KES {invoice.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(invoice.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'draft' && <Button size="sm" onClick={() => handleSendInvoice(invoice.id)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Send className="h-4 w-4" />
                          </Button>}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(invoice.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Invoice {selectedInvoice.invoice_number}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      Issued:{' '}
                      {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Student Info */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Bill To:
                  </h3>
                  <p className="text-lg font-medium text-slate-900">
                    {selectedInvoice.student_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedInvoice.class_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedInvoice.academic_year}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Payment Details:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-end gap-4">
                      <span className="text-sm text-slate-600">Due Date:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(selectedInvoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-end gap-4">
                      <span className="text-sm text-slate-600">Term:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {selectedInvoice.term}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Invoice Items:
                </h3>
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map(item => <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.fee_type}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">
                          KES {item.amount.toLocaleString()}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium text-slate-900">
                    KES {selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="font-medium text-emerald-600">
                    KES {selectedInvoice.amount_paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-200">
                  <span className="text-slate-900">Balance Due:</span>
                  <span className="text-indigo-600">
                    KES {selectedInvoice.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Invoice
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </motion.div>
        </div>}

      {/* Create Invoice Modal */}
      {showCreateModal && <CreateInvoiceForm onClose={() => setShowCreateModal(false)} onSuccess={fetchInvoices} />}
    </div>;
}