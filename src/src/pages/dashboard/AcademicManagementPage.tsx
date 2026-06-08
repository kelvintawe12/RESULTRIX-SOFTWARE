import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Clock, Layers, BookOpen, Edit, Trash2, CheckCircle, Star, Eye, Users, GraduationCap, DollarSign, Zap, Info, AlertCircle, PlayCircle, Database, Settings } from 'lucide-react';
export function AcademicManagementPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewClassModalOpen, setViewClassModalOpen] = useState(false);
  const [editType, setEditType] = useState<'year' | 'term' | 'sequence' | 'class' | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStats, setClassStats] = useState<any>(null);
  const [triggerStatus, setTriggerStatus] = useState<any>(null);
  const [testingTrigger, setTestingTrigger] = useState(false);
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [yearsData, termsData, sequencesData, classesData, schoolData] = await Promise.all([supabase.from('academic_years').select('*').eq('school_id', user?.school_id).order('start_date', {
        ascending: false
      }), supabase.from('terms').select('*, academic_years!inner(school_id)').eq('academic_years.school_id', user?.school_id).order('start_date', {
        ascending: false
      }), supabase.from('sequences').select('*, terms!inner(academic_years!inner(school_id))').eq('terms.academic_years.school_id', user?.school_id), supabase.from('classes').select('*').eq('school_id', user?.school_id).order('name'), supabase.from('schools').select('*').eq('id', user?.school_id).maybeSingle()]);
      if (yearsData.error) throw yearsData.error;
      if (termsData.error) throw termsData.error;
      if (sequencesData.error) throw sequencesData.error;
      if (classesData.error) throw classesData.error;
      setYears(yearsData.data || []);
      setTerms(termsData.data || []);
      setSequences(sequencesData.data || []);
      setClasses(classesData.data || []);
      // `auto_update_periods` may not exist on older schemas; default to false.
      setSchoolSettings(schoolData.data ? { auto_update_periods: false, ...schoolData.data } : { auto_update_periods: false });
      calculateTriggerStatus(yearsData.data, termsData.data, sequencesData.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const calculateTriggerStatus = (years: any[], terms: any[], sequences: any[]) => {
    const now = new Date();
    const currentYear = years.find(y => y.is_current);
    const currentTerm = terms.find(t => t.is_current);
    // Find what would be next
    const upcomingYear = years.find(y => !y.is_current && new Date(y.start_date) > now);
    const upcomingTerm = terms.find(t => !t.is_current && new Date(t.start_date) > now);
    // Check if current periods are ending soon
    const yearEndingSoon = currentYear && new Date(currentYear.end_date) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const termEndingSoon = currentTerm && new Date(currentTerm.end_date) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setTriggerStatus({
      currentYear,
      currentTerm,
      upcomingYear,
      upcomingTerm,
      yearEndingSoon,
      termEndingSoon,
      hasUpcomingTransitions: upcomingYear || upcomingTerm
    });
  };
  const handleTestTrigger = async () => {
    try {
      setTestingTrigger(true);
      setError('');
      // Simulate what would happen if trigger ran now
      const now = new Date();
      let changes = [];
      // Check years
      const expiredYear = years.find(y => y.is_current && new Date(y.end_date) < now);
      if (expiredYear) {
        const nextYear = years.find(y => !y.is_current && new Date(y.start_date) <= now);
        if (nextYear) {
          changes.push(`Year: ${expiredYear.year_name} → ${nextYear.year_name}`);
        }
      }
      // Check terms
      const expiredTerm = terms.find(t => t.is_current && new Date(t.end_date) < now);
      if (expiredTerm) {
        const nextTerm = terms.find(t => !t.is_current && new Date(t.start_date) <= now);
        if (nextTerm) {
          changes.push(`Term: ${expiredTerm.name} → ${nextTerm.name}`);
        }
      }
      if (changes.length > 0) {
        setSuccess(`Trigger would make these changes:\n${changes.join('\n')}`);
      } else {
        setSuccess('No changes needed - all periods are current');
      }
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to test trigger');
    } finally {
      setTestingTrigger(false);
    }
  };
  const handleToggleAutoUpdate = async (enabled: boolean) => {
    // Optimistically update the UI so the toggle is responsive.
    setSchoolSettings((prev: any) => ({ ...prev, auto_update_periods: enabled }));
    try {
      const {
        error
      } = await supabase.from('schools').update({
        auto_update_periods: enabled
      }).eq('id', user?.school_id);
      if (error) throw error;
      setSuccess(`Auto-update ${enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      // Revert on failure (e.g. the column hasn't been migrated yet).
      setSchoolSettings((prev: any) => ({ ...prev, auto_update_periods: !enabled }));
      const missingColumn = /auto_update_periods/.test(err?.message || '') || err?.code === '42703' || err?.code === 'PGRST204';
      setError(
        missingColumn
          ? 'Auto-update is not enabled on this database yet. Run the add-auto-update-periods.sql migration to enable it.'
          : err.message || 'Failed to update auto-update setting'
      );
      setTimeout(() => setError(''), 6000);
    }
  };
  const handleSetCurrent = async (type: 'year' | 'term' | 'sequence', id: string, currentValue: boolean) => {
    try {
      setError('');
      if (type === 'year') {
        const {
          error
        } = await supabase.rpc('set_current_academic_year', {
          p_year_id: id
        });
        if (error) throw error;
      } else if (type === 'term') {
        const {
          error
        } = await supabase.rpc('set_current_term', {
          p_term_id: id
        });
        if (error) throw error;
      } else if (type === 'sequence') {
        const {
          error
        } = await supabase.from('sequences').update({
          is_current: !currentValue
        }).eq('id', id);
        if (error) throw error;
      }
      setSuccess(`Current ${type} ${currentValue ? 'unset' : 'set'} successfully`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error setting current:', err);
      setError(err.message || 'Failed to set current period');
    }
  };
  const handleEdit = (type: 'year' | 'term' | 'sequence' | 'class', item: any) => {
    setEditType(type);
    setEditItem(item);
    setEditModalOpen(true);
  };
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      let table = '';
      let updateData: any = {};
      if (editType === 'year') {
        table = 'academic_years';
        updateData = {
          year_name: editItem.year_name,
          start_date: editItem.start_date,
          end_date: editItem.end_date
        };
      } else if (editType === 'term') {
        table = 'terms';
        updateData = {
          name: editItem.name,
          start_date: editItem.start_date,
          end_date: editItem.end_date
        };
      } else if (editType === 'sequence') {
        table = 'sequences';
        updateData = {
          name: editItem.name,
          due_date: editItem.due_date
        };
      } else if (editType === 'class') {
        table = 'classes';
        updateData = {
          name: editItem.name,
          description: editItem.description
        };
      }
      const {
        error
      } = await supabase.from(table).update(updateData).eq('id', editItem.id);
      if (error) throw error;
      setSuccess('Updated successfully');
      setEditModalOpen(false);
      setEditItem(null);
      setEditType(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (type: 'year' | 'term' | 'sequence' | 'class', id: string) => {
    if (!confirm('Are you sure? This will delete related data.')) return;
    try {
      setLoading(true);
      let table = '';
      if (type === 'year') table = 'academic_years';else if (type === 'term') table = 'terms';else if (type === 'sequence') table = 'sequences';else if (type === 'class') table = 'classes';
      const {
        error
      } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setSuccess('Deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };
  const handleViewClass = async (cls: any) => {
    try {
      setSelectedClass(cls);
      setViewClassModalOpen(true);
      const [studentsData, teachersData, subjectsData, feesData] = await Promise.all([supabase.from('students').select('id, full_name, admission_number').eq('class_id', cls.id).eq('school_id', user?.school_id), supabase.from('teacher_assignments').select('teacher_id, teachers!inner(full_name)').eq('class_id', cls.id), supabase.from('subjects').select('id, name').eq('class_id', cls.id), supabase.from('fee_structures').select('amount').eq('class_id', cls.id)]);
      const totalFees = feesData.data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      setClassStats({
        totalStudents: studentsData.data?.length || 0,
        students: studentsData.data || [],
        totalTeachers: teachersData.data?.length || 0,
        teachers: teachersData.data || [],
        totalSubjects: subjectsData.data?.length || 0,
        subjects: subjectsData.data || [],
        totalFees
      });
    } catch (err) {
      console.error('Error fetching class details:', err);
    }
  };
  const currentYear = years.find(y => y.is_current);
  const currentTerm = terms.find(t => t.is_current);
  const currentSequences = sequences.filter(s => s.is_current);
  if (loading && years.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Academic Management
          </h1>
          <p className="text-gray-500">
            Manage all academic periods and set current active periods
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/grading-setup')} leftIcon={<Settings className="h-4 w-4" />}>
          Grading System Setup
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {/* Auto-Update Settings */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Auto-Update Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Checkbox id="auto-update" checked={schoolSettings?.auto_update_periods || false} onCheckedChange={handleToggleAutoUpdate} />
            <div className="flex-1">
              <label htmlFor="auto-update" className="text-sm font-medium text-gray-900 cursor-pointer">
                Enable automatic period updates based on end dates
              </label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, the system will automatically set the next
                year/term/sequence as current when the current one's end date
                passes.
              </p>
              <div className="flex items-start gap-2 mt-2 p-3 bg-blue-100 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900">
                  <strong>How it works:</strong> The system checks daily at
                  midnight. When a period ends, it automatically activates the
                  next chronological period.
                </p>
              </div>
            </div>
          </div>

          {/* Trigger Status Section */}
          {triggerStatus && <div className="border-t border-blue-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Automation Status
                </h4>
                <Button size="sm" variant="outline" onClick={handleTestTrigger} isLoading={testingTrigger} leftIcon={<PlayCircle className="h-4 w-4" />}>
                  Test Trigger
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Current Year Status */}
                <div className={`p-3 rounded-lg border ${triggerStatus.yearEndingSoon ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Academic Year
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {triggerStatus.currentYear?.year_name || 'Not Set'}
                  </p>
                  {triggerStatus.yearEndingSoon && <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-700">
                        Ending in &lt;7 days
                      </span>
                    </div>}
                  {triggerStatus.upcomingYear && <p className="text-xs text-gray-500 mt-1">
                      Next: {triggerStatus.upcomingYear.year_name}
                    </p>}
                </div>

                {/* Current Term Status */}
                <div className={`p-3 rounded-lg border ${triggerStatus.termEndingSoon ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Current Term
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {triggerStatus.currentTerm?.name || 'Not Set'}
                  </p>
                  {triggerStatus.termEndingSoon && <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-700">
                        Ending in &lt;7 days
                      </span>
                    </div>}
                  {triggerStatus.upcomingTerm && <p className="text-xs text-gray-500 mt-1">
                      Next: {triggerStatus.upcomingTerm.name}
                    </p>}
                </div>
              </div>

              {!triggerStatus.hasUpcomingTransitions && <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        No upcoming periods configured
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Create future academic years and terms to enable
                        automatic transitions.
                      </p>
                    </div>
                  </div>
                </div>}
            </div>}
        </CardContent>
      </Card>

      {/* Current Periods Overview - Green Highlighted */}
      <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-green-600" />
            Current Active Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-700" />
                <p className="text-sm font-medium text-green-900">
                  Current Year
                </p>
              </div>
              <p className="text-lg font-bold text-green-900">
                {currentYear?.year_name || 'Not Set'}
              </p>
              {currentYear && <p className="text-xs text-green-700 mt-1">
                  {new Date(currentYear.start_date).toLocaleDateString()} -{' '}
                  {new Date(currentYear.end_date).toLocaleDateString()}
                </p>}
            </div>

            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-700" />
                <p className="text-sm font-medium text-green-900">
                  Current Term
                </p>
              </div>
              <p className="text-lg font-bold text-green-900">
                {currentTerm?.name || 'Not Set'}
              </p>
              {currentTerm && <p className="text-xs text-green-700 mt-1">
                  {new Date(currentTerm.start_date).toLocaleDateString()} -{' '}
                  {new Date(currentTerm.end_date).toLocaleDateString()}
                </p>}
            </div>

            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-green-700" />
                <p className="text-sm font-medium text-green-900">
                  Current Sequences
                </p>
              </div>
              <p className="text-lg font-bold text-green-900">
                {currentSequences.length > 0 ? currentSequences.map(s => s.name).join(', ') : 'None Set'}
              </p>
              {currentSequences.length > 0 && <p className="text-xs text-green-700 mt-1">
                  {currentSequences.length} active
                </p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Years */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years ({years.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {years.map(year => <div key={year.id} className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${year.is_current ? 'bg-green-50 border-green-300 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${year.is_current ? 'text-green-900' : 'text-gray-900'}`}>
                      {year.year_name}
                    </p>
                    {year.is_current && <Badge className="bg-green-600 text-white flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Current
                      </Badge>}
                  </div>
                  <p className={`text-sm ${year.is_current ? 'text-green-700' : 'text-gray-500'}`}>
                    {new Date(year.start_date).toLocaleDateString()} -{' '}
                    {new Date(year.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={year.is_current ? 'secondary' : 'outline'} onClick={() => handleSetCurrent('year', year.id, year.is_current)} leftIcon={<CheckCircle className="h-4 w-4" />}>
                    {year.is_current ? 'Unset Current' : 'Set Current'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit('year', year)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete('year', year.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>)}
            {years.length === 0 && <p className="text-center text-gray-500 py-8">
                No academic years found
              </p>}
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Terms ({terms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {terms.map(term => {
            const yearName = years.find(y => y.id === term.academic_year_id)?.year_name;
            return <div key={term.id} className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${term.is_current ? 'bg-green-50 border-green-300 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${term.is_current ? 'text-green-900' : 'text-gray-900'}`}>
                        {term.name}
                      </p>
                      {term.is_current && <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Current
                        </Badge>}
                    </div>
                    <p className={`text-sm ${term.is_current ? 'text-green-700' : 'text-gray-500'}`}>
                      {yearName} •{' '}
                      {new Date(term.start_date).toLocaleDateString()} -{' '}
                      {new Date(term.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={term.is_current ? 'secondary' : 'outline'} onClick={() => handleSetCurrent('term', term.id, term.is_current)} leftIcon={<CheckCircle className="h-4 w-4" />}>
                      {term.is_current ? 'Unset Current' : 'Set Current'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit('term', term)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete('term', term.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>;
          })}
            {terms.length === 0 && <p className="text-center text-gray-500 py-8">No terms found</p>}
          </div>
        </CardContent>
      </Card>

      {/* Sequences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Sequences ({sequences.length})
            <Badge variant="secondary" className="ml-2">
              Multiple can be current
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sequences.map(seq => {
            const termName = terms.find(t => t.id === seq.term_id)?.name;
            return <div key={seq.id} className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${seq.is_current ? 'bg-green-50 border-green-300 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${seq.is_current ? 'text-green-900' : 'text-gray-900'}`}>
                        {seq.name}
                      </p>
                      {seq.is_current && <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Current
                        </Badge>}
                    </div>
                    <p className={`text-sm ${seq.is_current ? 'text-green-700' : 'text-gray-500'}`}>
                      {termName}
                      {seq.due_date && ` • Due: ${new Date(seq.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant={seq.is_current ? 'secondary' : 'outline'} onClick={() => handleSetCurrent('sequence', seq.id, seq.is_current)} leftIcon={<CheckCircle className="h-4 w-4" />}>
                      {seq.is_current ? 'Unset Current' : 'Set Current'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit('sequence', seq)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete('sequence', seq.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>;
          })}
            {sequences.length === 0 && <p className="text-center text-gray-500 py-8">
                No sequences found
              </p>}
          </div>
        </CardContent>
      </Card>

      {/* Classes - keeping existing implementation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Classes ({classes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => <div key={cls.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {cls.description || 'No description provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button size="sm" variant="outline" onClick={() => handleViewClass(cls)} leftIcon={<Eye className="h-4 w-4" />}>
                    View Details
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit('class', cls)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete('class', cls.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>)}
            {classes.length === 0 && <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No classes found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Classes will appear here once created
                </p>
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal - keeping existing implementation */}
      {editModalOpen && editItem && <Dialog isOpen={editModalOpen} onClose={() => {
      setEditModalOpen(false);
      setEditItem(null);
      setEditType(null);
    }} title={`Edit ${editType}`} size="md">
          <div className="space-y-4">
            {editType === 'year' && <>
                <Input label="Year Name" value={editItem.year_name} onChange={e => setEditItem({
            ...editItem,
            year_name: e.target.value
          })} />
                <Input type="date" label="Start Date" value={editItem.start_date} onChange={e => setEditItem({
            ...editItem,
            start_date: e.target.value
          })} />
                <Input type="date" label="End Date" value={editItem.end_date} onChange={e => setEditItem({
            ...editItem,
            end_date: e.target.value
          })} />
              </>}
            {editType === 'term' && <>
                <Input label="Term Name" value={editItem.name} onChange={e => setEditItem({
            ...editItem,
            name: e.target.value
          })} />
                <Input type="date" label="Start Date" value={editItem.start_date} onChange={e => setEditItem({
            ...editItem,
            start_date: e.target.value
          })} />
                <Input type="date" label="End Date" value={editItem.end_date} onChange={e => setEditItem({
            ...editItem,
            end_date: e.target.value
          })} />
              </>}
            {editType === 'sequence' && <>
                <Input label="Sequence Name" value={editItem.name} onChange={e => setEditItem({
            ...editItem,
            name: e.target.value
          })} />
                <Input type="date" label="Due Date" value={editItem.due_date || ''} onChange={e => setEditItem({
            ...editItem,
            due_date: e.target.value
          })} />
              </>}
            {editType === 'class' && <>
                <Input label="Class Name" value={editItem.name} onChange={e => setEditItem({
            ...editItem,
            name: e.target.value
          })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea value={editItem.description || ''} onChange={e => setEditItem({
              ...editItem,
              description: e.target.value
            })} rows={4} placeholder="Enter a detailed description of this class, including grade level, curriculum focus, and any special characteristics..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
            setEditModalOpen(false);
            setEditItem(null);
            setEditType(null);
          }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </Dialog>}

      {/* Class Details Modal - keeping existing implementation */}
      {viewClassModalOpen && selectedClass && <Dialog isOpen={viewClassModalOpen} onClose={() => {
      setViewClassModalOpen(false);
      setSelectedClass(null);
      setClassStats(null);
    }} title={selectedClass.name} size="lg">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Description
              </label>
              <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                {selectedClass.description || 'No description provided for this class.'}
              </p>
            </div>

            {classStats && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">
                      Students
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {classStats.totalStudents}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      Teachers
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {classStats.totalTeachers}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">
                      Subjects
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {classStats.totalSubjects}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">
                      Total Fees
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(classStats.totalFees)}
                  </p>
                </div>
              </div>}

            {classStats && <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students ({classStats.totalStudents})
                  </h4>
                  {classStats.students.length > 0 ? <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="divide-y">
                        {classStats.students.map((student: any) => <div key={student.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {student.full_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {student.admission_number}
                            </span>
                          </div>)}
                      </div>
                    </div> : <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                      No students enrolled yet
                    </p>}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Teachers ({classStats.totalTeachers})
                  </h4>
                  {classStats.teachers.length > 0 ? <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="divide-y">
                        {classStats.teachers.map((teacher: any) => <div key={teacher.teacher_id} className="p-3 hover:bg-gray-50">
                            <span className="font-medium text-gray-900">
                              {teacher.teachers.full_name}
                            </span>
                          </div>)}
                      </div>
                    </div> : <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                      No teachers assigned yet
                    </p>}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subjects ({classStats.totalSubjects})
                  </h4>
                  {classStats.subjects.length > 0 ? <div className="flex flex-wrap gap-2">
                      {classStats.subjects.map((subject: any) => <Badge key={subject.id} variant="secondary">
                          {subject.name}
                        </Badge>)}
                    </div> : <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                      No subjects configured yet
                    </p>}
                </div>
              </div>}

            {!classStats && <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>}
          </div>
        </Dialog>}
    </div>;
}