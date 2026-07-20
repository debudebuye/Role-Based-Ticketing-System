// Role-based ticket components
export { default as AdminTicketList } from './admin/AdminTicketList.jsx';
export { default as AgentTicketList } from './agent/AgentTicketList.jsx';
export { default as CustomerTicketList } from './customer/CustomerTicketList.jsx';
export { default as ManagerTicketList } from './manager/ManagerTicketList.jsx';

// Shared ticket components
export { default as TicketDetailPage } from './pages/TicketDetailPage.jsx';
export { default as UpdateStatusModal } from './components/UpdateStatusModal.jsx';
export { default as AssignTicketModal } from './components/AssignTicketModal.jsx';

// Services
export { ticketService } from './ticket.service.js';