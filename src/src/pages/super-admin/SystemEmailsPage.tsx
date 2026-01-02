import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Mail, Send, Clock, CheckCircle, XCircle, Eye, RefreshCw, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Dialog } from '../../components/ui/Dialog';
interface Email {
  id: string;
  school_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  schools: {
    name: string;
  } | null;
}
export function SystemEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0
  });
  useEffect(() => {
    fetchEmails();
  }, []);
  useEffect(() => {
    let result = emails;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.recipient_email?.toLowerCase().includes(query) || e.subject?.toLowerCase().includes(query) || e.schools?.name?.toLowerCase().includes(query));
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }
    setFilteredEmails(result);
  }, [emails, searchQuery, statusFilter]);
  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('email_queue').select(`
          *,
          schools (
            name
          )
        `).order('created_at', {
        ascending: false
      }).limit(100);
      if (error) throw error;
      setEmails(data || []);
      setFilteredEmails(data || []);
      // Calculate stats
      setStats({
        total: data?.length || 0,
        sent: data?.filter(e => e.status === 'sent').length || 0,
        pending: data?.filter(e => e.status === 'pending').length || 0,
        failed: data?.filter(e => e.status === 'failed').length || 0
      });
    } catch (err: any) {
      setError('Failed to fetch emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Sent
          </Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>;
      case 'failed':
        return <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  const columns = [{
    header: 'Recipient',
    accessor: 'recipient_email' as const,
    render: (row: Email) => <div>
          <div className="font-medium text-slate-900">
            {row.recipient_name || 'Unknown'}
          </div>
          <div className="text-xs text-slate-500">{row.recipient_email}</div>
        </div>
  }, {
    header: 'Subject',
    accessor: 'subject' as const,
    render: (row: Email) => <div className="max-w-xs truncate text-sm text-slate-700">
          {row.subject}
        </div>
  }, {
    header: 'School',
    accessor: 'schools' as const,
    render: (row: Email) => <span className="text-sm text-slate-600">
          {row.schools?.name || 'System'}
        </span>
  }, {
    header: 'Status',
    accessor: 'status' as const,
    render: (row: Email) => getStatusBadge(row.status)
  }, {
    header: 'Sent',
    accessor: 'sent_at' as const,
    render: (row: Email) => <div className="text-sm text-slate-600">
          {row.sent_at ? new Date(row.sent_at).toLocaleDateString() : 'Not sent'}
        </div>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: Email) => <Button size="sm" variant="secondary" onClick={() => setSelectedEmail(row)} leftIcon={<Eye className="w-4 h-4" />}>
          View
        </Button>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Emails</h1>
          <p className="text-slate-500 mt-1">
            Monitor all email communications across the platform
          </p>
        </div>
        <Button variant="secondary" onClick={fetchEmails} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Emails</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Sent</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.sent}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.pending}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Failed</p>
              <p className="text-3xl font-bold text-rose-600 mt-2">
                {stats.failed}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by recipient, subject, or school..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emails Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredEmails.length > 0 ? <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {filteredEmails.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {emails.length}
                </span>{' '}
                emails
              </p>
            </div>
            <Table data={filteredEmails} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Emails Found
            </h3>
            <p className="text-slate-500">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No emails have been sent yet.'}
            </p>
          </div>}
      </div>

      {/* View Email Modal */}
      <Dialog isOpen={!!selectedEmail} onClose={() => setSelectedEmail(null)} title="Email Details" size="lg">
        {selectedEmail && <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedEmail.subject}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  To: {selectedEmail.recipient_email}
                </p>
              </div>
              {getStatusBadge(selectedEmail.status)}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Recipient Name
                </label>
                <p className="text-sm text-slate-900 mt-1">
                  {selectedEmail.recipient_name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  School
                </label>
                <p className="text-sm text-slate-900 mt-1">
                  {selectedEmail.schools?.name || 'System Email'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Created
                </label>
                <p className="text-sm text-slate-900 mt-1">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </p>
              </div>

              {selectedEmail.sent_at && <div>
                  <label className="text-sm font-medium text-slate-700">
                    Sent At
                  </label>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(selectedEmail.sent_at).toLocaleString()}
                  </p>
                </div>}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedEmail(null)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}