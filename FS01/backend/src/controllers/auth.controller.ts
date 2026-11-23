import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const authController = {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      logger.info(`New user registered: ${result.user.email}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      logger.info(`User logged in: ${email}`);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      res.status(200).json({
        success: true,
        data: { accessToken },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      // TODO: Implement email service to send reset link
      // For now, just return success

      logger.info(`Password reset requested for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      // TODO: Implement password reset logic
      // 1. Verify token
      // 2. Update password
      // 3. Invalidate token

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement token blacklisting if needed

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  },
};
