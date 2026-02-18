// autoloan-nextjs-metafullstack/src/services/auth.ts
import { apiFetch, setAuthToken } from './api';
import type { User, ApiResponse, AuthCredentials, SignupData } from '@/types';

export const authService = {
  async login(credentials: AuthCredentials): Promise<User> {
    const { data } = await apiFetch<ApiResponse<User>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user: credentials }),
    });
    return data.data;
  },

  async signup(signupData: SignupData): Promise<User> {
    const { data } = await apiFetch<ApiResponse<User>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ user: signupData }),
    });
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'DELETE' });
    } finally {
      setAuthToken(null);
    }
  },

  async me(): Promise<User> {
    const { data } = await apiFetch<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiFetch('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ user: { email } }),
    });
  },

  async resetPassword(token: string, password: string, passwordConfirmation: string): Promise<void> {
    await apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        user: {
          reset_password_token: token,
          password,
          password_confirmation: passwordConfirmation,
        },
      }),
    });
  },

  async refreshToken(): Promise<void> {
    await apiFetch('/auth/refresh', { method: 'POST' });
  },
};
