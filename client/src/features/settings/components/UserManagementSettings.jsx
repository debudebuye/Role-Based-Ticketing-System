import { useState } from 'react';

const UserManagementSettings = ({ user }) => {
  const [userMgmtSettings, setUserMgmtSettings] = useState({
    defaultRole: 'customer',
    autoActivateUsers: false,
    passwordResetExpiry: 24, // hours
    maxLoginAttempts: 5,
    accountLockoutDuration: 30, // minutes
    requireStrongPasswords: true,
    enableUserSelfRegistration: true
  });

  const handleUserMgmtSettingChange = (key, value) => {
    setUserMgmtSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">User Management Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure user account policies and default settings
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Role for New Users
              </label>
              <select
                value={userMgmtSettings.defaultRole}
                onChange={(e) => handleUserMgmtSettingChange('defaultRole', e.target.value)}
                className="input"
              >
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Reset Expiry (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={userMgmtSettings.passwordResetExpiry}
                onChange={(e) => handleUserMgmtSettingChange('passwordResetExpiry', parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={userMgmtSettings.maxLoginAttempts}
                onChange={(e) => handleUserMgmtSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Lockout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={userMgmtSettings.accountLockoutDuration}
                onChange={(e) => handleUserMgmtSettingChange('accountLockoutDuration', parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-activate New Users</label>
                <p className="text-sm text-gray-500">Automatically activate new user accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userMgmtSettings.autoActivateUsers}
                  onChange={(e) => handleUserMgmtSettingChange('autoActivateUsers', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require Strong Passwords</label>
                <p className="text-sm text-gray-500">Enforce strong password requirements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userMgmtSettings.requireStrongPasswords}
                  onChange={(e) => handleUserMgmtSettingChange('requireStrongPasswords', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable User Self-Registration</label>
                <p className="text-sm text-gray-500">Allow users to register their own accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userMgmtSettings.enableUserSelfRegistration}
                  onChange={(e) => handleUserMgmtSettingChange('enableUserSelfRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Security Notice</h4>
            <p className="text-sm text-yellow-800">
              Changes to user management settings affect system security. Review all changes carefully before saving.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save User Management Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementSettings;