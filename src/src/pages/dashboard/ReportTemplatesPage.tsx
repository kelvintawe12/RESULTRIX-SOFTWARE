import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { FileText, Plus, Edit, Trash2, Save, X, Eye } from 'lucide-react';
interface ReportTemplate {
  id: string;
  school_id: string;
  config: any;
  created_at: string;
}
export function ReportTemplatesPage() {
  const {
    user
  } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    header: '',
    footer: '',
    showLogo: true,
    showRank: true,
    showAttendance: true,
    showComments: true,
    gradeDisplay: 'percentage'
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
      } = await supabase.from('report_templates').select('*').eq('school_id', user.school_id).order('created_at', {
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
      const config = {
        name: formData.name,
        header: formData.header,
        footer: formData.footer,
        showLogo: formData.showLogo,
        showRank: formData.showRank,
        showAttendance: formData.showAttendance,
        showComments: formData.showComments,
        gradeDisplay: formData.gradeDisplay
      };
      if (editingId) {
        const {
          error: updateError
        } = await supabase.from('report_templates').update({
          config
        }).eq('id', editingId);
        if (updateError) throw updateError;
        setSuccess('Template updated successfully');
      } else {
        const {
          error: insertError
        } = await supabase.from('report_templates').insert({
          school_id: user?.school_id,
          config
        });
        if (insertError) throw insertError;
        setSuccess('Template created successfully');
      }
      setFormData({
        name: '',
        header: '',
        footer: '',
        showLogo: true,
        showRank: true,
        showAttendance: true,
        showComments: true,
        gradeDisplay: 'percentage'
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
  const handleEdit = (template: ReportTemplate) => {
    setFormData({
      name: template.config.name || '',
      header: template.config.header || '',
      footer: template.config.footer || '',
      showLogo: template.config.showLogo ?? true,
      showRank: template.config.showRank ?? true,
      showAttendance: template.config.showAttendance ?? true,
      showComments: template.config.showComments ?? true,
      gradeDisplay: template.config.gradeDisplay || 'percentage'
    });
    setEditingId(template.id);
    setShowAddForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const {
        error: deleteError
      } = await supabase.from('report_templates').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    }
  };
  const handleCancel = () => {
    setFormData({
      name: '',
      header: '',
      footer: '',
      showLogo: true,
      showRank: true,
      showAttendance: true,
      showComments: true,
      gradeDisplay: 'percentage'
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
          <h1 className="text-2xl font-bold text-gray-900">Report Templates</h1>
          <p className="text-gray-500">Customize report card templates</p>
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
          })} placeholder="e.g., Standard Report Card" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Header Text
                </label>
                <textarea value={formData.header} onChange={e => setFormData({
              ...formData,
              header: e.target.value
            })} placeholder="School name, address, etc." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Footer Text
                </label>
                <textarea value={formData.footer} onChange={e => setFormData({
              ...formData,
              footer: e.target.value
            })} placeholder="Signature lines, notes, etc." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold text-gray-900">Display Options</h4>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.showLogo} onChange={e => setFormData({
                ...formData,
                showLogo: e.target.checked
              })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">
                    Show school logo
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.showRank} onChange={e => setFormData({
                ...formData,
                showRank: e.target.checked
              })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Show class rank</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.showAttendance} onChange={e => setFormData({
                ...formData,
                showAttendance: e.target.checked
              })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Show attendance</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.showComments} onChange={e => setFormData({
                ...formData,
                showComments: e.target.checked
              })} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">
                    Show teacher comments
                  </span>
                </label>
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
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Templates Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first report card template
              </p>
              <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Create Template
              </Button>
            </div> : <div className="space-y-3">
              {templates.map(template => <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {template.config.name || 'Untitled Template'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {template.config.showRank && <Badge variant="secondary">Rank</Badge>}
                          {template.config.showAttendance && <Badge variant="secondary">Attendance</Badge>}
                          {template.config.showComments && <Badge variant="secondary">Comments</Badge>}
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
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedTemplate && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedTemplate(null);
    }} title="Template Preview">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Template Name
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {selectedTemplate.config.name}
              </p>
            </div>
            {selectedTemplate.config.header && <div>
                <label className="text-sm font-medium text-gray-600">
                  Header
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedTemplate.config.header}
                </p>
              </div>}
            {selectedTemplate.config.footer && <div>
                <label className="text-sm font-medium text-gray-600">
                  Footer
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedTemplate.config.footer}
                </p>
              </div>}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Display Options
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.config.showLogo && <Badge>Logo</Badge>}
                {selectedTemplate.config.showRank && <Badge>Rank</Badge>}
                {selectedTemplate.config.showAttendance && <Badge>Attendance</Badge>}
                {selectedTemplate.config.showComments && <Badge>Comments</Badge>}
              </div>
            </div>
          </div>
        </Dialog>}
    </div>;
}