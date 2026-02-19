// autoloan-nextjs-metafullstack/src/context/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  getAuthToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
  apiFetch: vi.fn(),
}));

import { AuthProvider, useAuth } from './AuthContext';
import { getAuthToken, setAuthToken, apiFetch } from '@/services/api';

const mockGetAuthToken = vi.mocked(getAuthToken);
const mockSetAuthToken = vi.mocked(setAuthToken);
const mockApiFetch = vi.mocked(apiFetch);

const TestConsumer = () => {
  const { user, isLoading, isAuthenticated, logout, setUser } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={logout}>Logout</button>
      <button onClick={() => setUser({ id: 2, email: 'new@test.com', role: 'customer', first_name: 'New', last_name: 'User' } as never)}>Set User</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    document.cookie = 'user_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });

  it('provides default unauthenticated state when no token', async () => {
    mockGetAuthToken.mockReturnValue(null);
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
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
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('user@test.com');
    expect(document.cookie).toContain('token=valid-token');
    expect(document.cookie).toContain('user_role=customer');
  });

  it('clears token and cookies when session restore fails', async () => {
    mockGetAuthToken.mockReturnValue('expired-token');
    mockApiFetch.mockRejectedValueOnce(new Error('Unauthorized'));
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(mockSetAuthToken).toHaveBeenCalledWith(null);
    expect(document.cookie).not.toContain('token=expired-token');
    expect(document.cookie).not.toContain('user_role=');
  });

  it('sets cookies when setUser is called with a user', async () => {
    mockGetAuthToken.mockReturnValue('my-jwt');
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Set User'));
    });
    expect(screen.getByTestId('user')).toHaveTextContent('new@test.com');
    expect(document.cookie).toContain('token=my-jwt');
    expect(document.cookie).toContain('user_role=customer');
  });

  it('clears cookies on logout', async () => {
    mockGetAuthToken.mockReturnValue('valid-token');
    mockApiFetch.mockResolvedValueOnce({
      data: { status: { code: 200 }, data: { id: 1, email: 'user@test.com', role: 'customer' } },
      headers: new Headers(),
    });
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    expect(document.cookie).toContain('token=valid-token');
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(document.cookie).not.toContain('token=valid-token');
  });

  it('deletes cookies when setUser is called with null', async () => {
    mockGetAuthToken.mockReturnValue(null);
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>);
    });
    // Set user first
    await act(async () => {
      fireEvent.click(screen.getByText('Set User'));
    });
    expect(document.cookie).toContain('user_role=customer');
    // Clear user
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });
    expect(document.cookie).not.toContain('user_role=customer');
  });

  it('throws error when useAuth used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
