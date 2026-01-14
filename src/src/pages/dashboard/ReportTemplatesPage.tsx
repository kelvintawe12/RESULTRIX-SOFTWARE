import React, { useEffect, useState } from 'react';

// Type-safe checkbox field helper (must be outside the component)
type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(!!e.target.checked)}
      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { EnhancedTemplatePreview } from '../../components/reports/EnhancedTemplatePreview';
import { 
  FileText, Plus, Edit, Trash2, Save, X, Eye, Copy, Check, 
  Palette, Layout, Star, Sparkles, Grid, List, Award
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  school_id: string | null;
  template_name: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  description: string;
  layout_type: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  config: any;
  created_at: string;
  updated_at?: string;
}

export function ReportTemplatesPage() {
    const [showDefaultTemplates, setShowDefaultTemplates] = useState(false);
  const { user } = useAuth();
  const [defaultTemplates, setDefaultTemplates] = useState<ReportTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const defaultFormData = {
    template_name: '',
    description: '',
    header: '',
    footer: '',
    showLogo: true,
    showRank: true,
    showAttendance: true,
    showComments: true,
    showGradeScale: false,
    showSubjectCoefficients: false,
    gradeDisplay: 'percentage',
    subjectGrouping: 'none',
    showClassAverage: false,
    showPercentile: false,
    useCards: false,
    colorCodeGrades: false,
    compactLayout: false,
    multiPage: false,
    includeCoverPage: false,
    includeTableOfContents: false,
    includeSummaryPage: false,
    includeProgressCharts: false,
    includeCharts: false,
    includeGlossary: false,
    pageNumbers: false,
    showWatermark: false,
    watermarkText: '',
    watermarkOpacity: 0.05,
    includeStamp: false,
    stampPosition: 'bottom-right',
    includeSignatures: false,
    includeDigitalSignatures: false,
    signatureFields: ['Principal', 'Class Teacher', 'Parent/Guardian'],
    includeSchoolMotto: false,
    includeQRCode: false,
    showTermProgress: false,
    showStrengthsWeaknesses: false,
    showRecommendations: false,
    showAttendanceChart: false,
    showGradeDistribution: false,
    fontFamily: 'Arial',
    fontSize: 'medium',
    borderStyle: 'solid',
    headerStyle: 'formal',
    layoutType: 'standard',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B'
  };
  const [formData, setFormData] = useState({ ...defaultFormData });

  useEffect(() => {
    if (user?.school_id) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    if (!user?.school_id) return;
    
    try {
      setLoading(true);
      
      // Fetch default templates (school_id IS NULL)
      const { data: defaults, error: defaultsError } = await supabase
        .from('report_templates')
        .select('*')
        .is('school_id', null)
        .eq('is_default', true)
        .order('template_type');
      
      if (defaultsError) throw defaultsError;
      
      // Fetch school's custom templates
      const { data: customs, error: customsError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('school_id', user.school_id)
        .order('created_at', { ascending: false });
      
      if (customsError) throw customsError;
      
      setDefaultTemplates(defaults || []);
      setCustomTemplates(customs || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneTemplate = async (templateId: string) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Call the clone function
      const { data, error: cloneError } = await supabase
        .rpc('clone_default_template', {
          p_default_template_id: templateId,
          p_school_id: user?.school_id
        });

      if (cloneError) throw cloneError;

      setSuccess('Template cloned successfully! You can now customize it.');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error cloning template:', err);
      setError(err.message || 'Failed to clone template');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTemplate = async (templateId: string) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Call the activate function
      const { error: activateError } = await supabase
        .rpc('activate_template', {
          p_template_id: templateId,
          p_school_id: user?.school_id
        });

      if (activateError) throw activateError;

      setSuccess('Template activated successfully!');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error activating template:', err);
      setError(err.message || 'Failed to activate template');
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
        name: formData.template_name,
        header: formData.header,
        footer: formData.footer,
        showLogo: formData.showLogo,
        showRank: formData.showRank,
        showAttendance: formData.showAttendance,
        showComments: formData.showComments,
        showGradeScale: formData.showGradeScale,
        showSubjectCoefficients: formData.showSubjectCoefficients,
        gradeDisplay: formData.gradeDisplay,
        subjectGrouping: formData.subjectGrouping,
        showClassAverage: formData.showClassAverage,
        showPercentile: formData.showPercentile,
        useCards: formData.useCards,
        colorCodeGrades: formData.colorCodeGrades,
        compactLayout: formData.compactLayout,
        multiPage: formData.multiPage,
        includeCoverPage: formData.includeCoverPage,
        includeTableOfContents: formData.includeTableOfContents,
        includeSummaryPage: formData.includeSummaryPage,
        includeProgressCharts: formData.includeProgressCharts,
        includeCharts: formData.includeCharts,
        includeGlossary: formData.includeGlossary,
        pageNumbers: formData.pageNumbers,
        showWatermark: formData.showWatermark,
        watermarkText: formData.watermarkText,
        watermarkOpacity: formData.watermarkOpacity,
        includeStamp: formData.includeStamp,
        stampPosition: formData.stampPosition,
        includeSignatures: formData.includeSignatures,
        includeDigitalSignatures: formData.includeDigitalSignatures,
        signatureFields: formData.signatureFields,
        includeSchoolMotto: formData.includeSchoolMotto,
        includeQRCode: formData.includeQRCode,
        showTermProgress: formData.showTermProgress,
        showStrengthsWeaknesses: formData.showStrengthsWeaknesses,
        showRecommendations: formData.showRecommendations,
        showAttendanceChart: formData.showAttendanceChart,
        showGradeDistribution: formData.showGradeDistribution,
        fontFamily: formData.fontFamily,
        fontSize: formData.fontSize,
        borderStyle: formData.borderStyle,
        headerStyle: formData.headerStyle
      };

      const templateData = {
        school_id: user?.school_id,
        template_name: formData.template_name,
        description: formData.description,
        template_type: 'custom',
        is_default: false,
        is_active: false,
        layout_type: formData.layoutType,
        color_scheme: {
          primary: formData.primaryColor,
          secondary: formData.secondaryColor,
          accent: formData.accentColor
        },
        config
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('report_templates')
          .update(templateData)
          .eq('id', editingId);
        
        if (updateError) throw updateError;
        setSuccess('Template updated successfully');
      } else {
        const { error: insertError } = await supabase
          .from('report_templates')
          .insert(templateData);
        
        if (insertError) throw insertError;
        setSuccess('Template created successfully');
      }

      setFormData({
        template_name: '',
        description: '',
        header: '',
        footer: '',
        showLogo: true,
        showRank: true,
        showAttendance: true,
        showComments: true,
        showGradeScale: false,
        showSubjectCoefficients: false,
        gradeDisplay: 'percentage',
        subjectGrouping: 'none',
        showClassAverage: false,
        showPercentile: false,
        useCards: false,
        colorCodeGrades: false,
        compactLayout: false,
        multiPage: false,
        includeCoverPage: false,
        includeTableOfContents: false,
        includeSummaryPage: false,
        includeProgressCharts: false,
        includeCharts: false,
        includeGlossary: false,
        pageNumbers: false,
        showWatermark: false,
        watermarkText: '',
        watermarkOpacity: 0.05,
        includeStamp: false,
        stampPosition: 'bottom-right',
        includeSignatures: false,
        includeDigitalSignatures: false,
        signatureFields: ['Principal', 'Class Teacher', 'Parent/Guardian'],
        includeSchoolMotto: false,
        includeQRCode: false,
        showTermProgress: false,
        showStrengthsWeaknesses: false,
        showRecommendations: false,
        showAttendanceChart: false,
        showGradeDistribution: false,
        fontFamily: 'Arial',
        fontSize: 'medium',
        borderStyle: 'solid',
        headerStyle: 'formal',
        layoutType: 'standard',
        primaryColor: '#4F46E5',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B'
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
      ...defaultFormData,
      template_name: template.template_name || '',
      description: template.description || '',
      header: template.config.header || '',
      footer: template.config.footer || '',
      showLogo: template.config.showLogo ?? true,
      showRank: template.config.showRank ?? true,
      showAttendance: template.config.showAttendance ?? true,
      showComments: template.config.showComments ?? true,
      showGradeScale: template.config.showGradeScale ?? false,
      showSubjectCoefficients: template.config.showSubjectCoefficients ?? false,
      gradeDisplay: template.config.gradeDisplay || 'percentage',
      subjectGrouping: template.config.subjectGrouping || 'none',
      showClassAverage: template.config.showClassAverage ?? false,
      showPercentile: template.config.showPercentile ?? false,
      useCards: template.config.useCards ?? false,
      colorCodeGrades: template.config.colorCodeGrades ?? false,
      compactLayout: template.config.compactLayout ?? false,
      multiPage: template.config.multiPage ?? false,
      includeCoverPage: template.config.includeCoverPage ?? false,
      includeTableOfContents: template.config.includeTableOfContents ?? false,
      includeSummaryPage: template.config.includeSummaryPage ?? false,
      includeProgressCharts: template.config.includeProgressCharts ?? false,
      includeCharts: template.config.includeCharts ?? false,
      includeGlossary: template.config.includeGlossary ?? false,
      pageNumbers: template.config.pageNumbers ?? false,
      showWatermark: template.config.showWatermark ?? false,
      watermarkText: template.config.watermarkText || '',
      watermarkOpacity: template.config.watermarkOpacity ?? 0.05,
      includeStamp: template.config.includeStamp ?? false,
      stampPosition: template.config.stampPosition || 'bottom-right',
      includeSignatures: template.config.includeSignatures ?? false,
      includeDigitalSignatures: template.config.includeDigitalSignatures ?? false,
      signatureFields: template.config.signatureFields || ['Principal', 'Class Teacher', 'Parent/Guardian'],
      includeSchoolMotto: template.config.includeSchoolMotto ?? false,
      includeQRCode: template.config.includeQRCode ?? false,
      showTermProgress: template.config.showTermProgress ?? false,
      showStrengthsWeaknesses: template.config.showStrengthsWeaknesses ?? false,
      showRecommendations: template.config.showRecommendations ?? false,
      showAttendanceChart: template.config.showAttendanceChart ?? false,
      showGradeDistribution: template.config.showGradeDistribution ?? false,
      fontFamily: template.config.fontFamily || 'Arial',
      fontSize: template.config.fontSize || 'medium',
      borderStyle: template.config.borderStyle || 'solid',
      headerStyle: template.config.headerStyle || 'formal',
      layoutType: template.layout_type || 'standard',
      primaryColor: template.color_scheme?.primary || '#4F46E5',
      secondaryColor: template.color_scheme?.secondary || '#10B981',
      accentColor: template.color_scheme?.accent || '#F59E0B'
    });
    setEditingId(template.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    }
  };

  const handleCancel = () => {
    setFormData({ ...defaultFormData });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'classic': return '📚';
      case 'modern': return '✨';
      case 'detailed': return '📊';
      case 'minimal': return '📄';
      case 'booklet': return '📖';
      default: return '📝';
    }
  };

  const renderTemplateCard = (template: ReportTemplate, isDefault: boolean) => (
    <Card 
      key={template.id} 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        template.is_active ? 'ring-2 ring-green-500 shadow-lg' : 'hover:ring-2 hover:ring-indigo-200'
      }`}
    >
      {/* Gradient Color Bar - Taller and more prominent */}
      <div 
        className="h-3" 
        style={{ 
          background: `linear-gradient(135deg, ${template.color_scheme?.primary || '#4F46E5'}, ${template.color_scheme?.secondary || '#10B981'})` 
        }}
      />
      
      <CardContent className="p-6 lg:p-8">
        {/* Icon and Title Section - Larger and more prominent */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-3">
            <div 
              className="text-5xl lg:text-6xl transform transition-transform group-hover:scale-110"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            >
              {getTemplateIcon(template.template_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl lg:text-2xl text-gray-900 mb-2 flex items-center gap-2 flex-wrap">
                {template.template_name}
                {template.is_active && (
                  <Badge variant="success" className="text-xs animate-pulse">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </h3>
              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                {template.description}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section - Better organized */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {isDefault && (
              <Badge variant="info" className="text-xs font-semibold">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            <span 
              className="inline-flex items-center font-medium rounded-full border text-xs capitalize px-2.5 py-0.5"
              style={{
                backgroundColor: `${template.color_scheme?.primary}15`,
                color: template.color_scheme?.primary,
                borderColor: `${template.color_scheme?.primary}30`
              }}
            >
              {template.template_type}
            </span>
          </div>
          
          {/* Feature badges in a cleaner layout */}
          {(template.config.showRank || template.config.showAttendance || template.config.showComments) && (
            <div className="flex flex-wrap gap-2">
              {template.config.showRank && (
                <Badge variant="neutral" className="text-xs">
                  📊 Rank
                </Badge>
              )}
              {template.config.showAttendance && (
                <Badge variant="neutral" className="text-xs">
                  📅 Attendance
                </Badge>
              )}
              {template.config.showComments && (
                <Badge variant="neutral" className="text-xs">
                  💬 Comments
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Color Scheme Preview - Larger and more visual */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Colors:</span>
            <div className="flex gap-2">
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-white shadow-md transition-transform hover:scale-110 cursor-pointer" 
                style={{ backgroundColor: template.color_scheme?.primary }}
                title="Primary Color"
              />
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-white shadow-md transition-transform hover:scale-110 cursor-pointer" 
                style={{ backgroundColor: template.color_scheme?.secondary }}
                title="Secondary Color"
              />
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-white shadow-md transition-transform hover:scale-110 cursor-pointer" 
                style={{ backgroundColor: template.color_scheme?.accent }}
                title="Accent Color"
              />
            </div>
          </div>
        </div>

        {/* Actions - Larger buttons with better spacing */}
        <div className="flex items-center gap-3 pt-6 border-t-2 border-gray-100">
          {isDefault ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCloneTemplate(template.id)}
                leftIcon={<Copy className="h-4 w-4" />}
                className="flex-1 font-semibold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-colors"
              >
                Clone & Customize
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedTemplate(template);
                  setViewModalOpen(true);
                }}
                className="hover:bg-indigo-50 hover:text-indigo-700"
                title="Preview Template"
              >
                <Eye className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              {!template.is_active && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleActivateTemplate(template.id)}
                  leftIcon={<Check className="h-4 w-4" />}
                  className="flex-1 font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                >
                  Activate
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEdit(template)}
                className="hover:bg-blue-50 hover:text-blue-700"
                title="Edit Template"
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedTemplate(template);
                  setViewModalOpen(true);
                }}
                className="hover:bg-indigo-50 hover:text-indigo-700"
                title="Preview Template"
              >
                <Eye className="h-5 w-5" />
              </Button>
              {!template.is_active && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(template.id)}
                  className="hover:bg-red-50 hover:text-red-700"
                  title="Delete Template"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !showAddForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-600" />
            Report Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Choose from default templates or create your own custom designs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {!showAddForm && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Custom
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="relative">
          <Alert type="error" title="Error">
            {error}
          </Alert>
          <button
            onClick={() => setError('')}
            className="absolute top-4 right-4 text-rose-600 hover:text-rose-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="relative">
          <Alert type="success" title="Success">
            {success}
          </Alert>
          <button
            onClick={() => setSuccess('')}
            className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                {editingId ? 'Edit Template' : 'Create Custom Template'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel} 
                leftIcon={<X className="h-4 w-4" />}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Template Name"
                  required
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., My Custom Template"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Color Scheme */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Scheme
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header & Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Header Text
                  </label>
                  <textarea
                    value={formData.header}
                    onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                    placeholder="School name, address, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Footer Text
                  </label>
                  <textarea
                    value={formData.footer}
                    onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                    placeholder="Signature lines, notes, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Layout & Style */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout & Style
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout Type</label>
                    <select
                      value={formData.layoutType}
                      onChange={e => setFormData({ ...formData, layoutType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="standard">Standard</option>
                      <option value="compact">Compact</option>
                      <option value="detailed">Detailed</option>
                      <option value="minimal">Minimal</option>
                      <option value="booklet">Booklet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Family</label>
                    <select
                      value={formData.fontFamily}
                      onChange={e => setFormData({ ...formData, fontFamily: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="sans-serif">Sans-serif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size</label>
                    <select
                      value={formData.fontSize}
                      onChange={e => setFormData({ ...formData, fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Border Style</label>
                    <select
                      value={formData.borderStyle}
                      onChange={e => setFormData({ ...formData, borderStyle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="none">None</option>
                      <option value="solid">Solid</option>
                      <option value="double">Double</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Display Options
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Show school logo', key: 'showLogo' },
                    { label: 'Show class rank', key: 'showRank' },
                    { label: 'Show attendance', key: 'showAttendance' },
                    { label: 'Show teacher comments', key: 'showComments' },
                    { label: 'Show grade scale', key: 'showGradeScale' },
                    { label: 'Show subject coefficients', key: 'showSubjectCoefficients' },
                    { label: 'Show class average', key: 'showClassAverage' },
                    { label: 'Show percentile', key: 'showPercentile' },
                    { label: 'Use cards', key: 'useCards' },
                    { label: 'Color code grades', key: 'colorCodeGrades' },
                    { label: 'Compact layout', key: 'compactLayout' },
                  ].map(opt => (
                    <CheckboxField
                      key={opt.key}
                      label={opt.label}
                      checked={formData[opt.key as keyof typeof formData] as boolean}
                      onChange={checked => setFormData({ ...formData, [opt.key]: checked })}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Display</label>
                    <select
                      value={formData.gradeDisplay}
                      onChange={e => setFormData({ ...formData, gradeDisplay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="grade_only">Grade Only</option>
                      <option value="percentage">Percentage</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Grouping</label>
                    <select
                      value={formData.subjectGrouping}
                      onChange={e => setFormData({ ...formData, subjectGrouping: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="none">None</option>
                      <option value="by_type">By Type</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Booklet/Multi-Page Options */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Booklet / Multi-Page
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Multi-page', key: 'multiPage' },
                    { label: 'Include cover page', key: 'includeCoverPage' },
                    { label: 'Include table of contents', key: 'includeTableOfContents' },
                    { label: 'Include summary page', key: 'includeSummaryPage' },
                    { label: 'Include progress charts', key: 'includeProgressCharts' },
                    { label: 'Include charts', key: 'includeCharts' },
                    { label: 'Include glossary', key: 'includeGlossary' },
                    { label: 'Page numbers', key: 'pageNumbers' },
                  ].map(opt => (
                    <CheckboxField
                      key={opt.key}
                      label={opt.label}
                      checked={formData[opt.key as keyof typeof formData] as boolean}
                      onChange={checked => setFormData({ ...formData, [opt.key]: checked })}
                    />
                  ))}
                </div>
              </div>

              {/* Watermark & Stamp */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Watermark & Stamp
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.showWatermark}
                      onChange={e => setFormData({ ...formData, showWatermark: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Show watermark</span>
                  </label>
                  {formData.showWatermark && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={formData.watermarkText}
                        onChange={e => setFormData({ ...formData, watermarkText: e.target.value })}
                        placeholder="Watermark text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={formData.watermarkOpacity}
                        onChange={e => setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Opacity"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeStamp}
                      onChange={e => setFormData({ ...formData, includeStamp: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Include official stamp</span>
                  </label>
                  {formData.includeStamp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Stamp Position</label>
                      <select
                        value={formData.stampPosition}
                        onChange={e => setFormData({ ...formData, stampPosition: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures & Digital */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Signatures & Digital
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeSignatures}
                      onChange={e => setFormData({ ...formData, includeSignatures: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Include signatures</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeDigitalSignatures}
                      onChange={e => setFormData({ ...formData, includeDigitalSignatures: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Include digital signatures</span>
                  </label>
                  {formData.includeDigitalSignatures && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Signature Fields (comma separated)</label>
                      <input
                        type="text"
                        value={formData.signatureFields.join(', ')}
                        onChange={e => setFormData({ ...formData, signatureFields: e.target.value.split(',').map(f => f.trim()).filter(Boolean) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g. Principal, Class Teacher, Parent/Guardian"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Miscellaneous */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  Miscellaneous
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Include school motto', key: 'includeSchoolMotto' },
                    { label: 'Include QR code', key: 'includeQRCode' },
                    { label: 'Show term progress', key: 'showTermProgress' },
                    { label: 'Show strengths/weaknesses', key: 'showStrengthsWeaknesses' },
                    { label: 'Show recommendations', key: 'showRecommendations' },
                    { label: 'Show attendance chart', key: 'showAttendanceChart' },
                    { label: 'Show grade distribution', key: 'showGradeDistribution' },
                  ].map(opt => (
                    <CheckboxField
                      key={opt.key}
                      label={opt.label}
                      checked={formData[opt.key as keyof typeof formData] as boolean}
                      onChange={checked => setFormData({ ...formData, [opt.key]: checked })}
                    />
                  ))}

                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={!formData.template_name}
                >
                  {editingId ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toggle Default Templates Section */}
      {defaultTemplates.length > 0 && (
        <div className="mb-6">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowDefaultTemplates((v) => !v)}
            className="mb-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
          >
            {showDefaultTemplates ? 'Hide Default Templates' : 'Show Default Templates'}
          </Button>
          {showDefaultTemplates && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Default Templates
                  </h2>
                  <p className="text-sm text-gray-500">
                    Professional templates ready to use
                  </p>
                </div>
                <Badge variant="info" className="ml-auto text-base px-3 py-1">
                  {defaultTemplates.length}
                </Badge>
              </div>
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8' 
                : 'space-y-4'
              }>
                {defaultTemplates.map((template) => renderTemplateCard(template, true))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Templates Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your Custom Templates
            </h2>
            <p className="text-sm text-gray-500">
              Templates you've created or customized
            </p>
          </div>
          <Badge variant="neutral" className="ml-auto text-base px-3 py-1">
            {customTemplates.length}
          </Badge>
        </div>
        {customTemplates.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-300 transition-colors">
            <CardContent className="p-12 lg:p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6 relative">
                  <FileText className="h-20 w-20 text-gray-300 mx-auto" />
                  <div className="absolute -top-2 -right-2 bg-indigo-100 rounded-full p-2">
                    <Plus className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  No Custom Templates Yet
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Clone a default template to customize it with your school's branding, or create a brand new template from scratch
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  leftIcon={<Plus className="h-5 w-5" />}
                  className="text-base px-6 py-3"
                >
                  Create Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8' 
            : 'space-y-4'
          }>
            {customTemplates.map((template) => renderTemplateCard(template, false))}
          </div>
        )}
      </div>

      {/* View Modal - Enhanced Report Card Preview */}
      {viewModalOpen && selectedTemplate && (
        <EnhancedTemplatePreview
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onClone={handleCloneTemplate}
          onActivate={handleActivateTemplate}
        />
      )}
    </div>
  );
}
