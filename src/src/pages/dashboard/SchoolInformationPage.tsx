import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Building2, Mail, Phone, Globe, MapPin, Edit, Save, Upload, Calendar, Settings } from 'lucide-react';
interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  principal_name: string | null;
  principal_email: string | null;
  timezone: string | null;
  currency: string | null;
}
export function SchoolInformationPage() {
  const {
    user
  } = useAuth();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Modal states
  const [editDetailsModal, setEditDetailsModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [editSettingsModal, setEditSettingsModal] = useState(false);
  // Form states
  const [detailsForm, setDetailsForm] = useState({
    name: '',
    address: '',
    website: ''
  });
  const [contactForm, setContactForm] = useState({
    phone: '',
    email: '',
    principal_name: '',
    principal_email: ''
  });
  const [settingsForm, setSettingsForm] = useState({
    timezone: '',
    currency: ''
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchSchoolData();
    }
  }, [user]);
  const fetchSchoolData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('schools').select('*').eq('id', user.school_id).single();
      if (error) throw error;
      setSchool(data);
      setDetailsForm({
        name: data.name || '',
        address: data.address || '',
        website: data.website || ''
      });
      setContactForm({
        phone: data.phone || '',
        email: data.email || '',
        principal_name: data.principal_name || '',
        principal_email: data.principal_email || ''
      });
      setSettingsForm({
        timezone: data.timezone || 'UTC',
        currency: data.currency || 'USD'
      });
    } catch (err: any) {
      console.error('Error fetching school data:', err);
      setError('Failed to load school information');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveDetails = async () => {
    if (!user?.school_id) return;
    try {
      setSaving(true);
      setError('');
      const {
        error
      } = await supabase.from('schools').update({
        name: detailsForm.name,
        address: detailsForm.address,
        website: detailsForm.website
      }).eq('id', user.school_id);
      if (error) throw error;
      setSuccess('School details updated successfully');
      setEditDetailsModal(false);
      fetchSchoolData();
    } catch (err: any) {
      setError(err.message || 'Failed to update school details');
    } finally {
      setSaving(false);
    }
  };
  const handleSaveContact = async () => {
    if (!user?.school_id) return;
    try {
      setSaving(true);
      setError('');
      const {
        error
      } = await supabase.from('schools').update({
        phone: contactForm.phone,
        email: contactForm.email,
        principal_name: contactForm.principal_name,
        principal_email: contactForm.principal_email
      }).eq('id', user.school_id);
      if (error) throw error;
      setSuccess('Contact information updated successfully');
      setEditContactModal(false);
      fetchSchoolData();
    } catch (err: any) {
      setError(err.message || 'Failed to update contact information');
    } finally {
      setSaving(false);
    }
  };
  const handleSaveSettings = async () => {
    if (!user?.school_id) return;
    try {
      setSaving(true);
      setError('');
      const {
        error
      } = await supabase.from('schools').update({
        timezone: settingsForm.timezone,
        currency: settingsForm.currency
      }).eq('id', user.school_id);
      if (error) throw error;
      setSuccess('Settings updated successfully');
      setEditSettingsModal(false);
      fetchSchoolData();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (!school) {
    return <div className="text-center py-12">
        <p className="text-slate-500">School information not found</p>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          School Information
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your school's details and settings
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {/* School Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              School Details
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditDetailsModal(true)} leftIcon={<Edit className="h-4 w-4" />}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">
                School Name
              </label>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {school.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Address
              </label>
              <p className="text-slate-900 mt-1">
                {school.address || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Website
              </label>
              <p className="text-slate-900 mt-1">
                {school.website || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditContactModal(true)} leftIcon={<Edit className="h-4 w-4" />}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Phone
              </label>
              <p className="text-slate-900 mt-1">{school.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Email
              </label>
              <p className="text-slate-900 mt-1">{school.email || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Principal Name
              </label>
              <p className="text-slate-900 mt-1">
                {school.principal_name || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Principal Email
              </label>
              <p className="text-slate-900 mt-1">
                {school.principal_email || 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              School Settings
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditSettingsModal(true)} leftIcon={<Edit className="h-4 w-4" />}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Timezone
              </label>
              <p className="text-slate-900 mt-1">{school.timezone || 'UTC'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Currency
              </label>
              <p className="text-slate-900 mt-1">{school.currency || 'USD'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Details Modal */}
      <Dialog isOpen={editDetailsModal} onClose={() => setEditDetailsModal(false)} title="Edit School Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              School Name
            </label>
            <Input value={detailsForm.name} onChange={e => setDetailsForm({
            ...detailsForm,
            name: e.target.value
          })} placeholder="Enter school name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Address
            </label>
            <Input value={detailsForm.address} onChange={e => setDetailsForm({
            ...detailsForm,
            address: e.target.value
          })} placeholder="Enter school address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website
            </label>
            <Input value={detailsForm.website} onChange={e => setDetailsForm({
            ...detailsForm,
            website: e.target.value
          })} placeholder="https://www.yourschool.com" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditDetailsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDetails} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog isOpen={editContactModal} onClose={() => setEditContactModal(false)} title="Edit Contact Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone
            </label>
            <Input value={contactForm.phone} onChange={e => setContactForm({
            ...contactForm,
            phone: e.target.value
          })} placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <Input type="email" value={contactForm.email} onChange={e => setContactForm({
            ...contactForm,
            email: e.target.value
          })} placeholder="contact@school.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Principal Name
            </label>
            <Input value={contactForm.principal_name} onChange={e => setContactForm({
            ...contactForm,
            principal_name: e.target.value
          })} placeholder="Dr. John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Principal Email
            </label>
            <Input type="email" value={contactForm.principal_email} onChange={e => setContactForm({
            ...contactForm,
            principal_email: e.target.value
          })} placeholder="principal@school.com" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditContactModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Settings Modal */}
      <Dialog isOpen={editSettingsModal} onClose={() => setEditSettingsModal(false)} title="Edit School Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Timezone
            </label>
            <Input value={settingsForm.timezone} onChange={e => setSettingsForm({
            ...settingsForm,
            timezone: e.target.value
          })} placeholder="UTC" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Currency
            </label>
            <Input value={settingsForm.currency} onChange={e => setSettingsForm({
            ...settingsForm,
            currency: e.target.value
          })} placeholder="USD" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>;
}