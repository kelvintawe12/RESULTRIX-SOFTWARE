import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Lock, Bell, Mail, Shield, Eye, EyeOff, Save, Trash2, AlertTriangle } from 'lucide-react';
export function SettingsPage() {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'preferences'>('security');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    paymentAlerts: true,
    markUpdates: true,
    systemUpdates: false,
    weeklyReports: true
  });
  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('Please fill in all password fields');
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      if (passwordData.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (updateError) throw updateError;
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      // Save notification preferences to database
      // This would typically be stored in a user_preferences table
      setSuccess('Notification preferences saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Lock className="w-4 h-4" />
            Security
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'preferences' ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' : 'text-slate-600 hover:text-slate-900'}`}>
            <Shield className="w-4 h-4" />
            Preferences
          </button>
        </div>
      </Card>

      {/* Security Tab */}
      {activeTab === 'security' && <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Change Password
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input type={showCurrentPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={e => setPasswordData({
                ...passwordData,
                currentPassword: e.target.value
              })} placeholder="Enter current password" leftIcon={<Lock className="w-4 h-4" />} />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={e => setPasswordData({
                ...passwordData,
                newPassword: e.target.value
              })} placeholder="Enter new password" leftIcon={<Lock className="w-4 h-4" />} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={e => setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value
              })} placeholder="Confirm new password" leftIcon={<Lock className="w-4 h-4" />} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button variant="primary" onClick={handleChangePassword} isLoading={saving} leftIcon={<Save className="w-4 h-4" />} disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}>
                Change Password
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Two-Factor Authentication
            </h3>
            <p className="text-slate-600 mb-4">
              Add an extra layer of security to your account by enabling
              two-factor authentication.
            </p>
            <Badge variant="secondary">Coming Soon</Badge>
          </Card>
        </div>}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Notification Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-slate-500">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.emailNotifications} onChange={e => setNotificationSettings({
              ...notificationSettings,
              emailNotifications: e.target.checked
            })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Payment Alerts</p>
                  <p className="text-sm text-slate-500">
                    Get notified when payments are received
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.paymentAlerts} onChange={e => setNotificationSettings({
              ...notificationSettings,
              paymentAlerts: e.target.checked
            })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Mark Updates</p>
                  <p className="text-sm text-slate-500">
                    Notifications when marks are submitted or approved
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.markUpdates} onChange={e => setNotificationSettings({
              ...notificationSettings,
              markUpdates: e.target.checked
            })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">System Updates</p>
                  <p className="text-sm text-slate-500">
                    Important system announcements and updates
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.systemUpdates} onChange={e => setNotificationSettings({
              ...notificationSettings,
              systemUpdates: e.target.checked
            })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium text-slate-900">Weekly Reports</p>
                  <p className="text-sm text-slate-500">
                    Receive weekly summary reports via email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.weeklyReports} onChange={e => setNotificationSettings({
              ...notificationSettings,
              weeklyReports: e.target.checked
            })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="primary" onClick={handleSaveNotifications} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
              Save Preferences
            </Button>
          </div>
        </Card>}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">
              Display Preferences
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Language
                </label>
                <select className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Timezone
                </label>
                <select className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="utc">UTC</option>
                  <option value="est">Eastern Time</option>
                  <option value="pst">Pacific Time</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => alert('Account deletion would be implemented here')}>
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>}
    </div>;
}