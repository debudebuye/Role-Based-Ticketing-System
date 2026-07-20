/**
 * SystemConfig model
 *
 * Stores admin-controlled runtime configuration as a single document
 * (singleton pattern — always _id: 'global').
 *
 * The server reads relevant settings at request time so changes take
 * effect immediately without a restart.
 */

import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },

  // ── Registration ────────────────────────────────────────────────────────────
  allowRegistration: { type: Boolean, default: true },

  // ── Logging ─────────────────────────────────────────────────────────────────
  logLevel: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug'],
    default: 'info',
  },

  // ── Security policy ─────────────────────────────────────────────────────────
  maxLoginAttempts:  { type: Number, default: 5,  min: 1, max: 20  },
  sessionTimeoutMin: { type: Number, default: 30, min: 5, max: 480 },
  passwordMinLength: { type: Number, default: 8,  min: 6, max: 32  },
  passwordRequireSpecialChars: { type: Boolean, default: true },

  // ── Metadata ─────────────────────────────────────────────────────────────────
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
  // _id is a string — disable the default ObjectId behaviour
  _id: false,
  toJSON:   { versionKey: false },
  toObject: { versionKey: false },
});

// Singleton helper — always upserts the 'global' document
systemConfigSchema.statics.getConfig = async function () {
  let cfg = await this.findById('global');
  if (!cfg) cfg = await this.create({ _id: 'global' });
  return cfg;
};

systemConfigSchema.statics.updateConfig = async function (data, userId) {
  const cfg = await this.findByIdAndUpdate(
    'global',
    { ...data, updatedBy: userId },
    { new: true, upsert: true, runValidators: true }
  );
  return cfg;
};

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
