import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { User, Mail, Phone, Building2, Shield, Calendar, Edit, Save, X, Camera } from 'lucide-react';
export function ProfilePage() {
  const {
    user,
    role
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // Fetch user data
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('*').eq('id', user?.id).single();
      if (userError) throw userError;
      setProfileData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
      // Fetch school info if not super admin
      if (user?.school_id) {
        const {
          data: schoolData,
          error: schoolError
        } = await supabase.from('schools').select('*').eq('id', user.school_id).single();
        if (schoolError) throw schoolError;
        setSchoolInfo(schoolData);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const {
        error: updateError
      } = await supabase.from('users').update({
        full_name: profileData.full_name,
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      }).eq('id', user?.id);
      if (updateError) throw updateError;
      setSuccess('Profile updated successfully');
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  const getRoleColor = () => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'school_admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'bursar':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'teacher':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };
  const getRoleIcon = () => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-5 h-5" />;
      case 'school_admin':
        return <Building2 className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4 ${getRoleColor()}`}>
              {profileData.full_name?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900">
              {profileData.full_name}
            </h2>
            <p className="text-slate-500 mt-1">{profileData.email}</p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              <Badge variant="secondary" className={`${getRoleColor()} flex items-center gap-2 px-3 py-1.5`}>
                {getRoleIcon()}
                <span className="capitalize">{role?.replace('_', ' ')}</span>
              </Badge>
              {schoolInfo && <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                  <Building2 className="w-4 h-4" />
                  {schoolInfo.name}
                </Badge>}
            </div>

            <div className="flex gap-3 mt-6 justify-center md:justify-start">
              {!editing ? <Button variant="primary" leftIcon={<Edit className="w-4 h-4" />} onClick={() => setEditing(true)}>
                  Edit Profile
                </Button> : <>
                  <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSaveProfile} isLoading={saving}>
                    Save Changes
                  </Button>
                  <Button variant="secondary" leftIcon={<X className="w-4 h-4" />} onClick={() => {
                setEditing(false);
                fetchProfileData();
              }} disabled={saving}>
                    Cancel
                  </Button>
                </>}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            {editing ? <Input value={profileData.full_name} onChange={e => setProfileData({
            ...profileData,
            full_name: e.target.value
          })} leftIcon={<User className="w-4 h-4" />} /> : <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-slate-900">{profileData.full_name}</span>
              </div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="w-5 h-5 text-slate-400" />
              <span className="text-slate-900">{profileData.email}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            {editing ? <Input type="tel" value={profileData.phone} onChange={e => setProfileData({
            ...profileData,
            phone: e.target.value
          })} leftIcon={<Phone className="w-4 h-4" />} placeholder="+1234567890" /> : <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="text-slate-900">
                  {profileData.phone || 'Not provided'}
                </span>
              </div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-slate-900 capitalize">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* School Information */}
      {schoolInfo && <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            School Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                School Name
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Building2 className="w-5 h-5 text-slate-400" />
                <span className="text-slate-900">{schoolInfo.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-900">
                  {schoolInfo.currency_code}
                </span>
              </div>
            </div>

            {schoolInfo.address && <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address
                </label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-900">{schoolInfo.address}</span>
                </div>
              </div>}
          </div>
        </Card>}

      {/* Account Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          Account Activity
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">Last Login</p>
                <p className="text-sm text-slate-500">
                  Track your recent account activity
                </p>
              </div>
            </div>
            <span className="text-sm text-slate-600">Just now</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">Account Status</p>
                <p className="text-sm text-slate-500">
                  Your account is active and verified
                </p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </Card>
    </div>;
}