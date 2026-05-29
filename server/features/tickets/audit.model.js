import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'deleted',
      'assigned', 'unassigned',
      'accepted', 'rejected',
      'status_changed', 'priority_changed'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // { field: { from, to } }
    default: {}
  },
  meta: {
    type: mongoose.Schema.Types.Mixed, // extra context (e.g. rejection reason)
    default: {}
  }
}, {
  timestamps: true
});

auditLogSchema.index({ ticketId: 1, createdAt: -1 });
// Auto-expire audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
