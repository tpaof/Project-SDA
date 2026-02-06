import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
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

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async verifyToken(): Promise<AuthResponse["user"]> {
    const response = await api.get<AuthResponse["user"]>("/auth/me");
    return response.data;
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getStoredAuth(): { token: string | null; user: AuthResponse["user"] | null } {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  },

  setStoredAuth(token: string, user: AuthResponse["user"]): void {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
};

export default authService;
