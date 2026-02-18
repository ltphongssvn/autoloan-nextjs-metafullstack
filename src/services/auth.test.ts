// autoloan-nextjs-metafullstack/src/services/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  apiFetch: vi.fn(),
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

import { authService } from './auth';
import { apiFetch, setAuthToken } from './api';

const mockApiFetch = vi.mocked(apiFetch);

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with credentials', async () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'customer' };
      mockApiFetch.mockResolvedValueOnce({
        data: { status: { code: 200 }, data: mockUser },
        headers: new Headers(),
      });

      const creds = { email: 'test@test.com', password: 'testpass1' }; // pragma: allowlist secret

      const result = await authService.login(creds);

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user: creds }),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('signup', () => {
    it('calls POST /auth/signup with user data', async () => {
      const mockUser = { id: 2, email: 'new@test.com', role: 'customer' };
      mockApiFetch.mockResolvedValueOnce({
        data: { status: { code: 200 }, data: mockUser },
        headers: new Headers(),
      });

      const signupData = {
        email: 'new@test.com',
        password: 'testpass1', // pragma: allowlist secret
        password_confirmation: 'testpass1', // pragma: allowlist secret
        first_name: 'John',
        last_name: 'Doe',
      };
      const result = await authService.signup(signupData);

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ user: signupData }),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('calls DELETE /auth/logout and clears token', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await authService.logout();

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/logout', { method: 'DELETE' });
      expect(setAuthToken).toHaveBeenCalledWith(null);
    });

    it('clears token even if API call fails', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      expect(setAuthToken).toHaveBeenCalledWith(null);
    });
  });

  describe('me', () => {
    it('calls GET /auth/me and returns user', async () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'customer' };
      mockApiFetch.mockResolvedValueOnce({
        data: { status: { code: 200 }, data: mockUser },
        headers: new Headers(),
      });

      const result = await authService.me();

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('forgotPassword', () => {
    it('calls POST /auth/password with email', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await authService.forgotPassword('test@test.com');

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/password', {
        method: 'POST',
        body: JSON.stringify({ user: { email: 'test@test.com' } }),
      });
    });
  });

  describe('resetPassword', () => {
    it('calls PUT /auth/password with token and new password', async () => { // pragma: allowlist secret
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await authService.resetPassword('reset-tok-val', 'newpasswd1', 'newpasswd1'); // pragma: allowlist secret

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          user: {
            reset_password_token: 'reset-tok-val', // pragma: allowlist secret
            password: 'newpasswd1', // pragma: allowlist secret
            password_confirmation: 'newpasswd1', // pragma: allowlist secret
          },
        }),
      });
    });
  });

  describe('refreshToken', () => {
    it('calls POST /auth/refresh', async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, headers: new Headers() });

      await authService.refreshToken();

      expect(mockApiFetch).toHaveBeenCalledWith('/auth/refresh', { method: 'POST' });
    });
  });
});
