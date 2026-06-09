import React, { useEffect, useMemo, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Checkbox } from '../../components/ui/Checkbox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ArrowUpCircle, ArrowRight, RotateCcw, GraduationCap, Users, CheckCircle } from 'lucide-react';

type PromotionAction = 'promote' | 'repeat' | 'graduate';

export function StudentPromotionPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Source selection
  const [sourceClassId, setSourceClassId] = useState('');
  const [sourceYearId, setSourceYearId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action + target
  const [action, setAction] = useState<PromotionAction>('promote');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.school_id) fetchMeta();
  }, [user?.school_id]);

  const fetchMeta = async () => {
    try {
      setLoading(true);
      const [classesRes, yearsRes] = await Promise.all([
        supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name'),
        supabase.from('academic_years').select('id, year_name, is_current').eq('school_id', user?.school_id).order('start_date', { ascending: false })
      ]);
      if (classesRes.error) throw classesRes.error;
      setClasses(classesRes.data || []);
      const yrs = yearsRes.data || [];
      setYears(yrs);
      // Default source year to the current one when available.
      const current = yrs.find((y: any) => y.is_current);
      if (current) setSourceYearId(current.id);
    } catch (err: any) {
      console.error('Error loading promotion data:', err);
      setError('Failed to load classes and academic years.');
    } finally {
      setLoading(false);
    }
  };

  // Load students whenever source class (and optionally year) changes.
  useEffect(() => {
    if (sourceClassId) fetchStudents();
    else {
      setStudents([]);
      setSelectedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceClassId, sourceYearId]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setError(null);
      let query = supabase
        .from('students')
        .select('id, full_name, admission_number, gender')
        .eq('school_id', user?.school_id)
        .eq('class_id', sourceClassId)
        .order('full_name');
      if (sourceYearId) query = query.eq('academic_year_id', sourceYearId);
      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
      // Pre-select everyone for convenience; admin can deselect.
      setSelectedIds(new Set((data || []).map((s: any) => s.id)));
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError('Failed to load students for this class.');
      setStudents([]);
      setSelectedIds(new Set());
    } finally {
      setLoadingStudents(false);
    }
  };

  const classOptions = useMemo(() => classes.map(c => ({ value: c.id, label: c.name })), [classes]);
  const yearOptions = useMemo(
    () => years.map(y => ({ value: y.id, label: y.year_name + (y.is_current ? ' (current)' : '') })),
    [years]
  );
  const targetClassOptions = useMemo(
    () => classes.filter(c => action !== 'promote' || c.id !== sourceClassId).map(c => ({ value: c.id, label: c.name })),
    [classes, action, sourceClassId]
  );

  const allSelected = students.length > 0 && selectedIds.size === students.length;
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(students.map(s => s.id)));
  const toggleOne = (sid: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(sid) ? next.delete(sid) : next.add(sid);
      return next;
    });

  // Resolve the effective destination class/year for the chosen action.
  const effectiveTargetClassId =
    action === 'repeat' ? sourceClassId : targetClassId;
  const effectiveTargetYearId =
    action === 'graduate' ? sourceYearId : targetYearId;

  const targetReady = useMemo(() => {
    if (selectedIds.size === 0) return false;
    if (action === 'promote') return !!targetClassId && !!targetYearId;
    if (action === 'repeat') return !!targetYearId; // same class, new year
    if (action === 'graduate') return !!targetClassId; // graduating/alumni class
    return false;
  }, [action, selectedIds.size, targetClassId, targetYearId]);

  const name = (list: any[], idKey: string, id: string, labelKey: string) =>
    list.find(x => x[idKey] === id)?.[labelKey] || '—';
  const sourceClassName = name(classes, 'id', sourceClassId, 'name');
  const sourceYearName = name(years, 'id', sourceYearId, 'year_name');
  const targetClassName = name(classes, 'id', effectiveTargetClassId, 'name');
  const targetYearName = name(years, 'id', effectiveTargetYearId, 'year_name');

  const handleConfirm = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      const ids = Array.from(selectedIds);
      if (!ids.length) throw new Error('Select at least one student.');

      // Build the update payload per action.
      const update: Record<string, any> = {};
      if (action === 'promote') {
        if (!targetClassId || !targetYearId) throw new Error('Choose a target class and academic year.');
        update.class_id = targetClassId;
        update.academic_year_id = targetYearId;
      } else if (action === 'repeat') {
        if (!targetYearId) throw new Error('Choose the academic year to repeat into.');
        update.class_id = sourceClassId; // same class
        update.academic_year_id = targetYearId;
      } else {
        // graduate
        if (!targetClassId) throw new Error('Choose a graduating/alumni class.');
        update.class_id = targetClassId;
      }

      const { error: updateError } = await supabase.from('students').update(update).in('id', ids);
      if (updateError) throw updateError;

      // Best-effort audit log.
      try {
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          school_id: user?.school_id,
          action_type: 'student_promotion',
          details: {
            action,
            count: ids.length,
            from_class_id: sourceClassId,
            from_class: sourceClassName,
            from_year_id: sourceYearId || null,
            from_year: sourceYearName,
            to_class_id: update.class_id ?? sourceClassId,
            to_class: name(classes, 'id', update.class_id ?? sourceClassId, 'name'),
            to_year_id: update.academic_year_id ?? null,
            student_ids: ids
          }
        });
      } catch (auditErr) {
        console.warn('Audit log for promotion failed (non-blocking):', auditErr);
      }

      const verb = action === 'promote' ? 'promoted' : action === 'repeat' ? 'set to repeat' : 'graduated';
      setSuccess(`${ids.length} student${ids.length === 1 ? '' : 's'} ${verb} successfully.`);
      // Refresh the source list (moved students should drop off).
      await fetchStudents();
      setTargetClassId('');
    } catch (err: any) {
      console.error('Error processing promotion:', err);
      setError(err.message || 'Failed to process promotion.');
    } finally {
      setProcessing(false);
    }
  };

  const actionMeta: Record<PromotionAction, { icon: React.ReactNode; label: string; desc: string }> = {
    promote: { icon: <ArrowUpCircle className="w-5 h-5" />, label: 'Promote', desc: 'Move to a new class & academic year' },
    repeat: { icon: <RotateCcw className="w-5 h-5" />, label: 'Repeat', desc: 'Keep same class in a new academic year' },
    graduate: { icon: <GraduationCap className="w-5 h-5" />, label: 'Graduate', desc: 'Move to a graduating / alumni class' }
  };

  const columns = [
    {
      header: '',
      accessor: 'select',
      className: 'w-12',
      render: (row: any) => (
        <Checkbox checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)} />
      )
    },
    {
      header: 'Student',
      accessor: 'full_name',
      render: (row: any) => (
        <div>
          <div className="font-medium text-slate-900">{row.full_name}</div>
          <div className="text-xs text-slate-500 font-mono">{row.admission_number || 'No ID'}</div>
        </div>
      )
    },
    {
      header: 'Gender',
      accessor: 'gender',
      render: (row: any) => <span className="capitalize text-slate-600">{row.gender || '—'}</span>
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Promotion</h1>
        <p className="text-slate-500 mt-1">Promote, repeat, or graduate students in bulk at the end of a term or year.</p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}
      {success && <Alert variant="success" title="Done" message={success} />}

      {/* Step 1: Source */}
      <Card title="1. Select Source Class">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Select label="Source Class" value={sourceClassId} onChange={e => setSourceClassId(e.target.value)} options={classOptions} placeholder="Select a class…" />
          <Select label="Academic Year" value={sourceYearId} onChange={e => setSourceYearId(e.target.value)} options={yearOptions} placeholder="All years" />
        </div>
      </Card>

      {/* Step 2: Students */}
      {sourceClassId && (
        <Card title="2. Select Students" className="overflow-hidden">
          {loadingStudents ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : students.length ? (
            <div>
              <div className="flex items-center justify-between px-1 pb-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                  Select all
                </label>
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1 inline" />
                  {selectedIds.size} of {students.length} selected
                </Badge>
              </div>
              <Table data={students} columns={columns} />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No students found for this class{sourceYearId ? ' and year' : ''}.</div>
          )}
        </Card>
      )}

      {/* Step 3: Action */}
      {sourceClassId && students.length > 0 && (
        <Card title="3. Choose Action">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {(Object.keys(actionMeta) as PromotionAction[]).map(a => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAction(a);
                  setTargetClassId('');
                }}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  action === a ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  {actionMeta[a].icon}
                  {actionMeta[a].label}
                </div>
                <p className="text-xs text-slate-500 mt-1">{actionMeta[a].desc}</p>
              </button>
            ))}
          </div>

          {/* Target selectors depend on action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {(action === 'promote' || action === 'graduate') && (
              <Select
                label={action === 'graduate' ? 'Graduating / Alumni Class' : 'Target Class'}
                value={targetClassId}
                onChange={e => setTargetClassId(e.target.value)}
                options={targetClassOptions}
                placeholder="Select a class…"
              />
            )}
            {(action === 'promote' || action === 'repeat') && (
              <Select
                label="Target Academic Year"
                value={targetYearId}
                onChange={e => setTargetYearId(e.target.value)}
                options={yearOptions}
                placeholder="Select a year…"
              />
            )}
          </div>
        </Card>
      )}

      {/* Step 4: Preview + Confirm */}
      {sourceClassId && students.length > 0 && (
        <Card title="4. Review & Confirm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-2 rounded-lg bg-slate-100">
                <div className="font-medium text-slate-900">{sourceClassName}</div>
                <div className="text-xs text-slate-500">{sourceYearName}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
              <div className="px-3 py-2 rounded-lg bg-blue-50">
                <div className="font-medium text-slate-900">{targetReady ? targetClassName : '—'}</div>
                <div className="text-xs text-slate-500">{action === 'graduate' ? 'Graduated' : targetReady ? targetYearName : '—'}</div>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              <span className="text-sm text-slate-600">{selectedIds.size} student{selectedIds.size === 1 ? '' : 's'}</span>
              <Button
                variant="primary"
                onClick={handleConfirm}
                isLoading={processing}
                disabled={!targetReady}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Confirm {actionMeta[action].label}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
