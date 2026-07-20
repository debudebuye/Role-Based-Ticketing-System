import { UserService } from './user.service.js';

export class UserController {
  static async getAllUsers(req, res) {
    const { page, limit, sortBy, sortOrder, role, isActive, search } = req.query;
    
    const filters = { role, isActive, search };
    const pagination = { page, limit, sortBy, sortOrder };
    
    const result = await UserService.getAllUsers(filters, pagination, req.user);
    
    res.json({
      success: true,
      data: result
    });
  }
  
  static async getUserById(req, res) {
    const user = await UserService.getUserById(req.params.id);
    
    res.json({
      success: true,
      data: { user }
    });
  }
  
  static async createUser(req, res) {
    const user = await UserService.createUser(req.body, req.user);
    
    // Emit socket event for real-time updates
    req.io.emitToRole('admin', 'user:created', { user });
    req.io.emitToRole('manager', 'user:created', { user });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  }
  
  static async updateUser(req, res) {
    const user = await UserService.updateUser(req.params.id, req.body, req.user);
    
    // Emit socket event for real-time updates
    req.io.emitToRole('admin', 'user:updated', { user });
    req.io.emitToRole('manager', 'user:updated', { user });
    req.io.emitToUser(req.params.id, 'profile:updated', { user });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  }
  
  static async deleteUser(req, res) {
    const result = await UserService.deleteUser(req.params.id, req.user);
    
    // Emit socket event for real-time updates
    req.io.emitToRole('admin', 'user:deleted', { userId: req.params.id });
    req.io.emitToRole('manager', 'user:deleted', { userId: req.params.id });
    
    res.json({
      success: true,
      message: result.message
    });
  }
  
  static async getUserStats(req, res) {
    const stats = await UserService.getUserStats();
    
    res.json({
      success: true,
      data: { stats }
    });
  }
  
  static async getAgents(req, res) {
    const agents = await UserService.getAgents();
    
    res.json({
      success: true,
      data: { agents }
    });
  }
}