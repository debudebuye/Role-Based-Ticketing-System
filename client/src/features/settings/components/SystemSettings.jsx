import { useState } from 'react';

const SystemSettings = ({ user }) => {
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 30, // minutes
    enableLogging: true,
    logLevel: 'info'
  });

  const handleSystemSettingChange = (key, value) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure system-wide settings and parameters
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max File Upload Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={systemSettings.maxFileUploadSize}
                onChange={(e) => handleSystemSettingChange('maxFileUploadSize', parseInt(e.target.value))}
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
                value={systemSettings.sessionTimeout}
                onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={systemSettings.logLevel}
              onChange={(e) => handleSystemSettingChange('logLevel', e.target.value)}
              className="input max-w-xs"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <p className="text-sm text-gray-500">Enable maintenance mode to restrict access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => handleSystemSettingChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow Registration</label>
                <p className="text-sm text-gray-500">Allow new users to register accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.allowRegistration}
                  onChange={(e) => handleSystemSettingChange('allowRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Verification Required</label>
                <p className="text-sm text-gray-500">Require email verification for new accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.emailVerificationRequired}
                  onChange={(e) => handleSystemSettingChange('emailVerificationRequired', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Logging</label>
                <p className="text-sm text-gray-500">Enable system activity logging</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.enableLogging}
                  onChange={(e) => handleSystemSettingChange('enableLogging', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save System Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;