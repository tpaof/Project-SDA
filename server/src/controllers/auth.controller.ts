import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.js';
import { AppError } from '../utils/AppError.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validation = registerSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const user = await authService.register(validation.data);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(500).json({ error: message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const result = await authService.login(validation.data);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(500).json({ error: message });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    // JWT tokens are stateless, so logout is handled client-side
    // For token invalidation, implement a token blacklist with Redis
    res.status(200).json({ message: 'Logged out successfully' });
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      // Middleware ensures req.user is populated
      const user = await authService.getUserById(req.user!.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const { email } = validation.data;
      const { token } = await authService.createPasswordResetToken(email);

      // In production, send email with reset link
      // For now, we'll just log it or return in development
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
      
      // TODO: Send email using nodemailer or similar
      console.log('Password reset URL:', resetUrl);

      res.status(200).json({
        message: 'Password reset link sent to your email',
        // Only in development:
        ...(process.env.NODE_ENV === 'development' && { resetUrl, token }),
      });
    } catch (error) {
      if (error instanceof AppError) {
        // Don't reveal if email exists or not
        if (error.statusCode === 404) {
          res.status(200).json({
            message: 'If an account exists with this email, a reset link has been sent',
          });
          return;
        }
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to process forgot password request' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      const { token, password } = validation.data;
      await authService.resetPassword(token, password);

      res.status(200).json({
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  async validateResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await authService.validateResetToken(token);
      res.status(200).json({ valid: true, email: result.email });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to validate token' });
    }
  }
}

export const authController = new AuthController();
