import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Settings, Save, Globe, Mail, Shield, Database, Zap, Bell, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, Server, Code, Palette, FileText, ChevronRight, Layout } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const Toggle = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export function PlatformSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('general');
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

  const sections = [
    { id: 'general', label: 'General', icon: Globe, description: 'Basic platform configuration' },
    { id: 'email', label: 'Email', icon: Mail, description: 'SMTP and delivery settings' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Access control and protection' },
    { id: 'api', label: 'API & Integrations', icon: Code, description: 'Developer access and webhooks' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts and messaging' },
    { id: 'features', label: 'Feature Flags', icon: Zap, description: 'Toggle platform capabilities' },
    { id: 'storage', label: 'Storage', icon: Database, description: 'File handling and limits' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Look and feel customization' },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-blue-600' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className={activeSection === section.id ? 'text-blue-900' : 'text-slate-900'}>{section.label}</div>
                <div className={`text-xs font-normal truncate max-w-[140px] ${activeSection === section.id ? 'text-blue-500' : 'text-slate-400'}`}>
                  {section.description}
                </div>
              </div>
              {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-6">
          {/* General Settings */}
          {activeSection === 'general' && <Card className="p-6"><div className="space-y-6">
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
            </div></Card>
          }

          {/* Email Settings */}
          {activeSection === 'email' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Email Configuration</h3>
                  <p className="text-sm text-slate-500">Manage SMTP settings and email delivery providers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Security Policies</h3>
                  <p className="text-sm text-slate-500">Configure access controls, timeouts, and authentication rules.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-medium text-slate-900 mb-4">Authentication Rules</h4>
                  <div className="space-y-1">
                    <Toggle 
                      label="Require Multi-Factor Authentication" 
                      description="Force all administrators and staff to enable MFA for their accounts."
                      checked={settings.requireMfa} 
                      onChange={(checked) => setSettings({ ...settings, requireMfa: checked })} 
                    />
                    <Toggle 
                      label="Allow Public Signup" 
                      description="Allow new schools to register via the public landing page."
                      checked={settings.allowSignup} 
                      onChange={(checked) => setSettings({ ...settings, allowSignup: checked })} 
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* API Settings */}
          {activeSection === 'api' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">API & Integrations</h3>
                  <p className="text-sm text-slate-500">Manage developer access, rate limits, and webhooks.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">System Notifications</h3>
                  <p className="text-sm text-slate-500">Control what alerts are sent to administrators and users.</p>
                </div>
                <div className="space-y-1">
                  <Toggle 
                    label="Email Notifications" 
                    description="Send transactional emails for system events."
                    checked={settings.emailNotifications} 
                    onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })} 
                  />
                  <Toggle 
                    label="Maintenance Alerts" 
                    description="Notify users about scheduled maintenance windows."
                    checked={settings.maintenanceAlerts} 
                    onChange={(checked) => setSettings({ ...settings, maintenanceAlerts: checked })} 
                  />
                  <Toggle 
                    label="Security Alerts" 
                    description="Immediate alerts for suspicious login attempts or API abuse."
                    checked={settings.securityAlerts} 
                    onChange={(checked) => setSettings({ ...settings, securityAlerts: checked })} 
                  />
                  <Toggle 
                    label="Weekly Usage Reports" 
                    description="Send summary reports of platform activity to super admins."
                    checked={settings.usageReports} 
                    onChange={(checked) => setSettings({ ...settings, usageReports: checked })} 
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Features */}
          {activeSection === 'features' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Feature Flags</h3>
                  <p className="text-sm text-slate-500">Enable or disable global platform capabilities.</p>
                </div>
                <div className="space-y-1">
                  <Toggle 
                    label="Advanced Reporting" 
                    description="Enable complex analytics dashboards for schools."
                    checked={settings.enableReporting} 
                    onChange={(checked) => setSettings({ ...settings, enableReporting: checked })} 
                  />
                  <Toggle 
                    label="Bulk Operations" 
                    description="Allow bulk import/export of students and staff data."
                    checked={settings.enableBulkOperations} 
                    onChange={(checked) => setSettings({ ...settings, enableBulkOperations: checked })} 
                  />
                  <Toggle 
                    label="API Access" 
                    description="Allow schools to generate API keys for third-party integrations."
                    checked={settings.enableApiAccess} 
                    onChange={(checked) => setSettings({ ...settings, enableApiAccess: checked })} 
                  />
                  <Toggle 
                    label="Webhooks" 
                    description="Enable event-driven webhooks for external systems."
                    checked={settings.enableWebhooks} 
                    onChange={(checked) => setSettings({ ...settings, enableWebhooks: checked })} 
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Storage */}
          {activeSection === 'storage' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Storage Configuration</h3>
                  <p className="text-sm text-slate-500">Manage file upload limits and storage backends.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </Card>
          )}

          {/* Branding */}
          {activeSection === 'branding' && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Brand Customization</h3>
                  <p className="text-sm text-slate-500">Customize the look and feel of the platform.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input type="color" value={settings.primaryColor} onChange={e => setSettings({
                    ...settings,
                    primaryColor: e.target.value
                  })} className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer p-1 bg-white" />
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
            </Card>
          )}
        </div>
    </div>
  </div>;
}