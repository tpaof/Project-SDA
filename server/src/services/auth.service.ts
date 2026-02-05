import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import type { RegisterInput, LoginInput } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

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
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
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
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      return decoded;
    } catch {
      throw new Error('Invalid or expired token');
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
}

export const authService = new AuthService();
