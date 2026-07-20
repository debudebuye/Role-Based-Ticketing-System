import { useState } from 'react';
import { User, Lock, Bell, Globe, Clock, Target } from 'lucide-react';
import ProfileSettings from '../components/ProfileSettings.jsx';
import SecuritySettings from '../components/SecuritySettings.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PreferencesSettings from '../components/PreferencesSettings.jsx';

const AgentSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'performance', label: 'Performance Goals', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Settings</h1>
        <p className="text-gray-600">
          Manage your work preferences and availability
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
          {activeTab === 'availability' && <AvailabilitySettings user={user} />}
          {activeTab === 'performance' && <PerformanceSettings user={user} />}
        </div>
      </div>
    </div>
  );
};

// Agent-specific Availability Settings
const AvailabilitySettings = ({ user }) => {
  const [availability, setAvailability] = useState({
    workingHours: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    },
    timezone: 'America/New_York',
    autoStatus: true,
    breakReminders: true
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleDayToggle = (day) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          enabled: !prev.workingHours[day].enabled
        }
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Availability Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set your working hours and availability preferences
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={availability.timezone}
              onChange={(e) => setAvailability(prev => ({ ...prev, timezone: e.target.value }))}
              className="input max-w-xs"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Working Hours</h3>
            <div className="space-y-3">
              {days.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="w-20">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={availability.workingHours[day.key].enabled}
                        onChange={() => handleDayToggle(day.key)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                    </label>
                  </div>
                  {availability.workingHours[day.key].enabled && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={availability.workingHours[day.key].start}
                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                        className="input w-24"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={availability.workingHours[day.key].end}
                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                        className="input w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Status Updates</label>
                <p className="text-sm text-gray-500">Automatically update status based on working hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability.autoStatus}
                  onChange={(e) => setAvailability(prev => ({ ...prev, autoStatus: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Break Reminders</label>
                <p className="text-sm text-gray-500">Get reminded to take breaks during long work sessions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability.breakReminders}
                  onChange={(e) => setAvailability(prev => ({ ...prev, breakReminders: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Availability</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Agent-specific Performance Settings
const PerformanceSettings = ({ user }) => {
  const [goals, setGoals] = useState({
    dailyTicketGoal: 8,
    responseTimeGoal: 30, // minutes
    resolutionTimeGoal: 4, // hours
    customerSatisfactionGoal: 4.5,
    enableGoalTracking: true,
    showProgressIndicators: true
  });

  const handleGoalChange = (key, value) => {
    setGoals(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Performance Goals</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set your personal performance targets and tracking preferences
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Ticket Goal
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={goals.dailyTicketGoal}
                onChange={(e) => handleGoalChange('dailyTicketGoal', parseInt(e.target.value))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Number of tickets to handle per day</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Time Goal (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="480"
                value={goals.responseTimeGoal}
                onChange={(e) => handleGoalChange('responseTimeGoal', parseInt(e.target.value))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Target time for first response</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Time Goal (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={goals.resolutionTimeGoal}
                onChange={(e) => handleGoalChange('resolutionTimeGoal', parseInt(e.target.value))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Target time to resolve tickets</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Satisfaction Goal
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={goals.customerSatisfactionGoal}
                onChange={(e) => handleGoalChange('customerSatisfactionGoal', parseFloat(e.target.value))}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Target rating out of 5</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Goal Tracking</label>
                <p className="text-sm text-gray-500">Track progress towards your performance goals</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={goals.enableGoalTracking}
                  onChange={(e) => handleGoalChange('enableGoalTracking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show Progress Indicators</label>
                <p className="text-sm text-gray-500">Display progress bars and indicators in dashboard</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={goals.showProgressIndicators}
                  onChange={(e) => handleGoalChange('showProgressIndicators', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Performance Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Set realistic goals based on your experience level</li>
              <li>• Review and adjust goals monthly</li>
              <li>• Focus on quality over quantity</li>
              <li>• Use goal tracking to identify improvement areas</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Recommended</button>
            <button className="btn btn-primary">Save Performance Goals</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSettings;