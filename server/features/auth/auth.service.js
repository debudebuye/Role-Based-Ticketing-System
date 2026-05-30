import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../users/user.model.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import emailService from '../../shared/services/email.service.js';
import logger from '../../shared/utils/logger.js';

const ACCESS_EXPIRE  = process.env.JWT_EXPIRE         || '15m';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

export class AuthService {
  // ── Token helpers ─────────────────────────────────────────────────────────
  static generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRE });
  }

  static generateRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE });
  }

  static async _tokenPair(userId) {
    const accessToken  = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Store hash of refresh token for rotation tracking
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.findByIdAndUpdate(userId, { refreshTokenHash }, { validateBeforeSave: false });

    return { accessToken, refreshToken };
  }

  // ── Register ──────────────────────────────────────────────────────────────
  static async register(userData) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) throw new AppError('User already exists with this email', 400);

    const user   = await User.create(userData);
    const tokens = await this._tokenPair(user._id);

    try {
      await emailService.sendWelcomeEmail(user);
    } catch (err) {
      logger.warn('Failed to send welcome email', { err, userId: user._id });
    }

    return { user: user.toSafeObject(), ...tokens };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  static async login(email, password) {
    const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');

    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Account is deactivated. Please contact administrator.', 401);

    // Check lockout
    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60_000);
      throw new AppError(`Account locked. Try again in ${remaining} minute(s).`, 429);
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incFailedLogins();
      throw new AppError('Invalid email or password', 401);
    }

    // Successful login — reset lockout counters
    await user.resetFailedLogins();
    await user.updateLastLogin();

    const tokens = await this._tokenPair(user._id);
    return { user: user.toSafeObject(), ...tokens };
  }

  // ── Refresh token rotation ────────────────────────────────────────────────
  static async refreshTokens(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    // Validate that this is the current refresh token (prevents reuse of superseded tokens)
    const providedHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // If refreshTokenHash is null, all sessions have been invalidated (logout /
    // password change / token-theft response).  Reject immediately.
    if (!user.refreshTokenHash) {
      throw new AppError('Session has been invalidated. Please log in again.', 401);
    }

    if (user.refreshTokenHash !== providedHash) {
      // Token reuse detected — possible theft. Invalidate all sessions.
      await User.findByIdAndUpdate(user._id, { refreshTokenHash: null }, { validateBeforeSave: false });
      logger.warn('Refresh token reuse detected — all sessions invalidated', { userId: user._id });
      throw new AppError('Refresh token reuse detected. Please log in again.', 401);
    }

    // Issue a completely new pair (rotation)
    const tokens = await this._tokenPair(user._id);
    return { user: user.toSafeObject(), ...tokens };
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    // Always return success to prevent user enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiry = resetExpiry;
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (err) {
      user.passwordResetToken  = undefined;
      user.passwordResetExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Failed to send reset email. Please try again.', 500);
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ── Reset password ────────────────────────────────────────────────────────
  static async resetPassword(token, newPassword) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:  hashed,
      passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    user.password            = newPassword;
    user.passwordResetToken  = undefined;
    user.passwordResetExpiry = undefined;
    // Invalidate all sessions on password reset
    user.refreshTokenHash    = null;
    await user.resetFailedLogins();
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // ── Profile / password change ─────────────────────────────────────────────
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user.toSafeObject();
  }

  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    ['name', 'department', 'phone'].forEach((f) => {
      if (updateData[f] !== undefined) user[f] = updateData[f];
    });

    await user.save();
    return user.toSafeObject();
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    user.password = newPassword;
    // Invalidate all existing sessions on password change
    user.refreshTokenHash = null;
    await user.save();
    return { message: 'Password updated successfully. Please log in again.' };
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  static async logout(userId) {
    // Clear the stored refresh token hash — makes the refresh token unusable
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null }, { validateBeforeSave: false });
    return { message: 'Logged out successfully' };
  }
}
