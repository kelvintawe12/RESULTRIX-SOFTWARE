import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { User, Mail, Phone, Building2 } from 'lucide-react';
interface EditAdministratorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  administrator: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    school_id: string;
  };
}
export function EditAdministratorForm({
  isOpen,
  onClose,
  onSuccess,
  administrator
}: EditAdministratorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: administrator.full_name,
    email: administrator.email,
    phone: administrator.phone || '',
    school_id: administrator.school_id
  });
  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: administrator.full_name,
        email: administrator.email,
        phone: administrator.phone || '',
        school_id: administrator.school_id
      });
      setError(null);
      fetchSchools();
    }
  }, [isOpen, administrator]);
  const fetchSchools = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('id, name').eq('approved', true).order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error('Error fetching schools:', err);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const {
        error: updateError
      } = await supabase.from('users').update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        school_id: formData.school_id,
        updated_at: new Date().toISOString()
      }).eq('id', administrator.id);
      if (updateError) throw updateError;
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating administrator:', err);
      setError(err.message || 'Failed to update administrator');
    } finally {
      setLoading(false);
    }
  };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Edit Administrator" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

        <Input label="Full Name" required value={formData.full_name} onChange={e => setFormData({
        ...formData,
        full_name: e.target.value
      })} placeholder="Enter full name" leftIcon={<User className="w-4 h-4 text-gray-400" />} />

        <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({
        ...formData,
        email: e.target.value
      })} placeholder="admin@school.com" leftIcon={<Mail className="w-4 h-4 text-gray-400" />} />

        <Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({
        ...formData,
        phone: e.target.value
      })} placeholder="+1 (555) 000-0000" leftIcon={<Phone className="w-4 h-4 text-gray-400" />} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            School Assignment <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select required value={formData.school_id} onChange={e => setFormData({
            ...formData,
            school_id: e.target.value
          })} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">Select school</option>
              {schools.map(school => <option key={school.id} value={school.id}>
                  {school.name}
                </option>)}
            </select>
          </div>
        </div>

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