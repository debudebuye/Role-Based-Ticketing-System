import { TicketService } from './ticket.service.js';

export class TicketController {
  static async getAllTickets(req, res) {
    const { 
      page, limit, sortBy, sortOrder, 
      status, priority, category, assignedTo, 
      search, dateFrom, dateTo 
    } = req.query;
    
    const filters = { status, priority, category, assignedTo, search, dateFrom, dateTo };
    const pagination = { page, limit, sortBy, sortOrder };
    
    const result = await TicketService.getAllTickets(req.user, filters, pagination);
    
    res.json({
      success: true,
      data: result
    });
  }
  
  static async getTicketById(req, res) {
    const ticket = await TicketService.getTicketById(req.params.id, req.user);
    
    res.json({
      success: true,
      data: { ticket }
    });
  }
  
  static async createTicket(req, res) {
    const ticket = await TicketService.createTicket(req.body, req.user);
    
    // Emit socket events for real-time updates
    req.io.emitToRole('admin', 'ticket:created', { ticket });
    req.io.emitToRole('manager', 'ticket:created', { ticket });
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: { ticket }
    });
  }
  
  static async updateTicket(req, res) {
    const oldTicket = await TicketService.getTicketById(req.params.id, req.user);
    const ticket = await TicketService.updateTicket(req.params.id, req.body, req.user);
    
    // Emit socket events for real-time updates
    const eventData = { ticket, oldTicket, updatedBy: req.user };
    
    // Notify relevant users
    req.io.emitToRole('admin', 'ticket:updated', eventData);
    req.io.emitToRole('manager', 'ticket:updated', eventData);
    
    if (ticket.assignedTo) {
      req.io.emitToUser(ticket.assignedTo._id, 'ticket:updated', eventData);
    }
    
    if (ticket.createdBy._id.toString() !== req.user._id.toString()) {
      req.io.emitToUser(ticket.createdBy._id, 'ticket:updated', eventData);
    }
    
    // Emit to ticket room for real-time collaboration
    req.io.emitToTicket(ticket._id, 'ticket:updated', eventData);
    
    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket }
    });
  }
  
  static async deleteTicket(req, res) {
    const result = await TicketService.deleteTicket(req.params.id, req.user);
    
    // Emit socket events
    req.io.emitToRole('admin', 'ticket:deleted', { ticketId: req.params.id });
    req.io.emitToRole('manager', 'ticket:deleted', { ticketId: req.params.id });
    
    res.json({
      success: true,
      message: result.message
    });
  }
  
  static async assignTicket(req, res) {
    const { assignedTo } = req.body;
    const ticket = await TicketService.assignTicket(req.params.id, assignedTo, req.user);
    
    // Emit socket events
    const eventData = { ticket, assignedBy: req.user };
    
    req.io.emitToRole('admin', 'ticket:assigned', eventData);
    req.io.emitToRole('manager', 'ticket:assigned', eventData);
    req.io.emitToUser(assignedTo, 'ticket:assigned', eventData);
    req.io.emitToUser(ticket.createdBy._id, 'ticket:assigned', eventData);
    
    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: { ticket }
    });
  }

  static async acceptTicket(req, res) {
    const ticket = await TicketService.acceptTicket(req.params.id, req.user);
    
    // Emit socket events
    const eventData = { ticket, acceptedBy: req.user };
    
    req.io.emitToRole('admin', 'ticket:accepted', eventData);
    req.io.emitToRole('manager', 'ticket:accepted', eventData);
    req.io.emitToUser(ticket.createdBy._id, 'ticket:accepted', eventData);
    req.io.emitToUser(ticket.assignedBy?._id, 'ticket:accepted', eventData);
    
    res.json({
      success: true,
      message: 'Ticket accepted successfully',
      data: { ticket }
    });
  }

  static async rejectTicket(req, res) {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const ticket = await TicketService.rejectTicket(req.params.id, reason, req.user);
    
    // Emit socket events
    const eventData = { ticket, rejectedBy: req.user, reason };
    
    req.io.emitToRole('admin', 'ticket:rejected', eventData);
    req.io.emitToRole('manager', 'ticket:rejected', eventData);
    req.io.emitToUser(ticket.createdBy._id, 'ticket:rejected', eventData);
    req.io.emitToUser(ticket.assignedBy?._id, 'ticket:rejected', eventData);
    
    res.json({
      success: true,
      message: 'Ticket rejected successfully',
      data: { ticket }
    });
  }
  
  static async getTicketStats(req, res) {
    const stats = await TicketService.getTicketStats(req.user);
    
    res.json({
      success: true,
      data: { stats }
    });
  }
}