import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ApiError {
  message: string;
  status: number;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REMEMBER_KEY = "remember_me";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/forgot-password", data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/reset-password", data);
    return response.data;
  },

  async validateResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    const response = await api.get<{ valid: boolean; email: string }>(`/auth/validate-reset-token?token=${token}`);
    return response.data;
  },

  async verifyToken(): Promise<AuthResponse["user"]> {
    const response = await api.get<AuthResponse["user"]>>("/auth/me");
    return response.data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  getStorage(rememberMe: boolean = false): Storage {
    return rememberMe ? localStorage : sessionStorage;
  },

  getStoredAuth(): { token: string | null; user: AuthResponse["user"] | null; rememberMe: boolean } {
    // ตรวจสอบ localStorage ก่อน (remember me)
    let token = localStorage.getItem(TOKEN_KEY);
    let userStr = localStorage.getItem(USER_KEY);
    let rememberMe = localStorage.getItem(REMEMBER_KEY) === "true";

    // ถ้าไม่มีใน localStorage ให้ตรวจสอบ sessionStorage
    if (!token) {
      token = sessionStorage.getItem(TOKEN_KEY);
      userStr = sessionStorage.getItem(USER_KEY);
      rememberMe = false;
    }

    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user, rememberMe };
  },

  setStoredAuth(token: string, user: AuthResponse["user"], rememberMe: boolean = false): void {
    const storage = this.getStorage(rememberMe);
    
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
    
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  isRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_KEY) === "true";
  },
};

export default authService;
