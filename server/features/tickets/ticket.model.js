import mongoose from 'mongoose';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORIES } from '../../shared/constants/roles.js';

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    default: TICKET_STATUS.OPEN,
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(TICKET_PRIORITY),
    default: TICKET_PRIORITY.MEDIUM,
    required: true
  },
  category: {
    type: String,
    enum: TICKET_CATEGORIES,
    default: 'general',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  rejectionHistory: [{
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  acceptanceStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  metadata: {
    browser: String,
    os: String,
    device: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text' });

// Virtual for comments count
ticketSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'ticket',
  count: true
});

// Update timestamps when status changes
ticketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case TICKET_STATUS.RESOLVED:
        if (!this.resolvedAt) this.resolvedAt = now;
        break;
      case TICKET_STATUS.CLOSED:
        if (!this.closedAt) this.closedAt = now;
        if (!this.resolvedAt) this.resolvedAt = now;
        break;
    }
  }
  
  if (this.isModified('assignedTo') && this.assignedTo) {
    if (!this.assignedAt) this.assignedAt = new Date();
  }
  
  next();
});

// Virtual for response time (in hours)
ticketSchema.virtual('responseTime').get(function() {
  if (!this.assignedAt) return null;
  return Math.round((this.assignedAt - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for resolution time (in hours)
ticketSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for age (in hours)
ticketSchema.virtual('age').get(function() {
  const endDate = this.closedAt || new Date();
  return Math.round((endDate - this.createdAt) / (1000 * 60 * 60));
});

export const Ticket = mongoose.model('Ticket', ticketSchema);