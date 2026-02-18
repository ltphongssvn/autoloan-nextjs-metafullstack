// autoloan-nextjs-metafullstack/src/context/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  getAuthToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
  apiFetch: vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext';
import { getAuthToken, apiFetch } from '@/services/api';

const mockGetAuthToken = vi.mocked(getAuthToken);
const mockApiFetch = vi.mocked(apiFetch);

const TestConsumer = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default unauthenticated state when no token', async () => {
    mockGetAuthToken.mockReturnValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('restores session when token exists', async () => {
    mockGetAuthToken.mockReturnValue('valid-token');
    mockApiFetch.mockResolvedValueOnce({
      data: { status: { code: 200 }, data: { id: 1, email: 'user@test.com', role: 'customer' } },
      headers: new Headers(),
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
  });

  it('clears token when session restore fails', async () => {
    mockGetAuthToken.mockReturnValue('expired-token');
    mockApiFetch.mockRejectedValueOnce(new Error('Unauthorized'));

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('throws error when useAuth used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
