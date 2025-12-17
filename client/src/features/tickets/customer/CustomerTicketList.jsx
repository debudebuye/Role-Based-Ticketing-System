import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Ticket, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../ticket.service.js';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../../../shared/utils/constants.js';
import { formatDate, debounce } from '../../../shared/utils/helpers.js';

const CustomerTicketList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });

  // Fetch customer's own tickets
  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['customer-tickets', { ...filters, search: searchTerm }],
    queryFn: () => ticketService.getAllTickets({ 
      ...filters, 
      search: searchTerm || undefined,
      createdBy: user._id // Only show customer's own tickets
    }),
    refetchInterval: 30000
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || {};

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, 500);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600">
            Track your support requests and their progress
          </p>
        </div>
        <Link
          to="new"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Link>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search your tickets..."
                  className="input pl-10"
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="input"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
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
                        to={ticket._id}
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
                        <span className="badge badge-gray">
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(ticket.createdAt)}
                        </span>
                        {ticket.assignedTo && (
                          <span className="text-sm text-gray-500">
                            Assigned to {ticket.assignedTo.name}
                          </span>
                        )}
                        {ticket.resolvedAt && (
                          <span className="text-sm text-green-600">
                            Resolved {formatDate(ticket.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={ticket._id}
                        className="btn btn-secondary text-sm px-3 py-1 flex items-center"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        View Details
                      </Link>
                    </div>
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
                {searchTerm ? 'Try adjusting your search terms.' : 'You haven\'t created any tickets yet.'}
              </p>
              {!searchTerm && (
                <Link
                  to="new"
                  className="btn btn-primary"
                >
                  Create Your First Ticket
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTicketList;