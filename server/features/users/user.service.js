import { User } from './user.model.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { ROLES } from '../../shared/constants/roles.js';
import emailService from '../../shared/services/email.service.js';
import logger from '../../shared/utils/logger.js';
import { escapeRegex } from '../../shared/utils/string.utils.js';

export class UserService {
  static async getAllUsers(filters = {}, pagination = {}, currentUser) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { role, isActive, search } = filters;

    // Sanitise pagination — cap limit to prevent DoS via huge result sets
    const safePage  = Math.max(1, parseInt(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Allowlist sortBy to prevent arbitrary field exposure
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'email', 'role', 'department'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    
    // Build query
    const query = {};
    
    // Role-based filtering
    if (currentUser.role === ROLES.MANAGER) {
      // Managers can only see agents and customers
      query.role = { $in: [ROLES.AGENT, ROLES.CUSTOMER] };
    } else if (currentUser.role === ROLES.ADMIN) {
      // Admins can see all users
      if (role) query.role = role;
    } else {
      // Other roles shouldn't access this endpoint, but just in case
      query.role = { $in: [] }; // Empty result
    }
    
    // Apply additional filters
    if (role && currentUser.role === ROLES.ADMIN) {
      query.role = role; // Override the role filter for admins
    } else if (role && currentUser.role === ROLES.MANAGER) {
      // For managers, intersect with allowed roles
      const allowedRoles = [ROLES.AGENT, ROLES.CUSTOMER];
      if (allowedRoles.includes(role)) {
        query.role = role;
      } else {
        query.role = { $in: [] }; // No results if trying to filter by admin/manager
      }
    }
    
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { department: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (safePage - 1) * safeLimit;
    const sort = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute queries
    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .select('-password'),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };
  }
  
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
  
  static async createUser(userData, currentUser) {
    // Role hierarchy validation for creation
    if (currentUser.role === ROLES.ADMIN) {
      // Admins can create any user
    } else if (currentUser.role === ROLES.MANAGER) {
      // Managers can only create agents and customers
      if (![ROLES.AGENT, ROLES.CUSTOMER].includes(userData.role)) {
        throw new AppError('Managers can only create agents and customers', 403);
      }
    } else {
      throw new AppError('Insufficient permissions to create users', 403);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    const user = await User.create(userData);
    logger.info('User created', { userId: user._id, role: user.role, createdBy: currentUser._id });

    // Send welcome email — failure must not block user creation
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      logger.warn('Failed to send welcome email', { err: error, userId: user._id });
    }

    return user.toSafeObject();
  }
  
  static async updateUser(userId, updateData, currentUser) {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Role hierarchy validation
    if (currentUser.role === ROLES.ADMIN) {
      // Admins can update any user
    } else if (currentUser.role === ROLES.MANAGER) {
      // Managers can only update agents and customers
      if (![ROLES.AGENT, ROLES.CUSTOMER].includes(user.role)) {
        throw new AppError('Managers can only update agents and customers', 403);
      }
      // Managers cannot change role to admin or manager
      if (updateData.role && ![ROLES.AGENT, ROLES.CUSTOMER].includes(updateData.role)) {
        throw new AppError('Managers cannot assign admin or manager roles', 403);
      }
    } else {
      throw new AppError('Insufficient permissions to update users', 403);
    }
    
    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }
    }
    
    // Update user
    Object.assign(user, updateData);
    await user.save();
    
    return user.toSafeObject();
  }
  
  static async deleteUser(userId, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Prevent self-deletion
    if (userId === currentUser._id.toString()) {
      throw new AppError('You cannot delete your own account', 400);
    }
    
    // Role hierarchy validation
    if (currentUser.role === ROLES.ADMIN) {
      // Admins can delete any user
    } else if (currentUser.role === ROLES.MANAGER) {
      // Managers can only delete agents and customers
      if (![ROLES.AGENT, ROLES.CUSTOMER].includes(user.role)) {
        throw new AppError('Managers can only delete agents and customers', 403);
      }
    } else {
      throw new AppError('Insufficient permissions to delete users', 403);
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    return { message: 'User deactivated successfully' };
  }
  
  static async getUserStats() {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.active
        };
        return acc;
      }, {})
    };
  }
  
  static getAgents() {
    return User.find({ 
      role: ROLES.AGENT, 
      isActive: true 
    }).select('name email department');
  }
}