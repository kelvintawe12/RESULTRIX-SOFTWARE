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
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Send, Eye, Search, Filter, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
interface EmailQueue {
  id: string;
  school_id: string;
  template_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_html: string;
  body_text: string | null;
  context: any;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  scheduled_for: string | null;
}
export function EmailCommunicationPage() {
  const {
    user
  } = useAuth();
  const [emails, setEmails] = useState<EmailQueue[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailQueue[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailQueue | null>(null);
  const [sendFormData, setSendFormData] = useState({
    templateId: '',
    recipientType: 'students',
    selectedRecipients: [] as string[],
    scheduledFor: ''
  });
  const [stats, setStats] = useState({
    totalEmails: 0,
    pending: 0,
    sent: 0,
    failed: 0,
    opened: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [emails, filterStatus, searchQuery]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [templatesData, studentsData, guardiansData, emailsData] = await Promise.all([supabase.from('email_templates').select('*').or(`school_id.eq.${user.school_id},is_system_default.eq.true`), supabase.from('students').select('id, full_name, email').eq('school_id', user.school_id).order('full_name'), supabase.from('guardians').select('id, full_name, email, student_id'), supabase.from('email_queue').select('*').eq('school_id', user.school_id).order('created_at', {
        ascending: false
      })]);
      if (templatesData.error) throw templatesData.error;
      if (studentsData.error) throw studentsData.error;
      if (guardiansData.error) throw guardiansData.error;
      if (emailsData.error) throw emailsData.error;
      setTemplates(templatesData.data || []);
      setStudents(studentsData.data || []);
      setGuardians(guardiansData.data || []);
      setEmails(emailsData.data || []);
      setStats({
        totalEmails: emailsData.data?.length || 0,
        pending: emailsData.data?.filter(e => e.status === 'pending').length || 0,
        sent: emailsData.data?.filter(e => e.status === 'sent').length || 0,
        failed: emailsData.data?.filter(e => e.status === 'failed').length || 0,
        opened: emailsData.data?.filter(e => e.status === 'opened').length || 0
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...emails];
    if (filterStatus) filtered = filtered.filter(e => e.status === filterStatus);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.recipient_email.toLowerCase().includes(query) || e.recipient_name?.toLowerCase().includes(query) || e.subject.toLowerCase().includes(query));
    }
    setFilteredEmails(filtered);
  };
  const handleSendEmails = async () => {
    if (!sendFormData.templateId || sendFormData.selectedRecipients.length === 0) {
      setError('Please select a template and at least one recipient');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const template = templates.find(t => t.id === sendFormData.templateId);
      if (!template) throw new Error('Template not found');
      const emailsToQueue = [];
      for (const recipientId of sendFormData.selectedRecipients) {
        let recipient: any;
        let context: any = {};
        if (sendFormData.recipientType === 'students') {
          recipient = students.find(s => s.id === recipientId);
          context = {
            student_id: recipientId,
            student_name: recipient?.full_name
          };
        } else {
          recipient = guardians.find(g => g.id === recipientId);
          const student = students.find(s => s.id === recipient?.student_id);
          context = {
            guardian_id: recipientId,
            guardian_name: recipient?.full_name,
            student_name: student?.full_name
          };
        }
        if (!recipient?.email) continue;
        // Simple placeholder replacement
        let subject = template.subject_template;
        let bodyHtml = template.body_html_template;
        let bodyText = template.body_text_template;
        Object.keys(context).forEach(key => {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), context[key] || '');
          bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), context[key] || '');
          if (bodyText) bodyText = bodyText.replace(new RegExp(placeholder, 'g'), context[key] || '');
        });
        emailsToQueue.push({
          school_id: user?.school_id,
          template_id: sendFormData.templateId,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          context,
          status: 'pending',
          scheduled_for: sendFormData.scheduledFor || null
        });
      }
      const {
        error: insertError
      } = await supabase.from('email_queue').insert(emailsToQueue);
      if (insertError) throw insertError;
      setSuccess(`Successfully queued ${emailsToQueue.length} email(s)`);
      setSendFormData({
        templateId: '',
        recipientType: 'students',
        selectedRecipients: [],
        scheduledFor: ''
      });
      setShowSendForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Error queuing emails:', err);
      setError(err.message || 'Failed to queue emails');
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'opened':
        return <Mail className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'failed':
        return 'secondary';
      case 'opened':
        return 'default';
      default:
        return 'secondary';
    }
  };
  if (loading && !showSendForm) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Email Communication
          </h1>
          <p className="text-gray-500">Send and manage email communications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {!showSendForm && <Button onClick={() => setShowSendForm(true)} leftIcon={<Send className="h-4 w-4" />}>
              Send Email
            </Button>}
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Total Emails</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalEmails}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Pending</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {stats.pending}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Sent</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">
              {stats.sent}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Failed</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              {stats.failed}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Opened</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.opened}
            </h3>
          </CardContent>
        </Card>
      </div>

      {showFilters && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
            setFilterStatus('');
            setSearchQuery('');
          }} leftIcon={<X className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>}

      {showSendForm && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Send Email</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSendForm(false)} leftIcon={<X className="h-4 w-4" />}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={sendFormData.templateId} onValueChange={value => setSendFormData({
            ...sendFormData,
            templateId: value
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Email Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sendFormData.recipientType} onValueChange={(value: any) => setSendFormData({
            ...sendFormData,
            recipientType: value,
            selectedRecipients: []
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Recipient Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="guardians">Guardians</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Recipients
                </label>
                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                  {sendFormData.recipientType === 'students' ? students.filter(s => s.email).map(student => <div key={student.id} className="flex items-center">
                            <Checkbox checked={sendFormData.selectedRecipients.includes(student.id)} onChange={() => {
                  setSendFormData(prev => ({
                    ...prev,
                    selectedRecipients: prev.selectedRecipients.includes(student.id) ? prev.selectedRecipients.filter(id => id !== student.id) : [...prev.selectedRecipients, student.id]
                  }));
                }} label={`${student.full_name} (${student.email})`} />
                          </div>) : guardians.filter(g => g.email).map(guardian => <div key={guardian.id} className="flex items-center">
                            <Checkbox checked={sendFormData.selectedRecipients.includes(guardian.id)} onChange={() => {
                  setSendFormData(prev => ({
                    ...prev,
                    selectedRecipients: prev.selectedRecipients.includes(guardian.id) ? prev.selectedRecipients.filter(id => id !== guardian.id) : [...prev.selectedRecipients, guardian.id]
                  }));
                }} label={`${guardian.full_name} (${guardian.email})`} />
                          </div>)}
                </div>
              </div>

              <Input type="datetime-local" label="Schedule For (Optional)" value={sendFormData.scheduledFor} onChange={e => setSendFormData({
            ...sendFormData,
            scheduledFor: e.target.value
          })} />

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {sendFormData.selectedRecipients.length} recipient(s) selected
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowSendForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmails} leftIcon={<Send className="h-4 w-4" />}>
                    {sendFormData.scheduledFor ? 'Schedule' : 'Send'} Email
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Email Queue ({filteredEmails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmails.length === 0 ? <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No emails found</p>
              <p className="text-gray-400 text-sm mt-2">
                {emails.length === 0 ? 'Emails will appear here once queued' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {filteredEmails.map(email => <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        {getStatusIcon(email.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {email.recipient_name || email.recipient_email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {email.recipient_email}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {email.subject}
                          </span>
                          <Badge variant={getStatusColor(email.status)}>
                            {email.status}
                          </Badge>
                        </div>
                        {email.sent_at && <p className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(email.sent_at).toLocaleString()}
                          </p>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
              setSelectedEmail(email);
              setViewModalOpen(true);
            }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedEmail && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedEmail(null);
    }} title="Email Details" size="lg">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Recipient
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedEmail.recipient_name || selectedEmail.recipient_email}
              </p>
              <p className="text-sm text-gray-500">
                {selectedEmail.recipient_email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Subject
              </label>
              <p className="text-gray-900">{selectedEmail.subject}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={getStatusColor(selectedEmail.status)}>
                  {selectedEmail.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Body</label>
              <div className="bg-gray-50 p-4 rounded-lg mt-1 max-h-96 overflow-y-auto">
                <div dangerouslySetInnerHTML={{
              __html: selectedEmail.body_html
            }} />
              </div>
            </div>
            {selectedEmail.error_message && <div>
                <label className="text-sm font-medium text-gray-600">
                  Error
                </label>
                <p className="text-red-600 bg-red-50 p-3 rounded-lg mt-1">
                  {selectedEmail.error_message}
                </p>
              </div>}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Created
              </label>
              <p className="text-gray-900">
                {new Date(selectedEmail.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Dialog>}
    </div>;
}