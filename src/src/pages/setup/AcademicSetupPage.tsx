import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Check, ChevronRight, ChevronLeft, Calendar, Clock, Layers, BookOpen, Plus, Trash2 } from 'lucide-react';
export function AcademicSetupPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Data States
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  // Form States
  const [newYear, setNewYear] = useState({
    name: '',
    start: '',
    end: ''
  });
  const [newTerm, setNewTerm] = useState({
    name: '',
    start: '',
    end: '',
    yearId: ''
  });
  const [newSequence, setNewSequence] = useState({
    name: '',
    dueDate: '',
    termId: ''
  });
  const [newClass, setNewClass] = useState({
    name: '',
    description: ''
  });
  // Fetch all data on mount and when step changes
  useEffect(() => {
    if (user?.school_id) {
      fetchAllData();
    }
  }, [user?.school_id]);
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const schoolId = user?.school_id;
      // Fetch years
      const {
        data: yearsData
      } = await supabase.from('academic_years').select('*').eq('school_id', schoolId).order('start_date', {
        ascending: false
      });
      setYears(yearsData || []);
      // Fetch terms
      const {
        data: termsData
      } = await supabase.from('terms').select('*, academic_years!inner(school_id)').eq('academic_years.school_id', schoolId).order('start_date', {
        ascending: false
      });
      setTerms(termsData || []);
      // Fetch sequences
      const {
        data: sequencesData
      } = await supabase.from('sequences').select('*, terms!inner(academic_years!inner(school_id))').eq('terms.academic_years.school_id', schoolId);
      setSequences(sequencesData || []);
      // Fetch classes
      const {
        data: classesData
      } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name');
      setClasses(classesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  const handleAddYear = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        error
      } = await supabase.from('academic_years').insert({
        school_id: user?.school_id,
        year_name: newYear.name,
        start_date: newYear.start,
        end_date: newYear.end
      });
      if (error) throw error;
      setNewYear({
        name: '',
        start: '',
        end: ''
      });
      fetchAllData();
      setSuccess('Academic year added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAddTerm = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        error
      } = await supabase.from('terms').insert({
        academic_year_id: newTerm.yearId,
        name: newTerm.name,
        start_date: newTerm.start,
        end_date: newTerm.end
      });
      if (error) throw error;
      setNewTerm({
        ...newTerm,
        name: '',
        start: '',
        end: ''
      });
      fetchAllData();
      setSuccess('Term added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAddSequence = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        error
      } = await supabase.from('sequences').insert({
        term_id: newSequence.termId,
        name: newSequence.name,
        due_date: newSequence.dueDate || null
      });
      if (error) throw error;
      setNewSequence({
        ...newSequence,
        name: '',
        dueDate: ''
      });
      fetchAllData();
      setSuccess('Sequence added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAddClass = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        error
      } = await supabase.from('classes').insert({
        school_id: user?.school_id,
        name: newClass.name,
        description: newClass.description
      });
      if (error) throw error;
      setNewClass({
        name: '',
        description: ''
      });
      fetchAllData();
      setSuccess('Class added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure? This will delete related data.')) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
      setSuccess('Deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const steps = [{
    number: 1,
    title: 'Years',
    icon: Calendar
  }, {
    number: 2,
    title: 'Terms',
    icon: Clock
  }, {
    number: 3,
    title: 'Sequences',
    icon: Layers
  }, {
    number: 4,
    title: 'Classes',
    icon: BookOpen
  }];
  return <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Setup</h1>
        <p className="text-slate-500 mt-1">
          Configure your school's academic structure
        </p>
      </div>

      {/* Progress Steps - Responsive */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[600px] md:min-w-0">
          {steps.map((s, idx) => <div key={s.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors
                ${step === s.number ? 'bg-blue-600 text-white' : step > s.number ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > s.number ? <Check className="w-5 h-5" /> : s.number}
              </div>
              <span className={`ml-2 text-xs md:text-sm font-medium ${step === s.number ? 'text-blue-600' : 'text-slate-500'}`}>
                {s.title}
              </span>
              {idx < steps.length - 1 && <div className="w-8 md:w-12 h-0.5 bg-slate-200 mx-2 md:mx-4" />}
            </div>)}
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      <Card className="p-4 md:p-6">
        {/* Step 1: Academic Years */}
        {step === 1 && <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Academic Years
            </h3>

            <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg">
              <Input label="Year Name" placeholder="e.g. 2023-2024" value={newYear.name} onChange={e => setNewYear({
            ...newYear,
            name: e.target.value
          })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input type="date" label="Start Date" value={newYear.start} onChange={e => setNewYear({
              ...newYear,
              start: e.target.value
            })} />
                <Input type="date" label="End Date" value={newYear.end} onChange={e => setNewYear({
              ...newYear,
              end: e.target.value
            })} />
              </div>
              <Button variant="primary" onClick={handleAddYear} disabled={!newYear.name || !newYear.start || !newYear.end || loading} leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
                Add Year
              </Button>
            </div>

            <div className="space-y-2">
              {years.map(year => <div key={year.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-900 block">
                      {year.year_name}
                    </span>
                    <span className="text-sm text-slate-500">
                      {new Date(year.start_date).toLocaleDateString()} -{' '}
                      {new Date(year.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => handleDelete('academic_years', year.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                    Delete
                  </Button>
                </div>)}
              {years.length === 0 && <p className="text-center text-slate-500 py-8">
                  No academic years found. Add one to get started.
                </p>}
            </div>
          </div>}

        {/* Step 2: Terms */}
        {step === 2 && <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Terms
            </h3>

            {years.length === 0 ? <Alert variant="warning" title="No Academic Years" message="Please create an academic year first before adding terms." /> : <>
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Academic Year
                    </label>
                    <Select value={newTerm.yearId} onValueChange={value => setNewTerm({
                ...newTerm,
                yearId: value
              })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y.id} value={y.id}>
                            {y.year_name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input label="Term Name" placeholder="e.g. Term 1" value={newTerm.name} onChange={e => setNewTerm({
              ...newTerm,
              name: e.target.value
            })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input type="date" label="Start Date" value={newTerm.start} onChange={e => setNewTerm({
                ...newTerm,
                start: e.target.value
              })} />
                    <Input type="date" label="End Date" value={newTerm.end} onChange={e => setNewTerm({
                ...newTerm,
                end: e.target.value
              })} />
                  </div>
                  <Button variant="primary" onClick={handleAddTerm} disabled={!newTerm.yearId || !newTerm.name || !newTerm.start || !newTerm.end || loading} leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
                    Add Term
                  </Button>
                </div>

                <div className="space-y-2">
                  {terms.map(term => {
              const yearName = years.find(y => y.id === term.academic_year_id)?.year_name;
              return <div key={term.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg">
                        <div>
                          <span className="font-medium text-slate-900 block">
                            {term.name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {yearName} •{' '}
                            {new Date(term.start_date).toLocaleDateString()} -{' '}
                            {new Date(term.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <Button size="sm" variant="danger" onClick={() => handleDelete('terms', term.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                          Delete
                        </Button>
                      </div>;
            })}
                  {terms.length === 0 && <p className="text-center text-slate-500 py-8">
                      No terms found.
                    </p>}
                </div>
              </>}
          </div>}

        {/* Step 3: Sequences */}
        {step === 3 && <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Sequences
            </h3>

            {terms.length === 0 ? <Alert variant="warning" title="No Terms" message="Please create terms first before adding sequences." /> : <>
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Term
                    </label>
                    <Select value={newSequence.termId} onValueChange={value => setNewSequence({
                ...newSequence,
                termId: value
              })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map(t => <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Sequence Name" placeholder="e.g. Mid-Term" value={newSequence.name} onChange={e => setNewSequence({
                ...newSequence,
                name: e.target.value
              })} />
                    <Input type="date" label="Due Date (Optional)" value={newSequence.dueDate} onChange={e => setNewSequence({
                ...newSequence,
                dueDate: e.target.value
              })} />
                  </div>
                  <Button variant="primary" onClick={handleAddSequence} disabled={!newSequence.termId || !newSequence.name || loading} leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
                    Add Sequence
                  </Button>
                </div>

                <div className="space-y-2">
                  {sequences.map(seq => {
              const termName = terms.find(t => t.id === seq.term_id)?.name;
              return <div key={seq.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg">
                        <div>
                          <span className="font-medium text-slate-900 block">
                            {seq.name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {termName}
                            {seq.due_date && ` • Due: ${new Date(seq.due_date).toLocaleDateString()}`}
                          </span>
                        </div>
                        <Button size="sm" variant="danger" onClick={() => handleDelete('sequences', seq.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                          Delete
                        </Button>
                      </div>;
            })}
                  {sequences.length === 0 && <p className="text-center text-slate-500 py-8">
                      No sequences found.
                    </p>}
                </div>
              </>}
          </div>}

        {/* Step 4: Classes */}
        {step === 4 && <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Classes
            </h3>

            <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg">
              <Input label="Class Name" placeholder="e.g. Grade 1" value={newClass.name} onChange={e => setNewClass({
            ...newClass,
            name: e.target.value
          })} />
              <Input label="Description (Optional)" placeholder="Optional description" value={newClass.description} onChange={e => setNewClass({
            ...newClass,
            description: e.target.value
          })} />
              <Button variant="primary" onClick={handleAddClass} disabled={!newClass.name || loading} leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
                Add Class
              </Button>
            </div>

            <div className="space-y-2">
              {classes.map(cls => <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-900 block">
                      {cls.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      {cls.description || 'No description'}
                    </span>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => handleDelete('classes', cls.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                    Delete
                  </Button>
                </div>)}
              {classes.length === 0 && <p className="text-center text-slate-500 py-8">
                  No classes found.
                </p>}
            </div>
          </div>}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-slate-200">
          <Button variant="secondary" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} leftIcon={<ChevronLeft className="w-4 h-4" />} className="w-full sm:w-auto">
            Previous
          </Button>
          <Button variant="primary" onClick={() => setStep(Math.min(4, step + 1))} disabled={step === 4} rightIcon={step < 4 ? <ChevronRight className="w-4 h-4" /> : undefined} className="w-full sm:w-auto">
            {step === 4 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>;
}