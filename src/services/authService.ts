import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  fullName?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

const authService = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>('/auth/login', payload);
  },

  register(payload: RegisterPayload) {
    return api.post('/auth/register', payload);
  },

  refresh(refreshToken: string) {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },

  logout() {
    return api.post('/auth/logout');
  },

  forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword(payload: ResetPasswordPayload) {
    return api.post('/auth/reset-password', payload);
  },

  getMe() {
    return api.get('/auth/me');
  },
};

export default authService;
