import { CommentService } from './comment.service.js';

export class CommentController {
  static async getTicketComments(req, res) {
    const { page, limit } = req.query;
    const pagination = { page, limit };
    
    const result = await CommentService.getTicketComments(
      req.params.ticketId, 
      req.user, 
      pagination
    );
    
    res.json({
      success: true,
      data: result
    });
  }
  
  static async createComment(req, res) {
    const comment = await CommentService.createComment(
      req.params.ticketId, 
      req.body, 
      req.user
    );
    
    // Emit socket events for real-time updates
    const eventData = { comment, ticketId: req.params.ticketId };
    
    // Emit to ticket room for real-time collaboration
    req.io.emitToTicket(req.params.ticketId, 'comment:added', eventData);
    
    // Notify relevant users based on comment visibility
    if (!comment.isInternal) {
      // Public comment - notify all stakeholders
      req.io.emitToRole('admin', 'comment:added', eventData);
      req.io.emitToRole('manager', 'comment:added', eventData);
    } else {
      // Internal comment - only notify staff
      req.io.emitToRole('admin', 'comment:added', eventData);
      req.io.emitToRole('manager', 'comment:added', eventData);
      req.io.emitToRole('agent', 'comment:added', eventData);
    }
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
  }
  
  static async updateComment(req, res) {
    const comment = await CommentService.updateComment(
      req.params.id, 
      req.body, 
      req.user
    );
    
    // Emit socket events for real-time updates
    const eventData = { comment, updatedBy: req.user };
    
    req.io.emitToTicket(comment.ticket, 'comment:updated', eventData);
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });
  }
  
  static async deleteComment(req, res) {
    const comment = await CommentService.getCommentById(req.params.id, req.user);
    const result = await CommentService.deleteComment(req.params.id, req.user);
    
    // Emit socket events for real-time updates
    const eventData = { commentId: req.params.id, ticketId: comment.ticket._id };
    
    req.io.emitToTicket(comment.ticket._id, 'comment:deleted', eventData);
    
    res.json({
      success: true,
      message: result.message
    });
  }
  
  static async getCommentById(req, res) {
    const comment = await CommentService.getCommentById(req.params.id, req.user);
    
    res.json({
      success: true,
      data: { comment }
    });
  }
}