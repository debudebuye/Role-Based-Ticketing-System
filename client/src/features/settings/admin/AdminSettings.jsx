import { useState } from 'react';
import { User, Lock, Bell, Globe, Settings, Shield, Database, Users } from 'lucide-react';
import ProfileSettings from '../components/ProfileSettings.jsx';
import SecuritySettings from '../components/SecuritySettings.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PreferencesSettings from '../components/PreferencesSettings.jsx';
import SystemSettings from '../components/SystemSettings.jsx';
import UserManagementSettings from '../components/UserManagementSettings.jsx';

const AdminSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'system', label: 'System Settings', icon: Settings },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'security-policies', label: 'Security Policies', icon: Shield },
    { id: 'database', label: 'Database', icon: Database }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">
          Manage system-wide settings and configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Menu */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'security' && <SecuritySettings user={user} />}
          {activeTab === 'notifications' && <NotificationSettings user={user} />}
          {activeTab === 'preferences' && <PreferencesSettings user={user} />}
          {activeTab === 'system' && <SystemSettings user={user} />}
          {activeTab === 'user-management' && <UserManagementSettings user={user} />}
          {activeTab === 'security-policies' && <SecurityPoliciesSettings user={user} />}
          {activeTab === 'database' && <DatabaseSettings user={user} />}
        </div>
      </div>
    </div>
  );
};

// Admin-specific Security Policies Settings
const SecurityPoliciesSettings = ({ user }) => {
  const [policies, setPolicies] = useState({
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorRequired: false,
    ipWhitelisting: false
  });

  const handlePolicyChange = (key, value) => {
    setPolicies(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Security Policies</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure system-wide security policies
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={policies.passwordMinLength}
                onChange={(e) => handlePolicyChange('passwordMinLength', parseInt(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={policies.sessionTimeout}
                onChange={(e) => handlePolicyChange('sessionTimeout', parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require Special Characters</label>
                <p className="text-sm text-gray-500">Passwords must contain special characters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policies.passwordRequireSpecialChars}
                  onChange={(e) => handlePolicyChange('passwordRequireSpecialChars', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Two-Factor Authentication Required</label>
                <p className="text-sm text-gray-500">Require 2FA for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policies.twoFactorRequired}
                  onChange={(e) => handlePolicyChange('twoFactorRequired', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">IP Whitelisting</label>
                <p className="text-sm text-gray-500">Restrict access to specific IP addresses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policies.ipWhitelisting}
                  onChange={(e) => handlePolicyChange('ipWhitelisting', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Security Policies</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin-specific Database Settings
const DatabaseSettings = ({ user }) => {
  const [dbSettings, setDbSettings] = useState({
    backupFrequency: 'daily',
    retentionPeriod: 30,
    compressionEnabled: true,
    encryptionEnabled: true
  });

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Database Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure database backup and maintenance settings
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={dbSettings.backupFrequency}
                onChange={(e) => setDbSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="input"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Period (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={dbSettings.retentionPeriod}
                onChange={(e) => setDbSettings(prev => ({ ...prev, retentionPeriod: parseInt(e.target.value) }))}
                className="input"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Compression Enabled</label>
                <p className="text-sm text-gray-500">Compress database backups to save space</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dbSettings.compressionEnabled}
                  onChange={(e) => setDbSettings(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Encryption Enabled</label>
                <p className="text-sm text-gray-500">Encrypt database backups for security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dbSettings.encryptionEnabled}
                  onChange={(e) => setDbSettings(prev => ({ ...prev, encryptionEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-yellow-800">
              Changes to database settings may affect system performance. Please consult with your database administrator before making changes.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Test Connection</button>
            <button className="btn btn-primary">Save Database Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;