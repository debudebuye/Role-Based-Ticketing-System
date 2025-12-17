import jwt from 'jsonwebtoken';
import { User } from '../../features/users/user.model.js';

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
      
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.user.role})`);
    
    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });
    
    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);
    socket.join(`user:${socket.userId}`);
    
    // Notify others about user connection (admins and managers only)
    socket.to('role:admin').to('role:manager').emit('user:online', {
      userId: socket.userId,
      name: socket.user.name,
      role: socket.userRole
    });
    
    // Handle ticket-related events
    socket.on('ticket:join', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      console.log(`📋 User ${socket.user.name} joined ticket room: ${ticketId}`);
    });
    
    socket.on('ticket:leave', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(`📋 User ${socket.user.name} left ticket room: ${ticketId}`);
    });
    
    // Handle typing indicators
    socket.on('comment:typing', (data) => {
      socket.to(`ticket:${data.ticketId}`).emit('comment:typing', {
        userId: socket.userId,
        userName: socket.user.name,
        ticketId: data.ticketId,
        isTyping: data.isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Notify others about user disconnection
      socket.to('role:admin').to('role:manager').emit('user:offline', {
        userId: socket.userId,
        name: socket.user.name,
        role: socket.userRole
      });
    });
  });
  
  // Utility functions for emitting events
  io.emitToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };
  
  io.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };
  
  io.emitToTicket = (ticketId, event, data) => {
    io.to(`ticket:${ticketId}`).emit(event, data);
  };
  
  io.getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };
  
  return io;
};