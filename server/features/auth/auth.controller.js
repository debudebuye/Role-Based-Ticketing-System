import { AuthService } from './auth.service.js';
import { SystemConfig } from '../../shared/models/system-config.model.js';

// ── Cookie config ─────────────────────────────────────────────────────────────
// The refresh token is stored in an HttpOnly, Secure, SameSite=Strict cookie.
// This prevents JavaScript (including XSS payloads) from ever reading it.
const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = () => ({
  httpOnly: true,                                        // not accessible via JS
  secure:   process.env.NODE_ENV === 'production',       // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,                    // 7 days (matches JWT_REFRESH_EXPIRE)
  path:     '/'
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path:     '/'
});

// Helper — set the refresh token cookie and return only the access token + user
const sendTokens = (res, status, message, { user, accessToken, refreshToken }) => {
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  return res.status(status).json({
    success: true,
    message,
    data: { user, accessToken }   // refreshToken intentionally omitted from body
  });
};

export class AuthController {
  static async register(req, res) {
    // Honour the admin-controlled allowRegistration config
    const config = await SystemConfig.getConfig();
    if (!config.allowRegistration) {
      return res.status(403).json({
        success: false,
        message: 'New user registration is currently disabled. Please contact an administrator.',
      });
    }
    const result = await AuthService.register(req.body);
    sendTokens(res, 201, 'User registered successfully', result);
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    sendTokens(res, 200, 'Login successful', result);
  }

  static async refreshToken(req, res) {
    // Accept the refresh token from the HttpOnly cookie only.
    // Reject body-supplied tokens so old clients get a clear error.
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }
    const result = await AuthService.refreshTokens(refreshToken);
    sendTokens(res, 200, 'Tokens refreshed', result);
  }

  static async forgotPassword(req, res) {
    const result = await AuthService.forgotPassword(req.body.email);
    res.json({ success: true, message: result.message });
  }

  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;
    const result = await AuthService.resetPassword(token, newPassword);
    res.json({ success: true, message: result.message });
  }

  static async getProfile(req, res) {
    const result = await AuthService.getProfile(req.user._id);
    res.json({ success: true, data: { user: result } });
  }

  static async updateProfile(req, res) {
    const result = await AuthService.updateProfile(req.user._id, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: { user: result } });
  }

  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user._id, currentPassword, newPassword);
    // Invalidate the refresh cookie on password change — user must log in again
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
    res.json({ success: true, message: result.message });
  }

  static async logout(req, res) {
    const result = await AuthService.logout(req.user._id);
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
    res.json({ success: true, message: result.message });
  }
}
