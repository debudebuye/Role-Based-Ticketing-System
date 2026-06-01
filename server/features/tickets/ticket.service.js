import { Ticket } from './ticket.model.js';
import { AuditLog } from './audit.model.js';
import { User } from '../users/user.model.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { ROLES, TICKET_STATUS } from '../../shared/constants/roles.js';
import logger from '../../shared/utils/logger.js';

export class TicketService {
  // ─── Audit helper ────────────────────────────────────────────────────────────
  static async _audit(ticketId, action, performedBy, changes = {}, meta = {}) {
    try {
      await AuditLog.create({ ticketId, action, performedBy: performedBy._id, changes, meta });
    } catch (err) {
      // Audit failure must never break the main operation
      logger.error('Audit log error', { err });
    }
  }

  // ─── Diff helper ─────────────────────────────────────────────────────────────
  static _diff(original, updated) {
    const changes = {};
    for (const key of Object.keys(updated)) {
      const from = original[key]?.toString?.() ?? original[key];
      const to   = updated[key]?.toString?.() ?? updated[key];
      if (from !== to) changes[key] = { from, to };
    }
    return changes;
  }

  // ─── getAllTickets ────────────────────────────────────────────────────────────
  static async getAllTickets(user, filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { status, priority, category, assignedTo, search, dateFrom, dateTo } = filters;

    // Sanitise pagination — cap limit to prevent DoS via huge result sets
    const safePage  = Math.max(1, parseInt(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Allowlist sortBy to prevent arbitrary field exposure
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status', 'title', 'category'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

    let query = {};

    switch (user.role) {
      case ROLES.CUSTOMER:
        query.createdBy = user._id;
        break;
      case ROLES.AGENT:
        // Agents see only their assigned tickets + unassigned open tickets (not all tickets)
        query.$or = [
          { assignedTo: user._id },
          { assignedTo: null, status: TICKET_STATUS.OPEN }
        ];
        break;
      // MANAGER and ADMIN see everything — no filter
    }

    if (status)     query.status   = status;
    if (priority)   query.priority = priority;
    if (category)   query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      // Use the text index when the query is a simple keyword search (no role $or).
      // Fall back to $regex for combined role-visibility + search queries so we
      // can wrap both conditions in $and without losing the role filter.
      if (!query.$or) {
        query.$text = { $search: search };
      } else {
        const searchConditions = [
          { title:       { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags:        { $in: [new RegExp(search, 'i')] } }
        ];
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      }
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (safePage - 1) * safeLimit;
    const sort = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Ticket.countDocuments(query)
    ]);

    return {
      tickets,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
    };
  }

  // ─── getTicketById ───────────────────────────────────────────────────────────
  static async getTicketById(ticketId, user) {
    const ticket = await Ticket.findById(ticketId)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('commentsCount');

    if (!ticket) throw new AppError('Ticket not found', 404);

    if (!this.canUserAccessTicket(ticket, user)) {
      throw new AppError('Access denied', 403);
    }

    return ticket;
  }

  // ─── createTicket ────────────────────────────────────────────────────────────
  static async createTicket(ticketData, user) {
    const ticket = await Ticket.create({ ...ticketData, createdBy: user._id });
    await ticket.populate('createdBy', 'name email role');

    await this._audit(ticket._id, 'created', user, {}, { title: ticket.title });

    return ticket;
  }

  // ─── updateTicket ────────────────────────────────────────────────────────────
  static async updateTicket(ticketId, updateData, user) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (!this.canUserUpdateTicket(ticket, user, updateData)) {
      throw new AppError('Access denied', 403);
    }

    if (updateData.assignedTo && updateData.assignedTo !== ticket.assignedTo?.toString()) {
      updateData.assignedBy = user._id;
    }

    const changes = this._diff(ticket.toObject(), updateData);

    // Determine action type for audit
    let action = 'updated';
    if (updateData.status && updateData.status !== ticket.status) action = 'status_changed';
    else if (updateData.priority && updateData.priority !== ticket.priority) action = 'priority_changed';
    else if (updateData.assignedTo) action = 'assigned';

    Object.assign(ticket, updateData);
    await ticket.save();

    await ticket.populate([
      { path: 'createdBy',  select: 'name email role' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    await this._audit(ticketId, action, user, changes);

    return ticket;
  }

  // ─── deleteTicket (soft) ─────────────────────────────────────────────────────
  static async deleteTicket(ticketId, user) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    const createdById = ticket.createdBy?._id ?? ticket.createdBy;
    const isOwner     = createdById.toString() === user._id.toString();
    const isAdmin     = user.role === ROLES.ADMIN;

    if (!isAdmin && !isOwner) {
      throw new AppError('Access denied', 403);
    }

    // Customers can only delete tickets that haven't been picked up yet.
    // Once an agent is working on it, only an admin can delete it.
    if (!isAdmin && isOwner) {
      const nonDeletableStatuses = [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED];
      if (nonDeletableStatuses.includes(ticket.status)) {
        throw new AppError(
          `Cannot delete a ticket that is ${ticket.status.replace('_', ' ')}. Contact an administrator if needed.`,
          403
        );
      }
    }

    ticket.isDeleted  = true;
    ticket.deletedAt  = new Date();
    ticket.deletedBy  = user._id;
    await ticket.save();

    await this._audit(ticketId, 'deleted', user);

    return { message: 'Ticket deleted successfully' };
  }

  // ─── assignTicket ────────────────────────────────────────────────────────────
  static async assignTicket(ticketId, agentId, user) {
    const agent = await User.findOne({ _id: agentId, role: ROLES.AGENT, isActive: true });
    if (!agent) throw new AppError('Agent not found or inactive', 404);

    const ticket = await this.updateTicket(ticketId, {
      assignedTo: agentId,
      acceptanceStatus: 'pending',
      assignedAt: new Date()
    }, user);

    return ticket;
  }

  // ─── acceptTicket ────────────────────────────────────────────────────────────
  static async acceptTicket(ticketId, user) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (ticket.assignedTo?.toString() !== user._id.toString()) {
      throw new AppError('You can only accept tickets assigned to you', 403);
    }
    if (ticket.acceptanceStatus === 'accepted') {
      throw new AppError('Ticket is already accepted', 400);
    }

    ticket.acceptanceStatus = 'accepted';
    ticket.acceptedAt       = new Date();
    ticket.status           = TICKET_STATUS.IN_PROGRESS;
    await ticket.save();

    await ticket.populate([
      { path: 'createdBy',  select: 'name email role' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    await this._audit(ticketId, 'accepted', user);

    return ticket;
  }

  // ─── rejectTicket ────────────────────────────────────────────────────────────
  static async rejectTicket(ticketId, rejectionReason, user) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (ticket.assignedTo?.toString() !== user._id.toString()) {
      throw new AppError('You can only reject tickets assigned to you', 403);
    }
    if (ticket.acceptanceStatus === 'accepted') {
      throw new AppError('Cannot reject an already accepted ticket', 400);
    }

    // Validate rejection reason length
    const reason = rejectionReason?.trim() ?? '';
    if (!reason) throw new AppError('Rejection reason is required', 400);
    if (reason.length < 10) throw new AppError('Rejection reason must be at least 10 characters', 400);
    if (reason.length > 500) throw new AppError('Rejection reason cannot exceed 500 characters', 400);

    ticket.rejectionHistory.push({ rejectedBy: user._id, reason, rejectedAt: new Date() });
    ticket.acceptanceStatus = 'rejected';
    ticket.rejectedAt       = new Date();
    ticket.rejectionReason  = reason;
    ticket.assignedTo       = null;
    ticket.status           = TICKET_STATUS.OPEN;
    await ticket.save();

    await ticket.populate([
      { path: 'createdBy',                   select: 'name email role' },
      { path: 'assignedBy',                  select: 'name email' },
      { path: 'rejectionHistory.rejectedBy', select: 'name email' }
    ]);

    await this._audit(ticketId, 'rejected', user, {}, { reason });

    return ticket;
  }

  // ─── getTicketStats ──────────────────────────────────────────────────────────
  static async getTicketStats(user) {
    let matchStage = {};

    switch (user.role) {
      case ROLES.CUSTOMER:
        matchStage.createdBy = user._id;
        break;
      case ROLES.AGENT:
        matchStage.assignedTo = user._id;
        break;
    }

    const stats = await Ticket.aggregate([
      { $match: { ...matchStage, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total:             { $sum: 1 },
          open:              { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.OPEN] },        1, 0] } },
          inProgress:        { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.IN_PROGRESS] }, 1, 0] } },
          resolved:          { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.RESOLVED] },    1, 0] } },
          closed:            { $sum: { $cond: [{ $eq: ['$status', TICKET_STATUS.CLOSED] },      1, 0] } },
          urgent:            { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high:              { $sum: { $cond: [{ $eq: ['$priority', 'high'] },   1, 0] } },
          avgResolutionTime: {
            // resolutionTime is a virtual — compute it directly in the pipeline
            // from the stored resolvedAt and createdAt fields (result in hours)
            $avg: {
              $cond: [
                { $and: [{ $ifNull: ['$resolvedAt', false] }, { $ifNull: ['$createdAt', false] }] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3_600_000] },
                null
              ]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
      urgent: 0, high: 0, avgResolutionTime: 0
    };
  }

  // ─── getTicketAuditLog ───────────────────────────────────────────────────────
  static async getTicketAuditLog(ticketId, user) {
    // Only admin and manager can view audit logs
    if (![ROLES.ADMIN, ROLES.MANAGER].includes(user.role)) {
      throw new AppError('Access denied', 403);
    }

    const logs = await AuditLog.find({ ticketId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    return logs;
  }

  // ─── Permission helpers ──────────────────────────────────────────────────────
  static canUserAccessTicket(ticket, user) {
    // assignedTo may be a raw ObjectId or a populated User document
    const assignedToId = ticket.assignedTo?._id ?? ticket.assignedTo;

    switch (user.role) {
      case ROLES.ADMIN:
      case ROLES.MANAGER:
        return true;
      case ROLES.AGENT:
        // Agents can view their assigned tickets or unassigned open tickets
        return (
          assignedToId?.toString() === user._id.toString() ||
          (!ticket.assignedTo && ticket.status === TICKET_STATUS.OPEN)
        );
      case ROLES.CUSTOMER: {
        const createdById = ticket.createdBy?._id ?? ticket.createdBy;
        return createdById.toString() === user._id.toString();
      }
      default:
        return false;
    }
  }

  static canUserUpdateTicket(ticket, user, updateData) {
    // assignedTo may be a raw ObjectId or a populated User document
    const assignedToId = ticket.assignedTo?._id ?? ticket.assignedTo;

    switch (user.role) {
      case ROLES.ADMIN:
      case ROLES.MANAGER:
        return true;
      case ROLES.AGENT: {
        const allowedFields  = ['status'];
        const updateFields   = Object.keys(updateData);
        return (
          assignedToId?.toString() === user._id.toString() &&
          ticket.acceptanceStatus === 'accepted' &&
          updateFields.every(f => allowedFields.includes(f))
        );
      }
      case ROLES.CUSTOMER: {
        const customerAllowed = ['title', 'description', 'priority'];
        const createdById     = ticket.createdBy?._id ?? ticket.createdBy;
        return (
          createdById.toString() === user._id.toString() &&
          ticket.status === TICKET_STATUS.OPEN &&
          Object.keys(updateData).every(f => customerAllowed.includes(f))
        );
      }
      default:
        return false;
    }
  }
}
