import { Request, Response, NextFunction } from 'express';
import { authService, type AuthPayload } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or invalid' });
      return;
    }

    const parts = authHeader.split(' ');
    // Ensure properly formed Bearer token
    if (parts.length !== 2 || !parts[1]) {
      res.status(401).json({ error: 'Token not provided or malformed' });
      return;
    }

    const token = parts[1];

    const payload = await authService.validateToken(token);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
