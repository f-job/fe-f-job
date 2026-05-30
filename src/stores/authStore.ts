import { create } from 'zustand';
import authService, {
  AuthUser,
  RegisterCandidatePayload,
  RegisterEmployerPayload,
} from '@services/authService';
import socialProviderService from '@services/socialProviderService';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  registerCandidate: (payload: RegisterCandidatePayload) => Promise<void>;
  registerEmployer: (payload: RegisterEmployerPayload) => Promise<void>;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
}

function normalizeUser(user: AuthUser): AuthUser {
  const displayName = user.name ?? user.fullName ?? user.email;
  return {
    ...user,
    name: displayName,
    fullName: displayName,
  };
}

function persistAuth(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
  const user = normalizeUser(data.user);
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  loadFromStorage: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = normalizeUser(JSON.parse(userStr) as AuthUser);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login({ email, password });
      const user = persistAuth(data);
      set({
        user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const token = await socialProviderService.getGoogleIdToken();
      const { data } = await authService.loginWithGoogle(token);
      const user = persistAuth(data);
      set({
        user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithFacebook: async () => {
    set({ isLoading: true });
    try {
      const token = await socialProviderService.getFacebookAccessToken();
      const { data } = await authService.loginWithFacebook(token);
      const user = persistAuth(data);
      set({
        user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, fullName: string, password: string) => {
    set({ isLoading: true });
    try {
      await authService.register({ email, fullName, password });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerCandidate: async (payload: RegisterCandidatePayload) => {
    set({ isLoading: true });
    try {
      // Backend returns only a confirmation message (no tokens) — caller should
      // redirect to the login page after a successful registration.
      await authService.registerCandidate(payload);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerEmployer: async (payload: RegisterEmployerPayload) => {
    set({ isLoading: true });
    try {
      // Employer accounts are created in PENDING_APPROVAL status and return only
      // a confirmation message — redirect to login after success.
      await authService.registerEmployer(payload);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setAuth: (accessToken: string, refreshToken: string, authUser: AuthUser) => {
    const user = persistAuth({ accessToken, refreshToken, user: authUser });
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout API errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },
}));
