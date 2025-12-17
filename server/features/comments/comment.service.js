import { Comment } from './comment.model.js';
import { Ticket } from '../tickets/ticket.model.js';
import { TicketService } from '../tickets/ticket.service.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';

export class CommentService {
  static async getTicketComments(ticketId, user, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    
    // Verify user can access the ticket
    const ticket = await TicketService.getTicketById(ticketId, user);
    
    // Build query - filter internal comments based on user role
    let query = { ticket: ticketId };
    
    if (user.role === ROLES.CUSTOMER) {
      query.isInternal = false; // Customers can't see internal comments
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('author', 'name email role')
        .populate('editedBy', 'name email')
        .sort({ createdAt: 1 }) // Oldest first for conversation flow
        .skip(skip)
        .limit(limit),
      Comment.countDocuments(query)
    ]);
    
    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  static async createComment(ticketId, commentData, user) {
    // Verify user can access the ticket
    const ticket = await TicketService.getTicketById(ticketId, user);
    
    // Only agents, managers, and admins can create internal comments
    if (commentData.isInternal && user.role === ROLES.CUSTOMER) {
      throw new AppError('Customers cannot create internal comments', 403);
    }
    
    const comment = await Comment.create({
      ...commentData,
      ticket: ticketId,
      author: user._id
    });
    
    await comment.populate('author', 'name email role');
    
    return comment;
  }
  
  static async updateComment(commentId, updateData, user) {
    const comment = await Comment.findById(commentId)
      .populate('author', 'name email role');
    
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }
    
    // Check if user can update this comment
    const canUpdate = this.canUserUpdateComment(comment, user);
    if (!canUpdate) {
      throw new AppError('Access denied', 403);
    }
    
    // Update comment
    comment.content = updateData.content;
    comment.editedAt = new Date();
    comment.editedBy = user._id;
    
    await comment.save();
    await comment.populate('editedBy', 'name email');
    
    return comment;
  }
  
  static async deleteComment(commentId, user) {
    const comment = await Comment.findById(commentId)
      .populate('author', 'name email role');
    
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }
    
    // Check if user can delete this comment
    const canDelete = this.canUserDeleteComment(comment, user);
    if (!canDelete) {
      throw new AppError('Access denied', 403);
    }
    
    await Comment.findByIdAndDelete(commentId);
    return { message: 'Comment deleted successfully' };
  }
  
  static async getCommentById(commentId, user) {
    const comment = await Comment.findById(commentId)
      .populate('author', 'name email role')
      .populate('editedBy', 'name email')
      .populate('ticket');
    
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }
    
    // Verify user can access the ticket
    const canAccess = TicketService.canUserAccessTicket(comment.ticket, user);
    if (!canAccess) {
      throw new AppError('Access denied', 403);
    }
    
    // Filter internal comments for customers
    if (user.role === ROLES.CUSTOMER && comment.isInternal) {
      throw new AppError('Access denied', 403);
    }
    
    return comment;
  }
  
  static canUserUpdateComment(comment, user) {
    // Users can only update their own comments
    if (comment.author._id.toString() !== user._id.toString()) {
      return false;
    }
    
    // Comments can only be edited within 15 minutes of creation
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (comment.createdAt < fifteenMinutesAgo) {
      return false;
    }
    
    return true;
  }
  
  static canUserDeleteComment(comment, user) {
    // Admins can delete any comment
    if (user.role === ROLES.ADMIN) {
      return true;
    }
    
    // Users can delete their own comments
    if (comment.author._id.toString() === user._id.toString()) {
      return true;
    }
    
    return false;
  }
}