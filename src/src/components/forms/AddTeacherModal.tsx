import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

import { User, Mail, Phone, BookOpen, Award, Briefcase, FileText } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  subject_ids: string[];
  qualification: string;
  experience_years: number;
  employment_status: 'full_time' | 'part_time';
  salary?: number;
  bio?: string;
}

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' }
];

export function AddTeacherModal({ isOpen, onClose, onSuccess }: AddTeacherModalProps) {
  const { user } = useAuth();
  const safeSchoolId = user?.school_id;

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    subject_ids: [],
    qualification: '',
    experience_years: 0,
    employment_status: 'full_time',
    bio: ''
  });

  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Fetch subjects when modal opens
  React.useEffect(() => {
    if (isOpen && safeSchoolId) {
      fetchSubjects();
    }
  }, [isOpen, user?.school_id]);

  const fetchSubjects = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', safeSchoolId)
        .order('name');

      if (fetchError) throw fetchError;
      setSubjects(data || []);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      // Non-blocking error
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.full_name.trim()) errors.push('Full name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) errors.push('Invalid email format');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) errors.push('Phone must have at least 10 digits');
    if (formData.experience_years < 0) errors.push('Experience cannot be negative');
    if (formData.employment_status === 'full_time' && formData.salary && formData.salary <= 0) {
      errors.push('Salary must be greater than 0');
    }

    return errors;
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

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (existingUser) {
        setError('This email is already registered');
        return;
      }

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: Math.random().toString(36).slice(-12) // Temporary password
      });

      if (signUpError) throw signUpError;
      if (!authData.user?.id) throw new Error('Failed to create user account');

      // Insert into users table
      const { error: userInsertError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: formData.email.toLowerCase(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          role: 'teacher',
          school_id: user?.school_id,
          is_active: true
        }
      ]);

      if (userInsertError) throw userInsertError;

      // Insert into teacher_profiles table
      const { error: profileError } = await supabase.from('teacher_profiles').insert([
        {
          user_id: authData.user.id,
          school_id: user?.school_id,
          qualification: formData.qualification.trim() || null,
          experience_years: formData.experience_years,
          employment_status: formData.employment_status,
          salary: formData.employment_status === 'full_time' ? formData.salary : null,
          bio: formData.bio?.trim() || null
        }
      ]);

      if (profileError) throw profileError;

      // Assign subjects if selected
      if (selectedSubjects.length > 0) {
        const { error: assignError } = await supabase.from('teacher_subjects').insert(
          selectedSubjects.map(subject_id => ({
            teacher_id: authData.user.id,
            subject_id
          }))
        );

        if (assignError) console.error('Error assigning subjects:', assignError);
      }

      // Create audit log
      await supabase.from('audit_logs').insert([
        {
          school_id: user?.school_id,
          action: 'TEACHER_CREATED',
          entity_type: 'teacher',
          entity_id: authData.user.id,
          details: {
            name: formData.full_name,
            email: formData.email,
            subjects_assigned: selectedSubjects.length
          },
          performed_by: user?.id
        }
      ]);

      // Success notification
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      setError(err.message || 'Failed to add teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      subject_ids: [],
      qualification: '',
      experience_years: 0,
      employment_status: 'full_time',
      bio: ''
    });
    setSelectedSubjects([]);
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add New Teacher" size="lg">
      <div className="space-y-6">
        {error && (
          <Alert
            variant="error"
            title="Error"
            message={error}
          />
        )}

        {/* Personal Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Personal Information
          </h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g., John Smith"
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teacher@school.com"
              leftIcon={<Mail className="w-4 h-4" />}
              helpText="Will be used for login"
            />

            <Input
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              leftIcon={<Phone className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Professional Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Professional Information
          </h3>
          <div className="space-y-4">
            <Input
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g., Bachelor in Mathematics"
              leftIcon={<Award className="w-4 h-4" />}
              helpText="Educational degree or certification"
            />

            <Input
              label="Years of Experience"
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              max="70"
            />

            <Select
              label="Employment Status"
              required
              value={formData.employment_status}
              onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as 'full_time' | 'part_time' })}
              options={EMPLOYMENT_STATUS_OPTIONS}
              leftIcon={<Briefcase className="w-4 h-4" />}
            />

            {formData.employment_status === 'full_time' && (
              <Input
                label="Monthly Salary (Optional)"
                type="number"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            )}

            <Input
              label="Bio/Description"
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief professional bio (optional)"
              leftIcon={<FileText className="w-4 h-4" />}
              isTextarea
              rows={3}
            />
          </div>
        </div>

        {/* Subject Assignment Section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Assign Subjects (Optional)
          </h3>
          
          {subjects.length > 0 ? (
            <Card className="p-4 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                {subjects.map(subject => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{subject.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Selected: {selectedSubjects.length} / {subjects.length}
              </p>
            </Card>
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">
                No subjects found. Create subjects first before assigning.
              </p>
            </div>
          )}
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
            disabled={loading || !formData.full_name.trim() || !formData.email.trim()}
          >
            Add Teacher
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
