import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Ticket, Users, BarChart3, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../ticket.service.js';
import { userService } from '../../users/user.service.js';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../../../shared/utils/constants.js';
import { formatDate, debounce } from '../../../shared/utils/helpers.js';

const ManagerTicketList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, unassigned, team
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    page: 1,
    limit: 10
  });

  // Fetch tickets based on active tab
  const getTicketFilters = () => {
    const baseFilters = { ...filters, search: searchTerm || undefined };
    
    switch (activeTab) {
      case 'unassigned':
        return { ...baseFilters, assignedTo: 'unassigned' };
      case 'team':
        return { ...baseFilters, department: user.department };
      case 'overview':
      default:
        return baseFilters;
    }
  };

  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['manager-tickets', activeTab, { ...filters, search: searchTerm }],
    queryFn: () => ticketService.getAllTickets(getTicketFilters()),
    refetchInterval: 30000
  });

  // Fetch agents for assignment
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => userService.getAgents()
  });

  // Fetch ticket stats
  const { data: stats } = useQuery({
    queryKey: ['manager-ticket-stats'],
    queryFn: () => ticketService.getTicketStats(),
    refetchInterval: 60000
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || {};

  // Assign ticket mutation
  const assignMutation = useMutation({
    mutationFn: ({ ticketId, agentId }) => ticketService.assignTicket(ticketId, agentId),
    onSuccess: () => {
      toast.success('Ticket assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['manager-tickets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    }
  });

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

  const handleAssign = (ticketId, agentId) => {
    assignMutation.mutate({ ticketId, agentId });
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'unassigned', label: 'Unassigned', icon: Ticket },
    { key: 'team', label: 'Team Tickets', icon: Users }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Management (Manager)</h1>
          <p className="text-gray-600">
            Oversee team tickets and manage assignments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/users"
            className="btn btn-secondary flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Team
          </Link>
          <Link
            to="/reports"
            className="btn btn-secondary flex items-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Ticket className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Ticket className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unassigned || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <Ticket className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-danger-100 rounded-lg">
                <Ticket className="h-6 w-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
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
                  placeholder="Search tickets..."
                  className="input pl-10"
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
                <option value="feature_request">Feature Request</option>
              </select>

              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="input"
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                {agents?.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name}
                  </option>
                ))}
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
                    <div className="h-8 bg-gray-300 rounded w-32"></div>
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
                        <span className="badge badge-gray">
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(ticket.createdAt)}
                        </span>
                        <span className="text-sm text-gray-500">
                          by {ticket.createdBy?.name || 'Unknown'}
                        </span>
                        {ticket.assignedTo ? (
                          <span className="text-sm text-gray-500">
                            → {ticket.assignedTo.name}
                          </span>
                        ) : (
                          <span className="text-sm text-red-500">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!ticket.assignedTo && agents && (
                        <select
                          onChange={(e) => e.target.value && handleAssign(ticket._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Assign to...</option>
                          {agents.map((agent) => (
                            <option key={agent._id} value={agent._id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="btn btn-primary text-sm px-3 py-1"
                      >
                        Manage
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
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'No tickets match your criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerTicketList;