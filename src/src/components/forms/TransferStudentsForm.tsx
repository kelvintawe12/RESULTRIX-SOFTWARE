import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRightLeft } from 'lucide-react';

interface TransferStudentsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Student ids to move. May be a single id (per-row move) or many (bulk). */
  studentIds: string[];
  /** Current class id of the selected students, excluded from the target list. */
  currentClassId?: string | null;
}

/**
 * Shared dialog to move one or more students to a different class.
 * Used from the Students page (bulk) and the Class Roster page (single row).
 */
export function TransferStudentsForm({
  isOpen,
  onClose,
  onSuccess,
  studentIds,
  currentClassId
}: TransferStudentsFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [targetClassId, setTargetClassId] = useState('');

  useEffect(() => {
    if (isOpen && user?.school_id) {
      setError(null);
      setTargetClassId('');
      fetchClasses();
    }
  }, [isOpen, user?.school_id]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', user?.school_id)
        .order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };

  const classOptions = useMemo(
    () =>
      classes
        .filter(c => c.id !== currentClassId)
        .map(c => ({ value: c.id, label: c.name })),
    [classes, currentClassId]
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!targetClassId) throw new Error('Please choose a destination class.');
      if (!studentIds.length) throw new Error('No students selected.');

      const { error: updateError } = await supabase
        .from('students')
        .update({ class_id: targetClassId })
        .in('id', studentIds);
      if (updateError) throw updateError;

      // Audit log is best-effort: never block the transfer if it fails.
      try {
        const target = classes.find(c => c.id === targetClassId);
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          school_id: user?.school_id,
          action_type: 'student_transfer',
          details: {
            count: studentIds.length,
            to_class_id: targetClassId,
            to_class: target?.name,
            from_class_id: currentClassId ?? null,
            student_ids: studentIds
          }
        });
      } catch (auditErr) {
        console.warn('Audit log for transfer failed (non-blocking):', auditErr);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error transferring students:', err);
      setError(err.message || 'Failed to transfer students.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Move Students to Class" size="sm">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}

        <p className="text-sm text-slate-600">
          Moving{' '}
          <span className="font-semibold text-slate-900">{studentIds.length}</span>{' '}
          student{studentIds.length === 1 ? '' : 's'} to a new class. This updates
          their class assignment immediately.
        </p>

        <Select
          label="Destination Class"
          value={targetClassId}
          onChange={e => setTargetClassId(e.target.value)}
          options={classOptions}
          placeholder={classOptions.length ? 'Select a class…' : 'No other classes available'}
        />

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!targetClassId}
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
          >
            Move Students
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
