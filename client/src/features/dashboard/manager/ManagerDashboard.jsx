import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Users, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../../tickets/ticket.service.js';

const ManagerDashboard = () => {
  // Fetch ticket statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['manager-ticket-stats'],
    queryFn: ticketService.getTicketStats,
    refetchInterval: 30000
  });

  // Calculate unassigned tickets (open tickets without assignedTo)
  const { data: ticketsData } = useQuery({
    queryKey: ['unassigned-tickets'],
    queryFn: () => ticketService.getAllTickets({ 
      status: 'open',
      page: 1,
      limit: 100
    }),
    refetchInterval: 30000
  });

  const unassignedCount = ticketsData?.tickets?.filter(ticket => !ticket.assignedTo).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Manager Dashboard
        </h1>
        <p className="text-gray-600">
          Team performance and ticket management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Ticket className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
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
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">{unassignedCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Users className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.open || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Resolution (hrs)</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.avgResolutionTime?.toFixed(1) || '0.0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/tickets" className="btn btn-primary flex items-center justify-center">
            <Ticket className="h-4 w-4 mr-2" />
            View All Tickets
          </Link>
          <Link to="/users" className="btn btn-secondary flex items-center justify-center">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Link>
          <Link to="/tickets?status=open" className="btn btn-secondary flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" />
            Assign Tickets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;