import jwt from 'jsonwebtoken';
import { User } from '../../features/users/user.model.js';
import logger from '../utils/logger.js';
import { wsRateLimitMiddleware } from '../middleware/wsRateLimit.middleware.js';

// ── Connected users registry ──────────────────────────────────────────────────
// Keyed by socket.id (not userId) so multiple tabs / reconnections work
// correctly. Each socket gets its own entry. getConnectedUsers() deduplicates
// by userId when building the response so the admin sees one row per person.
const connectedSockets = new Map();

export const setupSocketHandlers = (io) => {
  // ── Rate limiting (must come before auth) ──────────────────────────────────
  io.use(wsRateLimitMiddleware);

  // ── Authentication middleware ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: User not found'));

      socket.userId   = user._id.toString();
      socket.userRole = user.role;
      socket.user     = user;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { socketId: socket.id, user: socket.user.name, role: socket.user.role });

    // Register this socket connection
    connectedSockets.set(socket.id, {
      socketId:    socket.id,
      userId:      socket.userId,
      user:        socket.user,
      connectedAt: new Date(),
    });

    // Join role-based and personal rooms
    socket.join(`role:${socket.userRole}`);
    socket.join(`user:${socket.userId}`);

    // Notify admins/managers — only on first connection for this user
    const userSocketCount = _countUserSockets(socket.userId);
    if (userSocketCount === 1) {
      socket.to('role:admin').to('role:manager').emit('user:online', {
        userId: socket.userId,
        name:   socket.user.name,
        role:   socket.userRole,
      });
    }

    // ── Ticket room events ──────────────────────────────────────────────────
    socket.on('ticket:join', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      logger.debug('User joined ticket room', { user: socket.user.name, ticketId });
    });

    socket.on('ticket:leave', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      logger.debug('User left ticket room', { user: socket.user.name, ticketId });
    });

    // ── Typing indicators ───────────────────────────────────────────────────
    socket.on('comment:typing', (data) => {
      socket.to(`ticket:${data.ticketId}`).emit('comment:typing', {
        userId:   socket.userId,
        userName: socket.user.name,
        ticketId: data.ticketId,
        isTyping: data.isTyping,
      });
    });

    // ── Disconnection ───────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { socketId: socket.id, user: socket.user.name, reason });

      connectedSockets.delete(socket.id);

      // Only broadcast offline if the user has NO remaining sockets
      const remaining = _countUserSockets(socket.userId);
      if (remaining === 0) {
        socket.to('role:admin').to('role:manager').emit('user:offline', {
          userId: socket.userId,
          name:   socket.user.name,
          role:   socket.userRole,
        });
      }
    });
  });

  // ── Utility helpers ───────────────────────────────────────────────────────
  io.emitToRole    = (role,     event, data) => io.to(`role:${role}`).emit(event, data);
  io.emitToUser    = (userId,   event, data) => io.to(`user:${userId}`).emit(event, data);
  io.emitToTicket  = (ticketId, event, data) => io.to(`ticket:${ticketId}`).emit(event, data);

  // Returns one entry per unique user (earliest connectedAt wins for display)
  io.getConnectedUsers = () => {
    const byUser = new Map();
    for (const entry of connectedSockets.values()) {
      const existing = byUser.get(entry.userId);
      if (!existing || entry.connectedAt < existing.connectedAt) {
        byUser.set(entry.userId, entry);
      }
    }
    return Array.from(byUser.values());
  };

  return io;
};

// Count how many active sockets belong to a given userId
function _countUserSockets(userId) {
  let count = 0;
  for (const entry of connectedSockets.values()) {
    if (entry.userId === userId) count++;
  }
  return count;
}
