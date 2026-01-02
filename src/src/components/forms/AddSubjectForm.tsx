import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Checkbox } from '../ui/Checkbox';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
interface AddSubjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
export function AddSubjectForm({
  isOpen,
  onClose,
  onSuccess
}: AddSubjectFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    coefficient: '1.0',
    subjectType: 'core',
    selectedClasses: [] as string[]
  });
  useEffect(() => {
    if (isOpen && user?.school_id) {
      fetchClasses();
    }
  }, [isOpen, user?.school_id]);
  const fetchClasses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('classes').select('*').eq('school_id', user?.school_id).order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!formData.name || formData.selectedClasses.length === 0) {
        throw new Error('Please fill in all required fields and select at least one class');
      }
      // 1. Create subject
      const {
        data: subjectData,
        error: subjectError
      } = await supabase.from('subjects').insert({
        school_id: user?.school_id,
        name: formData.name,
        coefficient: parseFloat(formData.coefficient),
        subject_type: formData.subjectType
      }).select().single();
      if (subjectError) throw subjectError;
      // 2. Create subject-class mappings
      const mappings = formData.selectedClasses.map(classId => ({
        subject_id: subjectData.id,
        class_id: classId
      }));
      const {
        error: mappingError
      } = await supabase.from('subject_class_mappings').insert(mappings);
      if (mappingError) throw mappingError;
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error adding subject:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      name: '',
      coefficient: '1.0',
      subjectType: 'core',
      selectedClasses: []
    });
    setError(null);
    onClose();
  };
  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId) ? prev.selectedClasses.filter(id => id !== classId) : [...prev.selectedClasses, classId]
    }));
  };
  const subjectTypeOptions = [{
    value: 'core',
    label: 'Core Subject'
  }, {
    value: 'elective',
    label: 'Elective Subject'
  }];
  return <Dialog isOpen={isOpen} onClose={handleClose} title="Add New Subject" size="md">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}

        <Input label="Subject Name" required value={formData.name} onChange={e => setFormData({
        ...formData,
        name: e.target.value
      })} placeholder="e.g., Mathematics" />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Coefficient" type="number" step="0.1" min="0.1" required value={formData.coefficient} onChange={e => setFormData({
          ...formData,
          coefficient: e.target.value
        })} placeholder="e.g., 2.0" />

          <Select label="Subject Type" value={formData.subjectType} onChange={e => setFormData({
          ...formData,
          subjectType: e.target.value
        })} options={subjectTypeOptions} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Assign to Classes <span className="text-rose-500">*</span>
          </label>
          <div className="border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            {classes.length > 0 ? classes.map(cls => <div key={cls.id} className="flex items-center gap-2">
                  <Checkbox checked={formData.selectedClasses.includes(cls.id)} onChange={() => toggleClass(cls.id)} />
                  <label className="text-sm text-slate-700 cursor-pointer" onClick={() => toggleClass(cls.id)}>
                    {cls.name}
                  </label>
                </div>) : <p className="text-sm text-slate-500 text-center py-2">
                No classes found. Please create classes first.
              </p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Create Subject
          </Button>
        </div>
      </div>
    </Dialog>;
}