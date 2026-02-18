// autoloan-nextjs-metafullstack/src/services/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, setAuthToken, getAuthToken } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthToken(null);
  });

  afterEach(() => {
    setAuthToken(null);
  });

  describe('setAuthToken / getAuthToken', () => {
    it('stores and retrieves token', () => {
      setAuthToken('test-token-123');
      expect(getAuthToken()).toBe('test-token-123');
    });

    it('clears token when set to null', () => {
      setAuthToken('test-token-123');
      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });

    it('persists token to localStorage', () => {
      setAuthToken('persist-token');
      expect(localStorage.getItem('authToken')).toBe('persist-token');
    });

    it('removes token from localStorage when null', () => {
      setAuthToken('persist-token');
      setAuthToken(null);
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('apiFetch', () => {
    it('makes GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      });

      await apiFetch('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('includes Authorization header when token exists', async () => {
      setAuthToken('my-jwt-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      });

      await apiFetch('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        })
      );
    });

    it('does not include Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      });

      await apiFetch('/test');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it('extracts and stores JWT from response Authorization header', async () => {
      const responseHeaders = new Headers();
      responseHeaders.set('Authorization', 'Bearer new-token-from-server');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: responseHeaders,
        json: async () => ({ data: 'test' }),
      });

      await apiFetch('/test');

      expect(getAuthToken()).toBe('new-token-from-server');
    });

    it('returns data and headers on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ status: { code: 200 }, data: { id: 1 } }),
      });

      const result = await apiFetch('/test');

      expect(result.data).toEqual({ status: { code: 200 }, data: { id: 1 } });
      expect(result.headers).toBeInstanceOf(Headers);
    });

    it('throws error with API error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        headers: new Headers(),
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(apiFetch('/test')).rejects.toThrow('Unauthorized');
    });

    it('throws error with status message format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        headers: new Headers(),
        json: async () => ({ status: { message: 'Not found' } }),
      });

      await expect(apiFetch('/test')).rejects.toThrow('Not found');
    });

    it('throws default error when no message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(apiFetch('/test')).rejects.toThrow('API request failed');
    });

    it('passes custom options through', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({ data: 'created' }),
      });

      await apiFetch('/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });
  });
});
