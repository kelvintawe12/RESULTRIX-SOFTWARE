import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Checkbox } from '../ui/Checkbox';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

import { BookOpen, Code, Percent, Zap } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  coefficient: number;
  is_compulsory: boolean;
}

export function AddSubjectModal({ isOpen, onClose, onSuccess }: AddSubjectModalProps) {
  const { user } = useAuth();
  const safeSchoolId = user?.school_id;
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    coefficient: 1,
    is_compulsory: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);

  // Fetch existing codes to check for duplicates
  React.useEffect(() => {
    if (isOpen && user?.school_id) {
      fetchExistingCodes();
    }
  }, [isOpen, user?.school_id]);

  const fetchExistingCodes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('code')
        .eq('school_id', user?.school_id);

      if (fetchError) throw fetchError;
      setExistingCodes((data || []).map(s => s.code).filter(Boolean));
    } catch (err: any) {
      console.error('Error fetching existing codes:', err);
    }
  };

  // Auto-generate code from subject name
  const generateCode = (name: string) => {
    if (!name.trim()) return '';
    const code = name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 4)
      .padEnd(3, '0');
    return code;
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Subject name is required');
    }

    if (!formData.code.trim()) {
      errors.push('Subject code is required');
    } else if (existingCodes.includes(formData.code.toUpperCase())) {
      errors.push('This subject code already exists');
    }

    if (formData.coefficient <= 0 || formData.coefficient > 10) {
      errors.push('Coefficient must be between 0.1 and 10');
    }

    return errors;
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => {
      const updated = { ...prev, name: value };
      // Auto-generate code if user hasn't manually entered one
      if (!prev.code || prev.code === generateCode(prev.name)) {
        updated.code = generateCode(value);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      const errors = validateForm();
      if (errors.length > 0) {
        setError(errors[0]);
        return;
      }

      // Insert subject
      const { error: insertError, data } = await supabase
        .from('subjects')
        .insert([
          {
            school_id: user?.school_id,
            name: formData.name.trim(),
            code: formData.code.toUpperCase().trim(),
            description: formData.description.trim() || null,
            coefficient: formData.coefficient,
            is_compulsory: formData.is_compulsory,
            is_active: true
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Create audit log
      await supabase.from('audit_logs').insert([
        {
          school_id: user?.school_id,
          action: 'SUBJECT_CREATED',
          entity_type: 'subject',
          entity_id: data?.id,
          details: {
            name: formData.name,
            code: formData.code,
            coefficient: formData.coefficient,
            is_compulsory: formData.is_compulsory
          },
          performed_by: user?.id
        }
      ]);

      // Success
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error adding subject:', err);
      setError(err.message || 'Failed to add subject. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      coefficient: 1,
      is_compulsory: false
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Subject"
      size="md"
    >
      <div className="space-y-6">
        {error && (
          <Alert
            variant="error"
            title="Error"
            message={error}
          />
        )}

        {/* Subject Name */}
        <Input
          label="Subject Name"
          required
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Mathematics, English Language, Physics"
          leftIcon={<BookOpen className="w-4 h-4" />}
        />


        {/* Subject Code */}
        <Input
          label="Subject Code"
          required
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g., MATH, ENG, PHY"
          leftIcon={<Code className="w-4 h-4" />}
          maxLength={10}
        />


        {/* Description */}
        <Input
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the subject content"
          type="text"
        />



        {/* Coefficient/Weight */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <span className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Coefficient/Weight
            </span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={formData.coefficient}
              onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 min-w-fit">
              <span className="text-sm font-semibold text-blue-900">{formData.coefficient.toFixed(1)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Higher coefficients have more weight in final grade calculations. Default is 1.0.
          </p>
        </div>

        {/* Compulsory */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Checkbox
            checked={formData.is_compulsory}
            onChange={(e) => setFormData({ ...formData, is_compulsory: e.target.checked })}

            id="is_compulsory"
          />
          <label htmlFor="is_compulsory" className="flex items-center gap-2 cursor-pointer">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">
              This is a compulsory/mandatory subject
            </span>
          </label>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Students must enroll in all compulsory subjects
        </p>

        {/* Preview Card */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h4 className="text-xs font-semibold text-blue-900 uppercase mb-3">Preview</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Name</span>
              <span className="text-sm font-semibold text-blue-900">{formData.name || '(Enter name)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Code</span>
              <span className="text-sm font-mono font-semibold text-blue-900">{formData.code || '(Auto-generated)'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Coefficient</span>
              <span className="text-sm font-semibold text-blue-900">{formData.coefficient.toFixed(1)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Type</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${formData.is_compulsory ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                {formData.is_compulsory ? 'Compulsory' : 'Optional'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={loading || !formData.name.trim() || !formData.code.trim()}
          >
            Add Subject
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
