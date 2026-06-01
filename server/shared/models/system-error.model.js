/**
 * SystemError model
 *
 * Persists server-side 5xx errors to MongoDB so the admin UI can display
 * a live error feed without requiring log file access.
 *
 * Only operational errors (AppError) and unexpected 5xx responses are stored.
 * 4xx client errors are intentionally excluded — they're too noisy and not
 * actionable from an admin perspective.
 */

import mongoose from 'mongoose';

const systemErrorSchema = new mongoose.Schema({
  message:    { type: String, required: true },
  stack:      { type: String },
  statusCode: { type: Number, default: 500 },
  method:     { type: String },
  url:        { type: String },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail:  { type: String, default: null },
  ip:         { type: String },
  userAgent:  { type: String },
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date,    default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps:  true,
  toJSON:      { versionKey: false },
  toObject:    { versionKey: false },
});

systemErrorSchema.index({ createdAt: -1 });
systemErrorSchema.index({ resolved: 1, createdAt: -1 });
systemErrorSchema.index({ statusCode: 1 });

export const SystemError = mongoose.model('SystemError', systemErrorSchema);
