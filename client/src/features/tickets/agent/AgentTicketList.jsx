import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Ticket, Clock, CheckCircle, Play, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/auth.context.jsx';
import { ticketService } from '../ticket.service.js';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../../../shared/utils/constants.js';
import { formatDate, debounce } from '../../../shared/utils/helpers.js';

const AgentTicketList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('assigned'); // assigned, available, all
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });
  const [rejectingTicket, setRejectingTicket] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch tickets based on active tab
  const getTicketFilters = () => {
    const baseFilters = { ...filters, search: searchTerm || undefined };
    
    switch (activeTab) {
      case 'assigned':
        return { ...baseFilters, assignedTo: user._id };
      case 'available':
        return { ...baseFilters, assignedTo: 'unassigned', status: 'open' };
      case 'all':
        return baseFilters;
      default:
        return { ...baseFilters, assignedTo: user._id };
    }
  };

  const { data: ticketsData, isLoading, error } = useQuery({
    queryKey: ['agent-tickets', activeTab, { ...filters, search: searchTerm }],
    queryFn: () => ticketService.getAllTickets(getTicketFilters()),
    refetchInterval: 30000
  });

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination || {};

  // Self-assign mutation
  const selfAssignMutation = useMutation({
    mutationFn: (ticketId) => ticketService.assignTicket(ticketId, user._id),
    onSuccess: () => {
      toast.success('Ticket assigned to you successfully!');
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }) => ticketService.updateTicket(ticketId, { status }),
    onSuccess: () => {
      toast.success('Ticket status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    }
  });

  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: (ticketId) => ticketService.acceptTicket(ticketId),
    onSuccess: () => {
      toast.success('Ticket accepted! You can now start working on it.');
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept ticket');
    }
  });

  // Reject ticket mutation
  const rejectTicketMutation = useMutation({
    mutationFn: ({ ticketId, reason }) => ticketService.rejectTicket(ticketId, reason),
    onSuccess: () => {
      toast.success('Ticket rejected and returned to the pool.');
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject ticket');
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

  const handleSelfAssign = (ticketId) => {
    selfAssignMutation.mutate(ticketId);
  };

  const handleStartWork = (ticketId) => {
    updateStatusMutation.mutate({ ticketId, status: 'in_progress' });
  };

  const handleAcceptTicket = (ticketId) => {
    acceptTicketMutation.mutate(ticketId);
  };

  const handleRejectTicket = (ticketId, reason) => {
    if (!reason) {
      setRejectingTicket(ticketId);
      return;
    }
    rejectTicketMutation.mutate({ ticketId, reason });
    setRejectingTicket(null);
    setRejectionReason('');
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    handleRejectTicket(rejectingTicket, rejectionReason);
  };

  const handleRejectCancel = () => {
    setRejectingTicket(null);
    setRejectionReason('');
  };

  // Calculate counts for tab badges
  const pendingCount = tickets.filter(t => t.assignedTo?._id === user._id && t.acceptanceStatus === 'pending').length;
  const acceptedCount = tickets.filter(t => t.assignedTo?._id === user._id && t.acceptanceStatus === 'accepted').length;
  
  const tabs = [
    { key: 'assigned', label: 'My Tickets', icon: Ticket, count: activeTab === 'assigned' ? tickets.length : null },
    { key: 'available', label: 'Available', icon: Clock, count: activeTab === 'available' ? tickets.length : null },
    { key: 'all', label: 'All Tickets', icon: CheckCircle, count: activeTab === 'all' ? tickets.length : null }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets (Agent)</h1>
          <p className="text-gray-600">
            Manage your assigned tickets and pick up new work
          </p>
        </div>
        
        {/* Quick status summary */}
        {activeTab === 'assigned' && tickets.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            {pendingCount > 0 && (
              <div className="flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                <Clock className="h-4 w-4 mr-1" />
                {pendingCount} pending action
              </div>
            )}
            {acceptedCount > 0 && (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
                <CheckCircle className="h-4 w-4 mr-1" />
                {acceptedCount} accepted
              </div>
            )}
          </div>
        )}
      </div>

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
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {/* Show pending action badge for assigned tab */}
                {tab.key === 'assigned' && pendingCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-600">
                    {pendingCount} pending
                  </span>
                )}
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
                <div key={ticket._id} className={`border rounded-lg p-4 mb-4 ${
                  ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'rejected' 
                    ? 'bg-red-50 border-red-200' 
                    : ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'pending'
                    ? 'bg-blue-50 border-blue-200'
                    : ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'accepted'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {ticket.title}
                        </h3>
                        {/* Show acceptance status badge prominently */}
                        {ticket.assignedTo && ticket.assignedTo._id === user._id && (
                          <span className={`badge text-xs ${
                            ticket.acceptanceStatus === 'accepted' ? 'badge-success' :
                            ticket.acceptanceStatus === 'rejected' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {ticket.acceptanceStatus === 'accepted' ? '✓ Accepted' :
                             ticket.acceptanceStatus === 'rejected' ? '✗ Rejected' :
                             '⏳ Pending Action'}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                        <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                        <span className="badge badge-gray">
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(ticket.createdAt)} by {ticket.createdBy?.name || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Show rejection reason if ticket was rejected by this agent */}
                      {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'rejected' && ticket.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                          <strong>Rejected:</strong> {ticket.rejectionReason}
                        </div>
                      )}
                      
                      {/* Show pending acceptance notification */}
                      {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'pending' && (
                        <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-800 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <strong>Action Required:</strong> Please accept or reject this ticket assignment.
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons - now more prominent on the right */}
                    <div className="flex flex-col space-y-2 ml-4 min-w-max">
                      {/* Available tickets - self assign */}
                      {activeTab === 'available' && !ticket.assignedTo && (
                        <>
                          <button
                            onClick={() => handleSelfAssign(ticket._id)}
                            disabled={selfAssignMutation.isPending}
                            className="btn btn-primary text-sm px-4 py-2 flex items-center justify-center min-w-[120px]"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {selfAssignMutation.isPending ? 'Taking...' : 'Take It'}
                          </button>
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="btn btn-secondary text-sm px-4 py-2 text-center min-w-[120px]"
                          >
                            Review Details
                          </Link>
                        </>
                      )}
                      
                      {/* Pending assignment - show accept/reject buttons prominently */}
                      {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptTicket(ticket._id)}
                            disabled={acceptTicketMutation.isPending}
                            className="btn btn-success text-sm px-4 py-2 flex items-center justify-center min-w-[120px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {acceptTicketMutation.isPending ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectTicket(ticket._id)}
                            disabled={rejectTicketMutation.isPending}
                            className="btn btn-danger text-sm px-4 py-2 flex items-center justify-center min-w-[120px]"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {rejectTicketMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </button>
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="btn btn-secondary text-sm px-4 py-2 text-center min-w-[120px]"
                          >
                            Review Details
                          </Link>
                        </>
                      )}
                      
                      {/* Accepted tickets - show work button */}
                      {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'accepted' && (
                        <>
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleStartWork(ticket._id)}
                              disabled={updateStatusMutation.isPending}
                              className="btn btn-success text-sm px-4 py-2 flex items-center justify-center min-w-[120px]"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {updateStatusMutation.isPending ? 'Starting...' : 'Start Work'}
                            </button>
                          )}
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="btn btn-primary text-sm px-4 py-2 text-center min-w-[120px]"
                          >
                            Work on it
                          </Link>
                        </>
                      )}
                      
                      {/* Rejected tickets - show view only */}
                      {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'rejected' && (
                        <Link
                          to={`/tickets/${ticket._id}`}
                          className="btn btn-secondary text-sm px-4 py-2 text-center min-w-[120px]"
                        >
                          View Details
                        </Link>
                      )}
                      
                      {/* Other agents' tickets or unassigned in 'all' tab */}
                      {activeTab === 'all' && (ticket.assignedTo?._id !== user._id || !ticket.assignedTo) && (
                        <>
                          {!ticket.assignedTo && (
                            <button
                              onClick={() => handleSelfAssign(ticket._id)}
                              disabled={selfAssignMutation.isPending}
                              className="btn btn-primary text-sm px-4 py-2 flex items-center justify-center min-w-[120px]"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {selfAssignMutation.isPending ? 'Taking...' : 'Take It'}
                            </button>
                          )}
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="btn btn-secondary text-sm px-4 py-2 text-center min-w-[120px]"
                          >
                            {!ticket.assignedTo ? 'Review' : 'View Details'}
                          </Link>
                        </>
                      )}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'assigned' ? 'No tickets assigned' : 
                 activeTab === 'available' ? 'No available tickets' : 'No tickets found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'assigned' ? 'Tickets will appear here when they are assigned to you.' :
                 activeTab === 'available' ? 'Check back later for new tickets to work on.' :
                 searchTerm ? 'Try adjusting your search terms or filters.' : 'No tickets match your criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Ticket</h3>
              <button
                onClick={handleRejectCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Rejecting tickets may impact your performance metrics.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection *
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input w-full mb-3"
                required
              >
                <option value="">Select a reason...</option>
                <option value="Workload too high - cannot take on additional tickets">Workload too high</option>
                <option value="Lack of expertise in this area">Lack of expertise</option>
                <option value="Currently working on higher priority tickets">Higher priority work</option>
                <option value="Insufficient information provided">Insufficient information</option>
                <option value="Requires specialized knowledge I don't have">Requires specialized knowledge</option>
                <option value="Time constraints - cannot meet expected deadline">Time constraints</option>
              </select>

              {rejectionReason && !rejectionReason.startsWith('Workload') && !rejectionReason.startsWith('Lack') && !rejectionReason.startsWith('Currently') && !rejectionReason.startsWith('Insufficient') && !rejectionReason.startsWith('Requires') && !rejectionReason.startsWith('Time') && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="input resize-none w-full"
                  placeholder="Please provide a detailed reason..."
                  required
                />
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRejectSubmit}
                disabled={rejectTicketMutation.isPending || !rejectionReason.trim()}
                className="btn btn-danger flex-1"
              >
                {rejectTicketMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejecting...
                  </div>
                ) : (
                  'Reject Ticket'
                )}
              </button>
              <button
                onClick={handleRejectCancel}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTicketList;