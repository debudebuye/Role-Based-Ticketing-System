import { Ticket } from './ticket.model.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { ROLES, TICKET_STATUS } from '../../shared/constants/roles.js';

export class TicketService {
  static async getAllTickets(user, filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { status, priority, category, assignedTo, search, dateFrom, dateTo } = filters;
    
    // Build query based on user role
    let query = {};
    
    switch (user.role) {
      case ROLES.CUSTOMER:
        query.createdBy = user._id;
        break;
      case ROLES.AGENT:
        // Agents can see all tickets for visibility, but can only work on assigned ones
        // No filtering needed - they can see everything
        break;
      case ROLES.MANAGER:
      case ROLES.ADMIN:
        // Can see all tickets
        break;
    }
    
    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute queries
    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query)
    ]);
    
    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getTicketById(ticketId, user) {
    const ticket = await Ticket.findById(ticketId)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('commentsCount');
    
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    
    // Check permissions
    const canView = this.canUserAccessTicket(ticket, user);
    if (!canView) {
      throw new AppError('Access denied', 403);
    }
    
    return ticket;
  }
  
  static async createTicket(ticketData, user) {
    const ticket = await Ticket.create({
      ...ticketData,
      createdBy: user._id
    });
    
    await ticket.populate('createdBy', 'name email role');
    
    return ticket;
  }
  
  static async updateTicket(ticketId, updateData, user) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    
    // Check permissions
    const canUpdate = this.canUserUpdateTicket(ticket, user, updateData);
    if (!canUpdate) {
      throw new AppError('Access denied', 403);
    }
    
    // Track who made the assignment
    if (updateData.assignedTo && updateData.assignedTo !== ticket.assignedTo?.toString()) {
      updateData.assignedBy = user._id;
    }
    
    Object.assign(ticket, updateData);
    await ticket.save();
    
    await ticket.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' }
    ]);
    
    return ticket;
  }
  
  static async deleteTicket(ticketId, user) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    
    // Only admin or ticket creator can delete
    const createdById = ticket.createdBy?._id || ticket.createdBy;
    if (user.role !== ROLES.ADMIN && createdById.toString() !== user._id.toString()) {
      throw new AppError('Access denied', 403);
    }
    
    await Ticket.findByIdAndDelete(ticketId);
    return { message: 'Ticket deleted successfully' };
  }
  
  static async assignTicket(ticketId, agentId, user) {
    // Verify agent exists and is active
    const agent = await User.findOne({ 
      _id: agentId, 
      role: ROLES.AGENT, 
      isActive: true 
    });
    
    if (!agent) {
      throw new AppError('Agent not found or inactive', 404);
    }
    
    const ticket = await this.updateTicket(ticketId, { 
      assignedTo: agentId,
      acceptanceStatus: 'pending',
      assignedAt: new Date()
    }, user);
    
    return ticket;
  }

  static async acceptTicket(ticketId, user) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    
    // Only assigned agent can accept
    if (ticket.assignedTo?.toString() !== user._id.toString()) {
      throw new AppError('You can only accept tickets assigned to you', 403);
    }
    
    if (ticket.acceptanceStatus === 'accepted') {
      throw new AppError('Ticket is already accepted', 400);
    }
    
    ticket.acceptanceStatus = 'accepted';
    ticket.acceptedAt = new Date();
    ticket.status = TICKET_STATUS.IN_PROGRESS;
    
    await ticket.save();
    
    await ticket.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' }
    ]);
    
    return ticket;
  }

  static async rejectTicket(ticketId, rejectionReason, user) {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }
    
    // Only assigned agent can reject
    if (ticket.assignedTo?.toString() !== user._id.toString()) {
      throw new AppError('You can only reject tickets assigned to you', 403);
    }
    
    if (ticket.acceptanceStatus === 'accepted') {
      throw new AppError('Cannot reject an already accepted ticket', 400);
    }
    
    // Add to rejection history
    ticket.rejectionHistory.push({
      rejectedBy: user._id,
      reason: rejectionReason,
      rejectedAt: new Date()
    });
    
    // Update ticket status
    ticket.acceptanceStatus = 'rejected';
    ticket.rejectedAt = new Date();
    ticket.rejectionReason = rejectionReason;
    ticket.assignedTo = null; // Unassign the ticket
    ticket.status = TICKET_STATUS.OPEN; // Back to open status
    
    await ticket.save();
    
    await ticket.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'rejectionHistory.rejectedBy', select: 'name email' }
    ]);
    
    return ticket;
  }
  
  static async getTicketStats(user) {
    let matchStage = {};
    
    // Filter based on user role
    switch (user.role) {
      case ROLES.CUSTOMER:
        matchStage.createdBy = user._id;
        break;
      case ROLES.AGENT:
        matchStage.assignedTo = user._id;
        break;
      case ROLES.MANAGER:
      case ROLES.ADMIN:
        // Can see all tickets
        break;
    }
    
    const stats = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.OPEN] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.IN_PROGRESS] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.RESOLVED] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.CLOSED] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          avgResolutionTime: { $avg: '$resolutionTime' }
        }
      }
    ]);
    
    return stats[0] || {
      total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
      urgent: 0, high: 0, avgResolutionTime: 0
    };
  }
  
  static canUserAccessTicket(ticket, user) {
    switch (user.role) {
      case ROLES.ADMIN:
      case ROLES.MANAGER:
        return true;
      case ROLES.AGENT:
        // Agents can view all tickets for visibility and awareness
        return true;
      case ROLES.CUSTOMER:
        // Handle both populated and non-populated createdBy
        const createdById = ticket.createdBy?._id || ticket.createdBy;
        return createdById.toString() === user._id.toString();
      default:
        return false;
    }
  }
  
  static canUserUpdateTicket(ticket, user, updateData) {
    switch (user.role) {
      case ROLES.ADMIN:
        return true;
      case ROLES.MANAGER:
        return true;
      case ROLES.AGENT:
        // Agents can only update tickets that are assigned to them AND accepted
        const allowedFields = ['status'];
        const updateFields = Object.keys(updateData);
        return ticket.assignedTo?.toString() === user._id.toString() &&
               ticket.acceptanceStatus === 'accepted' &&
               updateFields.every(field => allowedFields.includes(field));
      case ROLES.CUSTOMER:
        // Customers can only update their own tickets and limited fields
        const customerAllowedFields = ['title', 'description', 'priority'];
        const customerUpdateFields = Object.keys(updateData);
        const createdById = ticket.createdBy?._id || ticket.createdBy;
        return createdById.toString() === user._id.toString() &&
               ticket.status === TICKET_STATUS.OPEN &&
               customerUpdateFields.every(field => customerAllowedFields.includes(field));
      default:
        return false;
    }
  }
}