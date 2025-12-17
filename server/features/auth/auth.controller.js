import { AuthService } from './auth.service.js';

export class AuthController {
  static async register(req, res) {
    const result = await AuthService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  }
  
  static async login(req, res) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  }
  
  static async getProfile(req, res) {
    const result = await AuthService.getProfile(req.user._id);
    
    res.json({
      success: true,
      data: { user: result }
    });
  }
  
  static async updateProfile(req, res) {
    const result = await AuthService.updateProfile(req.user._id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: result }
    });
  }
  
  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(
      req.user._id, 
      currentPassword, 
      newPassword
    );
    
    res.json({
      success: true,
      message: result.message
    });
  }
  
  static async refreshToken(req, res) {
    const result = await AuthService.refreshToken(req.user._id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  }
}