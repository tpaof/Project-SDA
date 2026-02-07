import { createContext } from "react";
import type { AuthResponse } from "@/services/auth.service";

export interface AuthContextType {
  user: AuthResponse["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
  rememberMe: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
