import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Clock, User, Send, CheckCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ticketService } from '../ticket.service.js';
import { commentService } from '../../comments/comment.service.js';
import { formatDate, getInitials } from '../../../shared/utils/helpers.js';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, ROLES } from '../../../shared/utils/constants.js';
import { useAuth } from '../../auth/auth.context.jsx';
import UpdateStatusModal from '../components/UpdateStatusModal.jsx';
import AssignTicketModal from '../components/AssignTicketModal.jsx';
import AgentStatusModal from '../components/AgentStatusModal.jsx';
import RejectTicketModal from '../components/RejectTicketModal.jsx';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch ticket data
  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getTicketById(id),
    enabled: !!id
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentService.getTicketComments(id),
    enabled: !!id
  });

  const comments = commentsData?.comments || [];

  // Comment form
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (commentData) => commentService.createComment(id, commentData),
    onSuccess: () => {
      toast.success('Comment added successfully!');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      reset();
      setShowCommentForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (updateData) => ticketService.updateTicket(id, updateData),
    onSuccess: () => {
      toast.success('Ticket status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setShowStatusModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    }
  });

  // Assign ticket mutation (for managers/admins)
  const assignTicketMutation = useMutation({
    mutationFn: (agentId) => ticketService.assignTicket(id, agentId),
    onSuccess: () => {
      toast.success('Ticket assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setShowAssignModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    }
  });



  // Accept ticket mutation
  const acceptTicketMutation = useMutation({
    mutationFn: () => ticketService.acceptTicket(id),
    onSuccess: () => {
      toast.success('Ticket accepted! You can now start working on it.');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept ticket');
    }
  });

  // Reject ticket mutation
  const rejectTicketMutation = useMutation({
    mutationFn: (reason) => ticketService.rejectTicket(id, reason),
    onSuccess: () => {
      toast.success('Ticket rejected and returned to the pool.');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setShowRejectModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject ticket');
    }
  });

  const onSubmitComment = (data) => {
    createCommentMutation.mutate(data);
  };

  const handleStatusUpdate = (updateData) => {
    updateStatusMutation.mutate(updateData);
  };

  const handleTicketAssign = (agentId) => {
    assignTicketMutation.mutate(agentId);
  };



  const handleAcceptTicket = () => {
    acceptTicketMutation.mutate();
  };

  const handleRejectTicket = (reason) => {
    rejectTicketMutation.mutate(reason);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-32 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <div className="card p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket._id}</h1>
          <p className="text-gray-600">{ticket.title}</p>
        </div>
      </div>

      {/* Acceptance Status Banner */}
      {user?.role === ROLES.AGENT && ticket.assignedTo?._id === user._id && (
        <div className={`card ${
          ticket.acceptanceStatus === 'pending' ? 'bg-blue-50 border-blue-200' :
          ticket.acceptanceStatus === 'accepted' ? 'bg-green-50 border-green-200' :
          ticket.acceptanceStatus === 'rejected' ? 'bg-red-50 border-red-200' :
          'bg-gray-50'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {ticket.acceptanceStatus === 'pending' && (
                  <>
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Assignment Pending</h3>
                      <p className="text-sm text-blue-700">This ticket has been assigned to you. Please accept or reject the assignment.</p>
                    </div>
                  </>
                )}
                {ticket.acceptanceStatus === 'accepted' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900">Assignment Accepted</h3>
                      <p className="text-sm text-green-700">You have accepted this ticket and can now work on it.</p>
                    </div>
                  </>
                )}
                {ticket.acceptanceStatus === 'rejected' && (
                  <>
                    <X className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-900">Assignment Rejected</h3>
                      <p className="text-sm text-red-700">You rejected this ticket: {ticket.rejectionReason}</p>
                    </div>
                  </>
                )}
              </div>
              
              {ticket.acceptanceStatus === 'pending' && (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleAcceptTicket}
                    disabled={acceptTicketMutation.isPending}
                    className="btn btn-success text-sm px-3 py-1"
                  >
                    {acceptTicketMutation.isPending ? 'Accepting...' : 'Accept'}
                  </button>
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    disabled={rejectTicketMutation.isPending}
                    className="btn btn-danger text-sm px-3 py-1"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments ({comments.length})
                </h2>
                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="btn btn-primary text-sm px-3 py-1"
                >
                  Add Comment
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Comment Form */}
              {showCommentForm && (
                <form onSubmit={handleSubmit(onSubmitComment)} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <textarea
                      {...register('content', {
                        required: 'Comment content is required',
                        minLength: {
                          value: 1,
                          message: 'Comment cannot be empty'
                        }
                      })}
                      rows={4}
                      className="input resize-none"
                      placeholder="Add your comment..."
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>
                  
                  {user?.role !== 'customer' && (
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('isInternal')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Internal comment (only visible to staff)
                        </span>
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={createCommentMutation.isPending}
                      className="btn btn-primary text-sm flex items-center"
                    >
                      {createCommentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Comment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCommentForm(false);
                        reset();
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {getInitials(comment.author?.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.author?.name || 'Unknown User'}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                          {comment.isInternal && (
                            <span className="badge badge-warning text-xs">Internal</span>
                          )}
                          {comment.isEdited && (
                            <span className="text-xs text-gray-400">(edited)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No comments yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start the conversation by adding a comment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <div className="mt-1">
                    <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <div className="mt-1">
                    <span className="badge badge-gray">
                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                    </span>
                  </div>
                </div>

                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ticket.tags.map((tag, index) => (
                        <span key={index} className="badge badge-gray text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(ticket.createdAt)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Created By</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <User className="h-4 w-4 mr-1" />
                    {ticket.createdBy?.name || 'Unknown User'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {ticket.assignedTo ? (
                      <div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {ticket.assignedTo.name}
                        </div>
                        {ticket.acceptanceStatus && (
                          <div className="mt-1">
                            <span className={`badge text-xs ${
                              ticket.acceptanceStatus === 'accepted' ? 'badge-success' :
                              ticket.acceptanceStatus === 'rejected' ? 'badge-danger' :
                              'badge-warning'
                            }`}>
                              {ticket.acceptanceStatus === 'accepted' ? 'Accepted' :
                               ticket.acceptanceStatus === 'rejected' ? 'Rejected' :
                               'Pending Acceptance'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>

                {ticket.dueDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(ticket.dueDate)}
                    </div>
                  </div>
                )}

                {ticket.resolvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Resolved At</label>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(ticket.resolvedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="btn btn-primary w-full"
                >
                  {showCommentForm ? 'Cancel Comment' : 'Add Comment'}
                </button>
                
                {/* Role-specific action buttons */}
                {user?.role === ROLES.ADMIN && (
                  <>
                    <button 
                      onClick={() => setShowStatusModal(true)}
                      className="btn btn-secondary w-full"
                    >
                      Update Status
                    </button>
                    <button 
                      onClick={() => setShowAssignModal(true)}
                      className="btn btn-secondary w-full"
                    >
                      Assign Ticket
                    </button>
                  </>
                )}
                
                {user?.role === ROLES.MANAGER && (
                  <>
                    <button 
                      onClick={() => setShowStatusModal(true)}
                      className="btn btn-secondary w-full"
                    >
                      Update Status
                    </button>
                    <button 
                      onClick={() => setShowAssignModal(true)}
                      className="btn btn-secondary w-full"
                    >
                      Assign Ticket
                    </button>
                  </>
                )}
                
                {user?.role === ROLES.AGENT && (
                  <>
                    {/* Accept/Reject buttons for pending assignments */}
                    {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'pending' && (
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg mb-3">
                          <p className="text-sm text-blue-800 font-medium">
                            This ticket has been assigned to you. Please accept or reject the assignment.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button 
                            onClick={handleAcceptTicket}
                            disabled={acceptTicketMutation.isPending}
                            className="btn btn-success text-sm py-2"
                          >
                            {acceptTicketMutation.isPending ? 'Accepting...' : 'Accept'}
                          </button>
                          <button 
                            onClick={() => setShowRejectModal(true)}
                            disabled={rejectTicketMutation.isPending}
                            className="btn btn-danger text-sm py-2"
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Status update for accepted tickets */}
                    {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'accepted' && (
                      <button 
                        onClick={() => setShowStatusModal(true)}
                        className="btn btn-secondary w-full"
                      >
                        Update Status
                      </button>
                    )}
                    
                    {/* Unassigned tickets - agents can only view */}
                    {!ticket.assignedTo && (
                      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                        This ticket is unassigned. Only managers can assign tickets to agents.
                      </div>
                    )}
                    
                    {/* Show rejection info */}
                    {ticket.assignedTo?._id === user._id && ticket.acceptanceStatus === 'rejected' && (
                      <div className="text-sm text-red-600 p-3 bg-red-50 rounded">
                        You rejected this ticket: {ticket.rejectionReason}
                      </div>
                    )}
                    
                    {/* Show assignment info for other agents' tickets */}
                    {ticket.assignedTo && ticket.assignedTo._id !== user._id && (
                      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                        This ticket is assigned to {ticket.assignedTo.name}
                        {ticket.acceptanceStatus === 'pending' && (
                          <span className="block text-orange-600 mt-1">
                            (Pending acceptance)
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {user?.role === ROLES.CUSTOMER && (
                  <>
                    {/* Customers can only update their own tickets if they're still open */}
                    {ticket.createdBy?._id === user._id && ticket.status === 'open' && (
                      <button 
                        onClick={() => setShowStatusModal(true)}
                        className="btn btn-secondary w-full"
                      >
                        Update Ticket
                      </button>
                    )}
                    
                    {/* Show ticket status info for customers */}
                    {ticket.status !== 'open' && (
                      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                        This ticket is {STATUS_LABELS[ticket.status].toLowerCase()}
                        {ticket.assignedTo && ` and assigned to ${ticket.assignedTo.name}`}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER) && (
        <>
          <UpdateStatusModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            ticket={ticket}
            onUpdate={handleStatusUpdate}
            isLoading={updateStatusMutation.isPending}
          />

          <AssignTicketModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            ticket={ticket}
            onAssign={handleTicketAssign}
            isLoading={assignTicketMutation.isPending}
          />
        </>
      )}

      {user?.role === ROLES.AGENT && (
        <>
          <AgentStatusModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            ticket={ticket}
            onUpdate={handleStatusUpdate}
            isLoading={updateStatusMutation.isPending}
          />
          
          <RejectTicketModal
            isOpen={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            ticket={ticket}
            onReject={handleRejectTicket}
            isLoading={rejectTicketMutation.isPending}
          />
        </>
      )}

      {user?.role === ROLES.CUSTOMER && (
        <UpdateStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          ticket={ticket}
          onUpdate={handleStatusUpdate}
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};

export default TicketDetailPage;