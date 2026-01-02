import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Settings, Save, Globe, Mail, Shield, Database, Zap, Bell, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, Server, Code, Palette, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
export function PlatformSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'EduMaster',
    platformUrl: 'https://edumaster.app',
    supportEmail: 'support@edumaster.app',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    // Email Settings
    emailProvider: 'sendgrid',
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@edumaster.app',
    fromName: 'EduMaster',
    // Security Settings
    sessionTimeout: '30',
    passwordMinLength: '8',
    requireMfa: false,
    allowSignup: true,
    maxLoginAttempts: '5',
    lockoutDuration: '15',
    // API Settings
    apiRateLimit: '100',
    apiTimeout: '30',
    webhookSecret: '',
    corsOrigins: '*',
    // Notifications
    emailNotifications: true,
    maintenanceAlerts: true,
    securityAlerts: true,
    usageReports: true,
    // Features
    enableReporting: true,
    enableBulkOperations: true,
    enableApiAccess: true,
    enableWebhooks: false,
    // Storage
    maxFileSize: '10',
    allowedFileTypes: 'pdf,doc,docx,xls,xlsx,jpg,png',
    storageProvider: 'supabase',
    // Branding
    primaryColor: '#3B82F6',
    logoUrl: '',
    faviconUrl: '',
    customCss: ''
  });
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      // In a real app, save to a settings table
      // For now, just simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to defaults
      setSettings({
        platformName: 'EduMaster',
        platformUrl: 'https://edumaster.app',
        supportEmail: 'support@edumaster.app',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        emailProvider: 'sendgrid',
        smtpHost: '',
        smtpPort: '587',
        smtpUsername: '',
        smtpPassword: '',
        fromEmail: 'noreply@edumaster.app',
        fromName: 'EduMaster',
        sessionTimeout: '30',
        passwordMinLength: '8',
        requireMfa: false,
        allowSignup: true,
        maxLoginAttempts: '5',
        lockoutDuration: '15',
        apiRateLimit: '100',
        apiTimeout: '30',
        webhookSecret: '',
        corsOrigins: '*',
        emailNotifications: true,
        maintenanceAlerts: true,
        securityAlerts: true,
        usageReports: true,
        enableReporting: true,
        enableBulkOperations: true,
        enableApiAccess: true,
        enableWebhooks: false,
        maxFileSize: '10',
        allowedFileTypes: 'pdf,doc,docx,xls,xlsx,jpg,png',
        storageProvider: 'supabase',
        primaryColor: '#3B82F6',
        logoUrl: '',
        faviconUrl: '',
        customCss: ''
      });
      setSuccess('Settings reset to defaults');
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reset to Defaults
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Settings Tabs */}
      <Card className="p-6">
        <Tabs tabs={[{
        id: 'general',
        label: 'General',
        icon: Globe
      }, {
        id: 'email',
        label: 'Email',
        icon: Mail
      }, {
        id: 'security',
        label: 'Security',
        icon: Shield
      }, {
        id: 'api',
        label: 'API',
        icon: Code
      }, {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell
      }, {
        id: 'features',
        label: 'Features',
        icon: Zap
      }, {
        id: 'storage',
        label: 'Storage',
        icon: Database
      }, {
        id: 'branding',
        label: 'Branding',
        icon: Palette
      }]} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {/* General Settings */}
          {activeTab === 'general' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  General Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Platform Name" value={settings.platformName} onChange={e => setSettings({
                ...settings,
                platformName: e.target.value
              })} placeholder="EduMaster" />
                  <Input label="Platform URL" value={settings.platformUrl} onChange={e => setSettings({
                ...settings,
                platformUrl: e.target.value
              })} placeholder="https://edumaster.app" />
                  <Input label="Support Email" type="email" value={settings.supportEmail} onChange={e => setSettings({
                ...settings,
                supportEmail: e.target.value
              })} placeholder="support@edumaster.app" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Timezone
                    </label>
                    <select value={settings.timezone} onChange={e => setSettings({
                  ...settings,
                  timezone: e.target.value
                })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Africa/Nairobi">Nairobi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Date Format
                    </label>
                    <select value={settings.dateFormat} onChange={e => setSettings({
                  ...settings,
                  dateFormat: e.target.value
                })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Default Currency
                    </label>
                    <select value={settings.currency} onChange={e => setSettings({
                  ...settings,
                  currency: e.target.value
                })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>}

          {/* Email Settings */}
          {activeTab === 'email' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Email Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Provider
                    </label>
                    <select value={settings.emailProvider} onChange={e => setSettings({
                  ...settings,
                  emailProvider: e.target.value
                })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="smtp">Custom SMTP</option>
                    </select>
                  </div>
                  <Input label="SMTP Host" value={settings.smtpHost} onChange={e => setSettings({
                ...settings,
                smtpHost: e.target.value
              })} placeholder="smtp.example.com" />
                  <Input label="SMTP Port" value={settings.smtpPort} onChange={e => setSettings({
                ...settings,
                smtpPort: e.target.value
              })} placeholder="587" />
                  <Input label="SMTP Username" value={settings.smtpUsername} onChange={e => setSettings({
                ...settings,
                smtpUsername: e.target.value
              })} placeholder="username" />
                  <Input label="SMTP Password" type="password" value={settings.smtpPassword} onChange={e => setSettings({
                ...settings,
                smtpPassword: e.target.value
              })} placeholder="••••••••" />
                  <Input label="From Email" type="email" value={settings.fromEmail} onChange={e => setSettings({
                ...settings,
                fromEmail: e.target.value
              })} placeholder="noreply@edumaster.app" />
                  <Input label="From Name" value={settings.fromName} onChange={e => setSettings({
                ...settings,
                fromName: e.target.value
              })} placeholder="EduMaster" />
                </div>
              </div>
            </div>}

          {/* Security Settings */}
          {activeTab === 'security' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Security Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Session Timeout (minutes)" type="number" value={settings.sessionTimeout} onChange={e => setSettings({
                ...settings,
                sessionTimeout: e.target.value
              })} placeholder="30" />
                  <Input label="Password Min Length" type="number" value={settings.passwordMinLength} onChange={e => setSettings({
                ...settings,
                passwordMinLength: e.target.value
              })} placeholder="8" />
                  <Input label="Max Login Attempts" type="number" value={settings.maxLoginAttempts} onChange={e => setSettings({
                ...settings,
                maxLoginAttempts: e.target.value
              })} placeholder="5" />
                  <Input label="Lockout Duration (minutes)" type="number" value={settings.lockoutDuration} onChange={e => setSettings({
                ...settings,
                lockoutDuration: e.target.value
              })} placeholder="15" />
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Require Multi-Factor Authentication
                      </p>
                      <p className="text-sm text-slate-500">
                        Force all users to enable MFA
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.requireMfa} onChange={e => setSettings({
                  ...settings,
                  requireMfa: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Allow Public Signup
                      </p>
                      <p className="text-sm text-slate-500">
                        Let new schools register without approval
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.allowSignup} onChange={e => setSettings({
                  ...settings,
                  allowSignup: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>}

          {/* API Settings */}
          {activeTab === 'api' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  API Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Rate Limit (requests/minute)" type="number" value={settings.apiRateLimit} onChange={e => setSettings({
                ...settings,
                apiRateLimit: e.target.value
              })} placeholder="100" />
                  <Input label="API Timeout (seconds)" type="number" value={settings.apiTimeout} onChange={e => setSettings({
                ...settings,
                apiTimeout: e.target.value
              })} placeholder="30" />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Webhook Secret
                    </label>
                    <div className="relative">
                      <input type={showApiKeys ? 'text' : 'password'} value={settings.webhookSecret} onChange={e => setSettings({
                    ...settings,
                    webhookSecret: e.target.value
                  })} placeholder="Enter webhook secret" className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => setShowApiKeys(!showApiKeys)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Input label="CORS Origins" value={settings.corsOrigins} onChange={e => setSettings({
                  ...settings,
                  corsOrigins: e.target.value
                })} placeholder="* or https://example.com" />
                    <p className="text-xs text-slate-500 mt-1">
                      Comma-separated list of allowed origins
                    </p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Notifications */}
          {activeTab === 'notifications' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Email Notifications
                      </p>
                      <p className="text-sm text-slate-500">
                        Send email notifications for important events
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.emailNotifications} onChange={e => setSettings({
                  ...settings,
                  emailNotifications: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Maintenance Alerts
                      </p>
                      <p className="text-sm text-slate-500">
                        Notify about scheduled maintenance
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.maintenanceAlerts} onChange={e => setSettings({
                  ...settings,
                  maintenanceAlerts: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Security Alerts
                      </p>
                      <p className="text-sm text-slate-500">
                        Alert on suspicious activities
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.securityAlerts} onChange={e => setSettings({
                  ...settings,
                  securityAlerts: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Usage Reports
                      </p>
                      <p className="text-sm text-slate-500">
                        Weekly platform usage summaries
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.usageReports} onChange={e => setSettings({
                  ...settings,
                  usageReports: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>}

          {/* Features */}
          {activeTab === 'features' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Platform Features
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Advanced Reporting
                      </p>
                      <p className="text-sm text-slate-500">
                        Enable advanced analytics and reports
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.enableReporting} onChange={e => setSettings({
                  ...settings,
                  enableReporting: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Bulk Operations
                      </p>
                      <p className="text-sm text-slate-500">
                        Allow bulk import/export operations
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.enableBulkOperations} onChange={e => setSettings({
                  ...settings,
                  enableBulkOperations: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">API Access</p>
                      <p className="text-sm text-slate-500">
                        Enable REST API for integrations
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.enableApiAccess} onChange={e => setSettings({
                  ...settings,
                  enableApiAccess: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Webhooks</p>
                      <p className="text-sm text-slate-500">
                        Enable webhook notifications
                      </p>
                    </div>
                    <input type="checkbox" checked={settings.enableWebhooks} onChange={e => setSettings({
                  ...settings,
                  enableWebhooks: e.target.checked
                })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>}

          {/* Storage */}
          {activeTab === 'storage' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Storage Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Max File Size (MB)" type="number" value={settings.maxFileSize} onChange={e => setSettings({
                ...settings,
                maxFileSize: e.target.value
              })} placeholder="10" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Storage Provider
                    </label>
                    <select value={settings.storageProvider} onChange={e => setSettings({
                  ...settings,
                  storageProvider: e.target.value
                })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="supabase">Supabase Storage</option>
                      <option value="s3">Amazon S3</option>
                      <option value="gcs">Google Cloud Storage</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Allowed File Types
                    </label>
                    <input type="text" value={settings.allowedFileTypes} onChange={e => setSettings({
                  ...settings,
                  allowedFileTypes: e.target.value
                })} placeholder="pdf,doc,docx,xls,xlsx,jpg,png" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-slate-500 mt-1">
                      Comma-separated file extensions
                    </p>
                  </div>
                </div>
              </div>
            </div>}

          {/* Branding */}
          {activeTab === 'branding' && <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Brand Customization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input type="color" value={settings.primaryColor} onChange={e => setSettings({
                    ...settings,
                    primaryColor: e.target.value
                  })} className="w-12 h-10 border border-slate-300 rounded cursor-pointer" />
                      <input type="text" value={settings.primaryColor} onChange={e => setSettings({
                    ...settings,
                    primaryColor: e.target.value
                  })} placeholder="#3B82F6" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <Input label="Logo URL" value={settings.logoUrl} onChange={e => setSettings({
                ...settings,
                logoUrl: e.target.value
              })} placeholder="https://example.com/logo.png" />
                  <Input label="Favicon URL" value={settings.faviconUrl} onChange={e => setSettings({
                ...settings,
                faviconUrl: e.target.value
              })} placeholder="https://example.com/favicon.ico" />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Custom CSS
                    </label>
                    <textarea value={settings.customCss} onChange={e => setSettings({
                  ...settings,
                  customCss: e.target.value
                })} placeholder="/* Add custom CSS here */" rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none" />
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </Card>
    </div>;
}