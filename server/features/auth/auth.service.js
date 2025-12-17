import jwt from 'jsonwebtoken';
import { User } from '../users/user.model.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import emailService from '../../shared/services/email.service.js';

export class AuthService {
  static generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }
  
  static async register(userData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }
    
    // Create user
    const user = await User.create(userData);
    
    // Generate token
    const token = this.generateToken(user._id);
    
    // Send welcome email (don't wait for it to complete)
    try {
      await emailService.sendWelcomeEmail(user);
      console.log(`📧 Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${user.email}:`, error.message);
      // Don't throw error - registration should still succeed even if email fails
    }
    
    return {
      user: user.toSafeObject(),
      token
    };
  }
  
  static async login(email, password) {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact administrator.', 401);
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }
    
    // Update last login
    await user.updateLastLogin();
    
    // Generate token
    const token = this.generateToken(user._id);
    
    return {
      user: user.toSafeObject(),
      token
    };
  }
  
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.toSafeObject();
  }
  
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Update allowed fields
    const allowedFields = ['name', 'department', 'phone'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });
    
    await user.save();
    return user.toSafeObject();
  }
  
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return { message: 'Password updated successfully' };
  }
  
  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }
    
    const token = this.generateToken(user._id);
    
    return {
      user: user.toSafeObject(),
      token
    };
  }
}