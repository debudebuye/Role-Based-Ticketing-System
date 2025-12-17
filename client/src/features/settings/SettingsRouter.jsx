import { useAuth } from '../auth/auth.context.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import ManagerSettings from './manager/ManagerSettings.jsx';
import AgentSettings from './agent/AgentSettings.jsx';
import CustomerSettings from './customer/CustomerSettings.jsx';

const SettingsRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminSettings user={user} />;
    case 'manager':
      return <ManagerSettings user={user} />;
    case 'agent':
      return <AgentSettings user={user} />;
    case 'customer':
      return <CustomerSettings user={user} />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Invalid user role</p>
        </div>
      );
  }
};

export default SettingsRouter;