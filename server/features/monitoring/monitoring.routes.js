/**
 * Admin Monitoring Routes
 * All endpoints require authentication + admin role.
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { SystemError } from '../../shared/models/system-error.model.js';
import { AuditLog } from '../tickets/audit.model.js';
import { User } from '../users/user.model.js';
import { Ticket } from '../tickets/ticket.model.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

// All monitoring routes require admin
router.use(authenticate);
router.use(requireRole(ROLES.ADMIN));

// ── System health ─────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
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

// ── Active users (via Socket.IO) ──────────────────────────────────────────────
router.get('/active-users', (req, res) => {
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

// ── Error feed ────────────────────────────────────────────────────────────────
router.get('/errors', async (req, res) => {
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

// Mark an error as resolved
router.patch('/errors/:id/resolve', async (req, res) => {
  const error = await SystemError.findByIdAndUpdate(
    req.params.id,
    { resolved: true, resolvedAt: new Date(), resolvedBy: req.user._id },
    { new: true }
  );
  if (!error) return res.status(404).json({ success: false, message: 'Error not found' });
  res.json({ success: true, data: { error } });
});

// ── Audit log (system-wide) ───────────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
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

// ── Overview stats ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
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
