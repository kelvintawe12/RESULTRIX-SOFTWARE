import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { Check, ArrowRight, ArrowLeft, Building2, User, CheckCircle } from 'lucide-react';
interface AddSchoolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
interface SchoolFormData {
  // School Info
  name: string;
  address: string;
  currency_code: string;
  grading_scale: string;
  default_exam_out_of: number;
  // Admin Info
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
}
const currencyOptions = [{
  value: 'USD',
  label: 'USD - US Dollar'
}, {
  value: 'EUR',
  label: 'EUR - Euro'
}, {
  value: 'GBP',
  label: 'GBP - British Pound'
}, {
  value: 'KES',
  label: 'KES - Kenyan Shilling'
}, {
  value: 'NGN',
  label: 'NGN - Nigerian Naira'
}, {
  value: 'ZAR',
  label: 'ZAR - South African Rand'
}];
const gradingScaleOptions = [{
  value: 'percentage',
  label: 'Percentage (0-100%)'
}, {
  value: 'out_of_20',
  label: 'Out of 20'
}, {
  value: 'gpa_4_0',
  label: 'GPA 4.0'
}, {
  value: 'gpa_5_0',
  label: 'GPA 5.0'
}];
export function AddSchoolForm({
  isOpen,
  onClose,
  onSuccess
}: AddSchoolFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    currency_code: 'USD',
    grading_scale: 'percentage',
    default_exam_out_of: 100,
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolFormData, string>>>({});
  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof SchoolFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'School name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.currency_code) newErrors.currency_code = 'Currency is required';
    if (!formData.grading_scale) newErrors.grading_scale = 'Grading scale is required';
    if (formData.default_exam_out_of <= 0) newErrors.default_exam_out_of = 'Must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof SchoolFormData, string>> = {};
    if (!formData.admin_name.trim()) newErrors.admin_name = 'Administrator name is required';
    if (!formData.admin_email.trim()) newErrors.admin_email = 'Email is required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Invalid email format';
    }
    if (!formData.admin_password || formData.admin_password.length < 6) {
      newErrors.admin_password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  const handleBack = () => {
    setStep(step - 1);
    setError(null);
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Create school record
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').insert({
        name: formData.name,
        address: formData.address,
        currency_code: formData.currency_code,
        grading_scale: formData.grading_scale,
        default_exam_out_of: formData.default_exam_out_of,
        approved: true // Super admin creates approved schools
      }).select().single();
      if (schoolError) throw schoolError;
      // 2. Create admin user in Supabase Auth
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: formData.admin_email,
        password: formData.admin_password
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');
      // 3. Create user profile
      const {
        error: userError
      } = await supabase.from('users').insert({
        id: authData.user.id,
        school_id: schoolData.id,
        email: formData.admin_email,
        role: 'school_admin',
        full_name: formData.admin_name,
        phone: formData.admin_phone,
        password_hash: '' // Managed by Supabase Auth
      });
      if (userError) throw userError;
      // Success!
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error creating school:', err);
      setError(err.message || 'Failed to create school. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      address: '',
      currency_code: 'USD',
      grading_scale: 'percentage',
      default_exam_out_of: 100,
      admin_name: '',
      admin_email: '',
      admin_phone: '',
      admin_password: ''
    });
    setErrors({});
    setError(null);
    onClose();
  };
  const updateField = (field: keyof SchoolFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  return <Dialog isOpen={isOpen} onClose={handleClose} title="Add New School" size="lg">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map(s => <div key={s} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}
              `}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>)}
        </div>

        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {step === 1 && 'School Information'}
            {step === 2 && 'Administrator Details'}
            {step === 3 && 'Review & Confirm'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 && 'Enter the basic details about the school'}
            {step === 2 && 'Create the school administrator account'}
            {step === 3 && 'Review all information before submitting'}
          </p>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        {/* Step 1: School Information */}
        {step === 1 && <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">School Details</span>
            </div>

            <Input label="School Name" value={formData.name} onChange={e => updateField('name', e.target.value)} error={errors.name} placeholder="e.g., Springfield Academy" required />

            <Input label="Address" value={formData.address} onChange={e => updateField('address', e.target.value)} error={errors.address} placeholder="Full school address" required />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Currency" value={formData.currency_code} onChange={e => updateField('currency_code', e.target.value)} error={errors.currency_code} options={currencyOptions} required />

              <Select label="Grading Scale" value={formData.grading_scale} onChange={e => updateField('grading_scale', e.target.value)} error={errors.grading_scale} options={gradingScaleOptions} required />
            </div>

            <Input label="Default Exam Score" type="number" value={formData.default_exam_out_of} onChange={e => updateField('default_exam_out_of', parseInt(e.target.value))} error={errors.default_exam_out_of} placeholder="e.g., 100" required />
          </div>}

        {/* Step 2: Administrator Details */}
        {step === 2 && <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <User className="w-5 h-5" />
              <span className="font-medium">Administrator Account</span>
            </div>

            <Input label="Full Name" value={formData.admin_name} onChange={e => updateField('admin_name', e.target.value)} error={errors.admin_name} placeholder="e.g., John Smith" required />

            <Input label="Email Address" type="email" value={formData.admin_email} onChange={e => updateField('admin_email', e.target.value)} error={errors.admin_email} placeholder="admin@school.com" required />

            <Input label="Phone Number" type="tel" value={formData.admin_phone} onChange={e => updateField('admin_phone', e.target.value)} error={errors.admin_phone} placeholder="+1 234 567 8900" />

            <Input label="Password" type="password" value={formData.admin_password} onChange={e => updateField('admin_password', e.target.value)} error={errors.admin_password} placeholder="Minimum 6 characters" required />
          </div>}

        {/* Step 3: Review */}
        {step === 3 && <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Review Information</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">
                  School Information
                </h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Currency</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.currency_code}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Address</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Grading Scale</dt>
                    <dd className="font-medium text-slate-900 capitalize">
                      {formData.grading_scale.replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Default Exam Score</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.default_exam_out_of}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">
                  Administrator
                </h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.admin_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.admin_email}
                    </dd>
                  </div>
                  {formData.admin_phone && <div>
                      <dt className="text-slate-500">Phone</dt>
                      <dd className="font-medium text-slate-900">
                        {formData.admin_phone}
                      </dd>
                    </div>}
                </dl>
              </div>
            </div>
          </div>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {step > 1 && <Button variant="secondary" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>

            {step < 3 ? <Button variant="primary" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Next
              </Button> : <Button variant="primary" onClick={handleSubmit} isLoading={loading} leftIcon={<Check className="w-4 h-4" />}>
                Create School
              </Button>}
          </div>
        </div>
      </div>
    </Dialog>;
}