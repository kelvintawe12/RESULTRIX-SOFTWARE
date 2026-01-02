import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { Building2, DollarSign, GraduationCap } from 'lucide-react';
interface EditSchoolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  school: {
    id: string;
    name: string;
    address: string;
    currency_code: string;
    grading_scale: string;
    default_exam_out_of: number;
    approved: boolean;
  };
}
export function EditSchoolForm({
  isOpen,
  onClose,
  onSuccess,
  school
}: EditSchoolFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: school.name,
    address: school.address,
    currency_code: school.currency_code,
    grading_scale: school.grading_scale,
    default_exam_out_of: school.default_exam_out_of,
    approved: school.approved
  });
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: school.name,
        address: school.address,
        currency_code: school.currency_code,
        grading_scale: school.grading_scale,
        default_exam_out_of: school.default_exam_out_of,
        approved: school.approved
      });
      setError(null);
    }
  }, [isOpen, school]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const {
        error: updateError
      } = await supabase.from('schools').update({
        name: formData.name,
        address: formData.address,
        currency_code: formData.currency_code,
        grading_scale: formData.grading_scale,
        default_exam_out_of: formData.default_exam_out_of,
        approved: formData.approved,
        updated_at: new Date().toISOString()
      }).eq('id', school.id);
      if (updateError) throw updateError;
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating school:', err);
      setError(err.message || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };
  const currencies = [{
    code: 'USD',
    name: 'US Dollar'
  }, {
    code: 'EUR',
    name: 'Euro'
  }, {
    code: 'GBP',
    name: 'British Pound'
  }, {
    code: 'KES',
    name: 'Kenyan Shilling'
  }, {
    code: 'NGN',
    name: 'Nigerian Naira'
  }, {
    code: 'ZAR',
    name: 'South African Rand'
  }, {
    code: 'GHS',
    name: 'Ghanaian Cedi'
  }, {
    code: 'UGX',
    name: 'Ugandan Shilling'
  }, {
    code: 'TZS',
    name: 'Tanzanian Shilling'
  }, {
    code: 'INR',
    name: 'Indian Rupee'
  }, {
    code: 'CAD',
    name: 'Canadian Dollar'
  }, {
    code: 'AUD',
    name: 'Australian Dollar'
  }];
  const gradingScales = [{
    value: 'percentage',
    label: 'Percentage (0-100%)'
  }, {
    value: 'out_of_20',
    label: 'Out of 20'
  }, {
    value: 'gpa_4_0',
    label: 'GPA 4.0 Scale'
  }, {
    value: 'gpa_5_0',
    label: 'GPA 5.0 Scale'
  }, {
    value: 'custom',
    label: 'Custom Scale'
  }];
  return <Dialog isOpen={isOpen} onClose={onClose} title="Edit School" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

        {/* School Name */}
        <div>
          <Input label="School Name" required value={formData.name} onChange={e => setFormData({
          ...formData,
          name: e.target.value
        })} placeholder="Enter school name" leftIcon={<Building2 className="w-4 h-4 text-gray-400" />} />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Address
          </label>
          <textarea value={formData.address} onChange={e => setFormData({
          ...formData,
          address: e.target.value
        })} placeholder="Enter school address" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Currency <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select required value={formData.currency_code} onChange={e => setFormData({
            ...formData,
            currency_code: e.target.value
          })} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">Select currency</option>
              {currencies.map(currency => <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>)}
            </select>
          </div>
        </div>

        {/* Grading Scale */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Grading Scale <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select required value={formData.grading_scale} onChange={e => setFormData({
            ...formData,
            grading_scale: e.target.value
          })} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">Select grading scale</option>
              {gradingScales.map(scale => <option key={scale.value} value={scale.value}>
                  {scale.label}
                </option>)}
            </select>
          </div>
        </div>

        {/* Default Exam Score */}
        <div>
          <Input label="Default Exam Score (Out of)" type="number" required min="1" max="1000" value={formData.default_exam_out_of} onChange={e => setFormData({
          ...formData,
          default_exam_out_of: parseInt(e.target.value)
        })} placeholder="100" />
          <p className="text-xs text-slate-500 mt-1">
            Default maximum score for exams (e.g., 100, 20)
          </p>
        </div>

        {/* Approval Status */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <input type="checkbox" id="approved" checked={formData.approved} onChange={e => setFormData({
          ...formData,
          approved: e.target.checked
        })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
          <label htmlFor="approved" className="text-sm font-medium text-slate-700">
            School is approved and active
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>;
}