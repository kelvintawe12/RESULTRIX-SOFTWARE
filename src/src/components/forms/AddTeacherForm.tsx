import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles } from 'lucide-react';
interface AddTeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
export function AddTeacherForm({
  isOpen,
  onClose,
  onSuccess
}: AddTeacherFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const fillTestData = () => {
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData({
      fullName: `Test Teacher ${randomNum}`,
      email: `teacher${randomNum}@test.com`,
      phone: `+123456${randomNum}`,
      password: 'Test123!'
    });
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }
      // 1. Create auth user
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');
      // 2. Create user profile
      const {
        error: profileError
      } = await supabase.from('users').insert({
        id: authData.user.id,
        school_id: user?.school_id,
        email: formData.email,
        role: 'teacher',
        full_name: formData.fullName,
        phone: formData.phone,
        password_hash: '' // Managed by Supabase
      });
      if (profileError) throw profileError;
      onSuccess();
      onClose();
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: ''
      });
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Add New Teacher">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={fillTestData} leftIcon={<Sparkles className="w-4 h-4" />}>
            Fill Test Data
          </Button>
        </div>

        <Input label="Full Name" required value={formData.fullName} onChange={e => setFormData({
        ...formData,
        fullName: e.target.value
      })} />

        <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({
        ...formData,
        email: e.target.value
      })} />

        <Input label="Phone" value={formData.phone} onChange={e => setFormData({
        ...formData,
        phone: e.target.value
      })} />

        <Input label="Password" type="password" required value={formData.password} onChange={e => setFormData({
        ...formData,
        password: e.target.value
      })} placeholder="Min. 6 characters" />

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Create Teacher
          </Button>
        </div>
      </div>
    </Dialog>;
}