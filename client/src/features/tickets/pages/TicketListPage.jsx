import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../ticket.service.js';
import { ROLES, STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '../../../shared/utils/constants.js';
import { formatDate, debounce } from '../../../shared/utils/helpers.js';

const TicketListPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });

  // Fetch tickets with filters
  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['tickets', { ...filters, search: searchTerm }],
    queryFn: () => ticketService.getAllTickets({ 
      ...filters, 
      search: searchTerm || undefined 
    }),
    refetchInterval: 30000
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || {};

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 500);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600">
            Manage and track support tickets
          </p>
        </div>
        {user?.role === ROLES.CUSTOMER && (
          <Link
            to="/tickets/new"
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Link>
        )}
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="input pl-10"
                onChange={handleSearchChange}
              />
            </div>
            <button className="btn btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-gray-300 rounded w-16"></div>
                        <div className="h-6 bg-gray-300 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading tickets</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link 
                        to={`/tickets/${ticket._id}`}
                        className="text-lg font-medium text-gray-900 hover:text-primary-600"
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                        <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(ticket.createdAt)}
                        </span>
                        {ticket.assignedTo && (
                          <span className="text-sm text-gray-500">
                            Assigned to {ticket.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="btn btn-secondary text-sm px-3 py-1 ml-4"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="btn btn-secondary text-sm px-3 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first ticket.'}
              </p>
              {user?.role === ROLES.CUSTOMER && !searchTerm && (
                <Link
                  to="/tickets/new"
                  className="btn btn-primary"
                >
                  Create Ticket
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketListPage;