import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../../tickets/ticket.service.js';
import { formatDate } from '../../../shared/utils/helpers.js';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../../../shared/utils/constants.js';

const AgentDashboard = () => {
  const { user } = useAuth();

  // Fetch ticket statistics for agent
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['agent-ticket-stats'],
    queryFn: ticketService.getTicketStats,
    refetchInterval: 30000
  });

  // Fetch assigned tickets for agent
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['agent-assigned-tickets'],
    queryFn: () => ticketService.getAllTickets({ 
      page: 1, 
      limit: 10, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    }),
    refetchInterval: 30000
  });

  const assignedTickets = ticketsData?.tickets || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Agent Dashboard
        </h1>
        <p className="text-gray-600">
          Your assigned tickets and workload
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Ticket className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.inProgress || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.resolved || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.urgent || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* My Tickets */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Assigned Tickets</h2>
            <Link
              to="/tickets"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="p-6">
          {ticketsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : assignedTickets.length > 0 ? (
            <div className="space-y-4">
              {assignedTickets.map((ticket) => (
                <div key={ticket._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{ticket.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                      <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {formatDate(ticket.createdAt)}
                      </span>
                      {ticket.createdBy && (
                        <span className="text-xs text-gray-500">
                          by {ticket.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="btn btn-primary text-sm px-3 py-1"
                    >
                      Work on it
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tickets assigned yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Tickets will appear here when they are assigned to you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;