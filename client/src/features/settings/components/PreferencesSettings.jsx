import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const PreferencesSettings = ({ user }) => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    itemsPerPage: 10
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => {
      // TODO: Implement preferences API call
      return Promise.resolve(data);
    },
    onSuccess: () => {
      toast.success('Preferences updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    }
  });

  const handleChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize your application experience
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="input"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="input"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items Per Page
            </label>
            <select
              value={preferences.itemsPerPage}
              onChange={(e) => handleChange('itemsPerPage', parseInt(e.target.value))}
              className="input max-w-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Number of items to display per page in lists
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Theme: <span className="font-medium capitalize">{preferences.theme}</span></p>
              <p>Language: <span className="font-medium">{preferences.language.toUpperCase()}</span></p>
              <p>Date: <span className="font-medium">{new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}</span></p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="btn btn-secondary"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="btn btn-primary"
            >
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettings;