import { useState } from 'react';
import { User, Lock, Bell, Globe, MessageSquare, Star } from 'lucide-react';
import ProfileSettings from '../components/ProfileSettings.jsx';
import SecuritySettings from '../components/SecuritySettings.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PreferencesSettings from '../components/PreferencesSettings.jsx';

const CustomerSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'feedback', label: 'Feedback', icon: Star }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Settings</h1>
        <p className="text-gray-600">
          Manage your account and communication preferences
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
          {activeTab === 'communication' && <CommunicationSettings user={user} />}
          {activeTab === 'feedback' && <FeedbackSettings user={user} />}
        </div>
      </div>
    </div>
  );
};

// Customer-specific Communication Settings
const CommunicationSettings = ({ user }) => {
  const [commSettings, setCommSettings] = useState({
    preferredContactMethod: 'email',
    allowSMSNotifications: false,
    businessHoursOnly: true,
    autoResponseEnabled: true,
    languagePreference: 'en',
    communicationFrequency: 'normal'
  });

  const handleSettingChange = (key, value) => {
    setCommSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Communication Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure how you want to receive updates and communicate with support
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <select
                value={commSettings.preferredContactMethod}
                onChange={(e) => handleSettingChange('preferredContactMethod', e.target.value)}
                className="input"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Frequency
              </label>
              <select
                value={commSettings.communicationFrequency}
                onChange={(e) => handleSettingChange('communicationFrequency', e.target.value)}
                className="input"
              >
                <option value="minimal">Minimal - Only critical updates</option>
                <option value="normal">Normal - Standard updates</option>
                <option value="detailed">Detailed - All updates</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language Preference
            </label>
            <select
              value={commSettings.languagePreference}
              onChange={(e) => handleSettingChange('languagePreference', e.target.value)}
              className="input max-w-xs"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow SMS Notifications</label>
                <p className="text-sm text-gray-500">Receive urgent notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={commSettings.allowSMSNotifications}
                  onChange={(e) => handleSettingChange('allowSMSNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Business Hours Only</label>
                <p className="text-sm text-gray-500">Only receive non-urgent communications during business hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={commSettings.businessHoursOnly}
                  onChange={(e) => handleSettingChange('businessHoursOnly', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-Response Enabled</label>
                <p className="text-sm text-gray-500">Automatically acknowledge receipt of your messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={commSettings.autoResponseEnabled}
                  onChange={(e) => handleSettingChange('autoResponseEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">📞 Contact Information</h4>
            <p className="text-sm text-green-800">
              Your current contact preferences ensure you'll receive important updates about your tickets. 
              You can change these settings at any time.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Communication Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer-specific Feedback Settings
const FeedbackSettings = ({ user }) => {
  const [feedbackSettings, setFeedbackSettings] = useState({
    enableFeedbackRequests: true,
    feedbackFrequency: 'after_resolution',
    anonymousFeedback: false,
    improvementSuggestions: true,
    satisfactionSurveys: true
  });

  const handleFeedbackSettingChange = (key, value) => {
    setFeedbackSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Feedback Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure how you want to provide feedback and participate in surveys
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Request Frequency
            </label>
            <select
              value={feedbackSettings.feedbackFrequency}
              onChange={(e) => handleFeedbackSettingChange('feedbackFrequency', e.target.value)}
              className="input max-w-xs"
            >
              <option value="never">Never</option>
              <option value="after_resolution">After ticket resolution</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How often you want to be asked for feedback
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Feedback Requests</label>
                <p className="text-sm text-gray-500">Allow the system to request feedback on your experience</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedbackSettings.enableFeedbackRequests}
                  onChange={(e) => handleFeedbackSettingChange('enableFeedbackRequests', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Anonymous Feedback</label>
                <p className="text-sm text-gray-500">Submit feedback without revealing your identity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedbackSettings.anonymousFeedback}
                  onChange={(e) => handleFeedbackSettingChange('anonymousFeedback', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Improvement Suggestions</label>
                <p className="text-sm text-gray-500">Receive requests for suggestions on service improvements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedbackSettings.improvementSuggestions}
                  onChange={(e) => handleFeedbackSettingChange('improvementSuggestions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Satisfaction Surveys</label>
                <p className="text-sm text-gray-500">Participate in periodic satisfaction surveys</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedbackSettings.satisfactionSurveys}
                  onChange={(e) => handleFeedbackSettingChange('satisfactionSurveys', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Why Feedback Matters</h4>
            <p className="text-sm text-blue-800">
              Your feedback helps us improve our service quality and ensures we're meeting your needs. 
              All feedback is reviewed by our team to enhance the support experience.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Feedback Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;