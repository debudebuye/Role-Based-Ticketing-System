/**
 * Admin Monitoring Routes
 * All endpoints require authentication + admin role,
 * except /agent-performance which is admin + manager.
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { SystemError } from '../../shared/models/system-error.model.js';
import { SystemConfig } from '../../shared/models/system-config.model.js';
import { AuditLog } from '../tickets/audit.model.js';
import { User } from '../users/user.model.js';
import { Ticket } from '../tickets/ticket.model.js';
import { ROLES } from '../../shared/constants/roles.js';
import Joi from 'joi';

const router = Router();

// All monitoring routes require authentication.
// Role checks are applied per-route below so that /agent-performance
// can be accessed by both admin and manager (all others are admin-only).
router.use(authenticate);

// ── System health (Admin only) ────────────────────────────────────────────────
router.get('/health', requireRole(ROLES.ADMIN), async (req, res) => {
  const dbState   = mongoose.connection.readyState;
  const dbHealthy = dbState === 1;
  const memUsage  = process.memoryUsage();
  const uptime    = process.uptime();

  res.json({
    success: true,
    data: {
      status:      dbHealthy ? 'healthy' : 'degraded',
      uptime:      Math.floor(uptime),
      uptimeHuman: formatUptime(uptime),
      timestamp:   new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      database: {
        status:    dbHealthy ? 'connected' : 'disconnected',
        readyState: dbState,
        host:      mongoose.connection.host,
        name:      mongoose.connection.name,
      },
      memory: {
        heapUsedMB:  Math.round(memUsage.heapUsed  / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB:       Math.round(memUsage.rss       / 1024 / 1024),
        externalMB:  Math.round(memUsage.external  / 1024 / 1024),
      },
      system: {
        platform:    os.platform(),
        arch:        os.arch(),
        cpus:        os.cpus().length,
        totalMemMB:  Math.round(os.totalmem() / 1024 / 1024),
        freeMemMB:   Math.round(os.freemem()  / 1024 / 1024),
        loadAvg:     os.loadavg(),
      },
    }
  });
});

// ── Active users (Admin only) ─────────────────────────────────────────────────
router.get('/active-users', requireRole(ROLES.ADMIN), (req, res) => {
  const io = req.io;
  const connected = io?.getConnectedUsers?.() ?? [];

  res.json({
    success: true,
    data: {
      count: connected.length,
      users: connected.map(u => ({
        userId:      u.user._id,
        name:        u.user.name,
        role:        u.user.role,
        connectedAt: u.connectedAt,
      })),
    }
  });
});

// ── Error feed (Admin only) ───────────────────────────────────────────────────
router.get('/errors', requireRole(ROLES.ADMIN), async (req, res) => {
  const { page = 1, limit = 20, resolved, statusCode } = req.query;
  const safePage  = Math.max(1, parseInt(page)  || 1);
  const safeLimit = Math.min(100, parseInt(limit) || 20);

  const query = {};
  if (resolved !== undefined) query.resolved = resolved === 'true';
  if (statusCode)             query.statusCode = parseInt(statusCode);

  const [errors, total] = await Promise.all([
    SystemError.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('resolvedBy', 'name email')
      .lean(),
    SystemError.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      errors,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    }
  });
});

// Mark an error as resolved (Admin only)
router.patch('/errors/:id/resolve', requireRole(ROLES.ADMIN), async (req, res) => {
  const error = await SystemError.findByIdAndUpdate(
    req.params.id,
    { resolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
    { new: true }
  );
  if (!error) return res.status(404).json({ success: false, message: 'Error not found' });
  res.json({ success: true, data: { error } });
});

// ── Audit log (Admin only) ────────────────────────────────────────────────────
router.get('/audit-log', requireRole(ROLES.ADMIN), async (req, res) => {
  const { page = 1, limit = 20, action, userId } = req.query;
  const safePage  = Math.max(1, parseInt(page)  || 1);
  const safeLimit = Math.min(100, parseInt(limit) || 20);

  const query = {};
  if (action) query.action   = action;
  if (userId) query.performedBy = userId;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('performedBy', 'name email role')
      .populate('ticketId',    'title status')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    }
  });
});

// ── Overview stats (Admin only) ───────────────────────────────────────────────
router.get('/stats', requireRole(ROLES.ADMIN), async (req, res) => {
  const now       = new Date();
  const last24h   = new Date(now - 24 * 60 * 60 * 1000);
  const last7d    = new Date(now - 7  * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    totalTickets,
    openTickets,
    resolvedToday,
    totalErrors,
    unresolvedErrors,
    errorsToday,
    recentAuditCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: last24h } }),
    Ticket.countDocuments({ isDeleted: { $ne: true } }),
    Ticket.countDocuments({ isDeleted: { $ne: true }, status: 'open' }),
    Ticket.countDocuments({ isDeleted: { $ne: true }, resolvedAt: { $gte: last24h } }),
    SystemError.countDocuments(),
    SystemError.countDocuments({ resolved: false }),
    SystemError.countDocuments({ createdAt: { $gte: last24h } }),
    AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
  ]);

  // Ticket volume over last 7 days
  const ticketTrend = await Ticket.aggregate([
    { $match: { isDeleted: { $ne: true }, createdAt: { $gte: last7d } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      users:   { total: totalUsers, active: activeUsers, newToday: newUsersToday },
      tickets: { total: totalTickets, open: openTickets, resolvedToday },
      errors:  { total: totalErrors, unresolved: unresolvedErrors, today: errorsToday },
      activity: { auditEventsToday: recentAuditCount },
      ticketTrend,
    }
  });
});

// ── Agent performance (Admin + Manager) ──────────────────────────────────────
router.get('/agent-performance',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  async (req, res) => {
    const { period = '30d' } = req.query;

    // Map period string to a date cutoff
    const PERIODS = { '7d': 7, '30d': 30, '90d': 90 };
    const days    = PERIODS[period] ?? 30;
    const since   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Per-agent ticket aggregation
    const agentStats = await Ticket.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          assignedTo: { $ne: null },
          createdAt:  { $gte: since },
        },
      },
      {
        $group: {
          _id: '$assignedTo',

          totalAssigned: { $sum: 1 },

          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] },
          },

          open: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] },
          },

          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },

          rejected: {
            $sum: { $cond: [{ $eq: ['$acceptanceStatus', 'rejected'] }, 1, 0] },
          },

          // Average resolution time in hours (only for resolved/closed tickets)
          avgResolutionHours: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['resolved', 'closed']] },
                    { $ifNull: ['$resolvedAt', false] },
                  ],
                },
                {
                  $divide: [
                    { $subtract: ['$resolvedAt', '$createdAt'] },
                    3_600_000,
                  ],
                },
                null,
              ],
            },
          },

          // Average response time (assigned → accepted) in hours
          avgResponseHours: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ['$acceptedAt', false] },
                    { $ifNull: ['$assignedAt', false] },
                  ],
                },
                {
                  $divide: [
                    { $subtract: ['$acceptedAt', '$assignedAt'] },
                    3_600_000,
                  ],
                },
                null,
              ],
            },
          },

          // Urgent + high priority tickets handled
          highPriorityHandled: {
            $sum: { $cond: [{ $in: ['$priority', ['urgent', 'high']] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'agent',
        },
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentId:            '$_id',
          name:               '$agent.name',
          email:              '$agent.email',
          department:         '$agent.department',
          isActive:           '$agent.isActive',
          totalAssigned:      1,
          resolved:           1,
          open:               1,
          inProgress:         1,
          rejected:           1,
          highPriorityHandled: 1,
          avgResolutionHours: { $round: ['$avgResolutionHours', 1] },
          avgResponseHours:   { $round: ['$avgResponseHours',   1] },
          // Resolution rate as a percentage
          resolutionRate: {
            $cond: [
              { $gt: ['$totalAssigned', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { resolved: -1, totalAssigned: -1 } },
    ]);

    // Team-level summary
    const totals = agentStats.reduce(
      (acc, a) => {
        acc.totalAssigned      += a.totalAssigned;
        acc.totalResolved      += a.resolved;
        acc.totalOpen          += a.open;
        acc.totalInProgress    += a.inProgress;
        return acc;
      },
      { totalAssigned: 0, totalResolved: 0, totalOpen: 0, totalInProgress: 0 }
    );

    res.json({
      success: true,
      data: {
        period,
        since:   since.toISOString(),
        agents:  agentStats,
        summary: {
          ...totals,
          agentCount:     agentStats.length,
          teamResolutionRate:
            totals.totalAssigned > 0
              ? Math.round((totals.totalResolved / totals.totalAssigned) * 1000) / 10
              : 0,
        },
      },
    });
  }
);

// ── System configuration (Admin only) ────────────────────────────────────────
router.get('/config',
  requireRole(ROLES.ADMIN),
  async (req, res) => {
    const config = await SystemConfig.getConfig();
    res.json({ success: true, data: { config } });
  }
);

const configSchema = Joi.object({
  allowRegistration:           Joi.boolean(),
  logLevel:                    Joi.string().valid('error', 'warn', 'info', 'debug'),
  maxLoginAttempts:            Joi.number().integer().min(1).max(20),
  sessionTimeoutMin:           Joi.number().integer().min(5).max(480),
  passwordMinLength:           Joi.number().integer().min(6).max(32),
  passwordRequireSpecialChars: Joi.boolean(),
}).min(1);

router.put('/config',
  requireRole(ROLES.ADMIN),
  async (req, res) => {
    const { error, value } = configSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const config = await SystemConfig.updateConfig(value, req.user._id);
    res.json({ success: true, message: 'System configuration updated', data: { config } });
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600)  / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default router;
