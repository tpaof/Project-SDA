import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
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
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

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
}

export const authController = new AuthController();
