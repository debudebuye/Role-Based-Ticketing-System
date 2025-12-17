import { useAuth } from '../auth/auth.context.jsx';
import { ROLES } from '../../shared/utils/constants.js';
import AdminTicketList from './admin/AdminTicketList.jsx';
import AgentTicketList from './agent/AgentTicketList.jsx';
import CustomerTicketList from './customer/CustomerTicketList.jsx';
import ManagerTicketList from './manager/ManagerTicketList.jsx';

const TicketRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  switch (user.role) {
    case ROLES.ADMIN:
      return <AdminTicketList />;
    case ROLES.MANAGER:
      return <ManagerTicketList />;
    case ROLES.AGENT:
      return <AgentTicketList />;
    case ROLES.CUSTOMER:
      return <CustomerTicketList />;
    default:
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Your role does not have access to tickets.</p>
        </div>
      );
  }
};

export default TicketRouter;