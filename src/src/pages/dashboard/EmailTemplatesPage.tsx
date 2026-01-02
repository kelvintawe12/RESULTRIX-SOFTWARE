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
import { Mail, Plus, Edit, Trash2, Save, X, Eye, Copy } from 'lucide-react';
interface EmailTemplate {
  id: string;
  school_id: string | null;
  name: string;
  subject_template: string;
  body_html_template: string;
  body_text_template: string | null;
  category: string | null;
  is_system_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export function EmailTemplatesPage() {
  const {
    user
  } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject_template: '',
    body_html_template: '',
    body_text_template: '',
    category: 'general'
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchTemplates();
    }
  }, [user]);
  const fetchTemplates = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const {
        data,
        error: templatesError
      } = await supabase.from('email_templates').select('*').or(`school_id.eq.${user.school_id},is_system_default.eq.true`).order('created_at', {
        ascending: false
      });
      if (templatesError) throw templatesError;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const templateData = {
        school_id: user?.school_id,
        name: formData.name,
        subject_template: formData.subject_template,
        body_html_template: formData.body_html_template,
        body_text_template: formData.body_text_template || null,
        category: formData.category,
        created_by: user?.id
      };
      if (editingId) {
        const {
          error: updateError
        } = await supabase.from('email_templates').update(templateData).eq('id', editingId);
        if (updateError) throw updateError;
        setSuccess('Template updated successfully');
      } else {
        const {
          error: insertError
        } = await supabase.from('email_templates').insert(templateData);
        if (insertError) throw insertError;
        setSuccess('Template created successfully');
      }
      setFormData({
        name: '',
        subject_template: '',
        body_html_template: '',
        body_text_template: '',
        category: 'general'
      });
      setShowAddForm(false);
      setEditingId(null);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject_template: template.subject_template,
      body_html_template: template.body_html_template,
      body_text_template: template.body_text_template || '',
      category: template.category || 'general'
    });
    setEditingId(template.id);
    setShowAddForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const {
        error: deleteError
      } = await supabase.from('email_templates').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    }
  };
  const handleDuplicate = (template: EmailTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      subject_template: template.subject_template,
      body_html_template: template.body_html_template,
      body_text_template: template.body_text_template || '',
      category: template.category || 'general'
    });
    setEditingId(null);
    setShowAddForm(true);
  };
  const handleCancel = () => {
    setFormData({
      name: '',
      subject_template: '',
      body_html_template: '',
      body_text_template: '',
      category: 'general'
    });
    setEditingId(null);
    setShowAddForm(false);
  };
  if (loading && !showAddForm) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500">Create and manage email templates</p>
        </div>
        {!showAddForm && <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
            New Template
          </Button>}
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {showAddForm && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? 'Edit Template' : 'New Template'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleCancel} leftIcon={<X className="h-4 w-4" />}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Template Name" required value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} placeholder="e.g., Fee Reminder" />

              <Select value={formData.category} onValueChange={value => setFormData({
            ...formData,
            category: value
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Input label="Subject" required value={formData.subject_template} onChange={e => setFormData({
            ...formData,
            subject_template: e.target.value
          })} placeholder="Use {{placeholders}} like {{student_name}}" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Body (HTML)
                </label>
                <textarea value={formData.body_html_template} onChange={e => setFormData({
              ...formData,
              body_html_template: e.target.value
            })} placeholder="Use {{placeholders}} like {{student_name}}, {{due_amount}}" rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                <p className="text-xs text-gray-500 mt-1">
                  Available placeholders: {'{'}student_name{'}'}, {'{'}
                  admission_number{'}'}, {'{'}due_amount{'}'}, {'{'}class_name
                  {'}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plain Text Version (Optional)
                </label>
                <textarea value={formData.body_text_template} onChange={e => setFormData({
              ...formData,
              body_text_template: e.target.value
            })} placeholder="Plain text fallback" rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} leftIcon={<Save className="h-4 w-4" />}>
                  {editingId ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Templates Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first email template
              </p>
              <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Create Template
              </Button>
            </div> : <div className="space-y-3">
              {templates.map(template => <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {template.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {template.category || 'general'}
                          </Badge>
                          {template.is_system_default && <Badge variant="default">System</Badge>}
                          <span className="text-xs text-gray-500">
                            {template.subject_template}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedTemplate(template);
                setViewModalOpen(true);
              }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system_default && <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>}
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedTemplate && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedTemplate(null);
    }} title="Template Preview" size="lg">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Template Name
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedTemplate.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Category
              </label>
              <Badge variant="secondary" className="mt-1">
                {selectedTemplate.category || 'general'}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Subject
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">
                {selectedTemplate.subject_template}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Body (HTML)
              </label>
              <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap">
                {selectedTemplate.body_html_template}
              </pre>
            </div>
            {selectedTemplate.body_text_template && <div>
                <label className="text-sm font-medium text-gray-600">
                  Plain Text Version
                </label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedTemplate.body_text_template}
                </pre>
              </div>}
          </div>
        </Dialog>}
    </div>;
}