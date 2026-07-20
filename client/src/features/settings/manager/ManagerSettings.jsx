import { useState } from 'react';
import { User, Lock, Bell, Globe, Users, BarChart3, Settings } from 'lucide-react';
import ProfileSettings from '../components/ProfileSettings.jsx';
import SecuritySettings from '../components/SecuritySettings.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PreferencesSettings from '../components/PreferencesSettings.jsx';

const ManagerSettings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'team-management', label: 'Team Management', icon: Users },
    { id: 'reporting', label: 'Reporting', icon: BarChart3 },
    { id: 'workflow', label: 'Workflow Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Settings</h1>
        <p className="text-gray-600">
          Manage your team settings and preferences
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
          {activeTab === 'team-management' && <TeamManagementSettings user={user} />}
          {activeTab === 'reporting' && <ReportingSettings user={user} />}
          {activeTab === 'workflow' && <WorkflowSettings user={user} />}
        </div>
      </div>
    </div>
  );
};

// Manager-specific Team Management Settings
const TeamManagementSettings = ({ user }) => {
  const [teamSettings, setTeamSettings] = useState({
    autoAssignTickets: true,
    workloadBalancing: 'round_robin',
    maxTicketsPerAgent: 10,
    escalationTimeout: 24,
    requireApprovalForClosing: false
  });

  const handleSettingChange = (key, value) => {
    setTeamSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Team Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure team settings and ticket assignment rules
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workload Balancing
              </label>
              <select
                value={teamSettings.workloadBalancing}
                onChange={(e) => handleSettingChange('workloadBalancing', e.target.value)}
                className="input"
              >
                <option value="round_robin">Round Robin</option>
                <option value="least_loaded">Least Loaded</option>
                <option value="skill_based">Skill Based</option>
                <option value="manual">Manual Assignment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tickets Per Agent
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={teamSettings.maxTicketsPerAgent}
                onChange={(e) => handleSettingChange('maxTicketsPerAgent', parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Timeout (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={teamSettings.escalationTimeout}
              onChange={(e) => handleSettingChange('escalationTimeout', parseInt(e.target.value))}
              className="input max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically escalate tickets after this many hours
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-assign Tickets</label>
                <p className="text-sm text-gray-500">Automatically assign new tickets to agents</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamSettings.autoAssignTickets}
                  onChange={(e) => handleSettingChange('autoAssignTickets', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require Approval for Closing</label>
                <p className="text-sm text-gray-500">Agents must get approval before closing tickets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={teamSettings.requireApprovalForClosing}
                  onChange={(e) => handleSettingChange('requireApprovalForClosing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Team Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Manager-specific Reporting Settings
const ReportingSettings = ({ user }) => {
  const [reportSettings, setReportSettings] = useState({
    weeklyReports: true,
    monthlyReports: true,
    performanceMetrics: true,
    teamProductivity: true,
    customerSatisfaction: false,
    reportFormat: 'pdf',
    emailReports: true
  });

  const handleReportSettingChange = (key, value) => {
    setReportSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Reporting Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure automated reports and metrics
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <select
              value={reportSettings.reportFormat}
              onChange={(e) => handleReportSettingChange('reportFormat', e.target.value)}
              className="input max-w-xs"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Report Types</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Weekly Reports</label>
                <p className="text-sm text-gray-500">Generate weekly team performance reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.weeklyReports}
                  onChange={(e) => handleReportSettingChange('weeklyReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Performance Metrics</label>
                <p className="text-sm text-gray-500">Include individual agent performance metrics</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.performanceMetrics}
                  onChange={(e) => handleReportSettingChange('performanceMetrics', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Reports</label>
                <p className="text-sm text-gray-500">Automatically email reports to stakeholders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.emailReports}
                  onChange={(e) => handleReportSettingChange('emailReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Preview Report</button>
            <button className="btn btn-primary">Save Report Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Manager-specific Workflow Settings
const WorkflowSettings = ({ user }) => {
  const [workflowSettings, setWorkflowSettings] = useState({
    ticketApprovalRequired: false,
    escalationRules: true,
    slaMonitoring: true,
    customStatuses: false
  });

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Workflow Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure ticket workflow and approval processes
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Ticket Approval Required</label>
                <p className="text-sm text-gray-500">Require manager approval for certain ticket actions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflowSettings.ticketApprovalRequired}
                  onChange={(e) => setWorkflowSettings(prev => ({ ...prev, ticketApprovalRequired: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">SLA Monitoring</label>
                <p className="text-sm text-gray-500">Monitor and enforce service level agreements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflowSettings.slaMonitoring}
                  onChange={(e) => setWorkflowSettings(prev => ({ ...prev, slaMonitoring: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button className="btn btn-secondary">Reset to Default</button>
            <button className="btn btn-primary">Save Workflow Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSettings;