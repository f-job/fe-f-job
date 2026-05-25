import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  fullName?: string;
  name?: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

const authService = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>('/auth/login', payload);
  },

  register(payload: RegisterPayload) {
    return api.post('/auth/signup', {
      email: payload.email,
      name: payload.name ?? payload.fullName,
      password: payload.password,
    });
  },

  refresh(refreshToken: string) {
    return api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  },

  logout() {
    return api.post('/auth/logout');
  },

  verifyEmail(token: string) {
    return api.get(`/auth/verify-email/${token}`);
  },

  resendVerification(email: string) {
    return api.post('/auth/send-email-verification', { email });
  },

  forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword(email: string, token: string, newPassword: string) {
    return api.post('/auth/reset-password', { email, token, newPassword });
  },

  loginWithGoogle(token: string) {
    return api.post<AuthResponse>('/auth/oauth/google', { token });
  },

  loginWithFacebook(token: string) {
    return api.post<AuthResponse>('/auth/oauth/facebook', { token });
  },
};

export default authService;
