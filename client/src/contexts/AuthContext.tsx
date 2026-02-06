import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import authService, { type AuthResponse } from "@/services/auth.service";

interface AuthContextType {
  user: AuthResponse["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  rememberMe: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // ตรวจสอบ token ตอนโหลดหน้า
  useEffect(() => {
    const initAuth = async () => {
      const { token, user: storedUser, rememberMe: storedRememberMe } = authService.getStoredAuth();
      
      if (token && storedUser) {
        try {
          // Verify token กับ server
          const userData = await authService.verifyToken();
          setUser(userData);
          setRememberMe(storedRememberMe);
        } catch {
          // Token ไม่ valid
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
      const message = err instanceof Error ? err.message : "เข้าสู่ระบบล้มเหลว";
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
      const message = err instanceof Error ? err.message : "สมัครสมาชิกล้มเหลว";
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
    rememberMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
