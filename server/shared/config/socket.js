import jwt from 'jsonwebtoken';
import { User } from '../../features/users/user.model.js';
import logger from '../utils/logger.js';

// Store connected users
const connectedUsers = new Map();

export const setupSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId   = user._id.toString();
      socket.userRole = user.role;
      socket.user     = user;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { user: socket.user.name, role: socket.user.role });

    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId:    socket.id,
      user:        socket.user,
      connectedAt: new Date()
    });

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    socket.join(`user:${socket.userId}`);

    // Notify admins/managers about user connection
    socket.to('role:admin').to('role:manager').emit('user:online', {
      userId: socket.userId,
      name:   socket.user.name,
      role:   socket.userRole
    });

    // Handle ticket-related events
    socket.on('ticket:join', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      logger.debug('User joined ticket room', { user: socket.user.name, ticketId });
    });

    socket.on('ticket:leave', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      logger.debug('User left ticket room', { user: socket.user.name, ticketId });
    });

    // Handle typing indicators
    socket.on('comment:typing', (data) => {
      socket.to(`ticket:${data.ticketId}`).emit('comment:typing', {
        userId:   socket.userId,
        userName: socket.user.name,
        ticketId: data.ticketId,
        isTyping: data.isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { user: socket.user.name });

      connectedUsers.delete(socket.userId);

      socket.to('role:admin').to('role:manager').emit('user:offline', {
        userId: socket.userId,
        name:   socket.user.name,
        role:   socket.userRole
      });
    });
  });

  // Utility functions for emitting events
  io.emitToRole  = (role,     event, data) => io.to(`role:${role}`).emit(event, data);
  io.emitToUser  = (userId,   event, data) => io.to(`user:${userId}`).emit(event, data);
  io.emitToTicket = (ticketId, event, data) => io.to(`ticket:${ticketId}`).emit(event, data);
  io.getConnectedUsers = () => Array.from(connectedUsers.values());

  return io;
};
