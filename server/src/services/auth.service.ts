import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import prisma from '../lib/db.js';
import { AppError } from '../utils/AppError.js';
import type { RegisterInput, LoginInput } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRES_IN = 3600000; // 1 hour in milliseconds

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export class AuthService {
  async register(data: RegisterInput): Promise<UserResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(data: LoginInput): Promise<{ token: string; user: UserResponse }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async validateToken(token: string): Promise<AuthPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as AuthPayload;
      return decoded;
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  // Forgot Password - Create reset token
  async createPasswordResetToken(email: string): Promise<{ token: string; expiresAt: Date }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      throw new AppError(404, 'User not found');
    }

    // Delete any existing unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
        used: false,
      },
    });

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  // Reset Password - Validate token and update password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    if (resetToken.used) {
      throw new AppError(400, 'Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });
  }

  // Validate reset token (for checking if token is valid before showing form)
  async validateResetToken(token: string): Promise<{ email: string }> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    return { email: resetToken.email };
  }
}

export const authService = new AuthService();
