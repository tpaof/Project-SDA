import React, { useState, useCallback, useEffect, type ReactNode } from "react";
import authService, { type AuthResponse } from "@/services/auth.service";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Check token on page load
  useEffect(() => {
    const initAuth = async () => {
      const { token, user: storedUser, rememberMe: storedRememberMe } = authService.getStoredAuth();
      
      if (token && storedUser) {
        try {
          // Verify token with server
          const userData = await authService.verifyToken();
          // Merge with stored user data to preserve name if API doesn't return it
          setUser({ ...storedUser, ...userData });
          setRememberMe(storedRememberMe);
        } catch {
          // Token not valid
          authService.logout();
          setUser(null);
          setRememberMe(false);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      authService.setStoredAuth(response.token, response.user, remember);
      
      setUser(response.user);
      setRememberMe(remember);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register({ email, password });
      authService.setStoredAuth(response.token, response.user);
      setUser(response.user);
      setRememberMe(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    setRememberMe(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword({ token, password });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    error,
    clearError,
    rememberMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
