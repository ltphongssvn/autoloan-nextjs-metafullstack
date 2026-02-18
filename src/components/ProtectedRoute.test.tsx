// autoloan-nextjs-metafullstack/src/components/ProtectedRoute.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));

const mockAuth = { user: null as Record<string, unknown> | null, isLoading: false, isAuthenticated: false, setUser: vi.fn(), logout: vi.fn() };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.user = null;
    mockAuth.isLoading = false;
    mockAuth.isAuthenticated = false;
  });

  it('shows loading spinner when auth is loading', () => {
    mockAuth.isLoading = true;
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: 1, role: 'customer' };
    render(<ProtectedRoute><p>Secret</p></ProtectedRoute>);
    expect(screen.getByText('Secret')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders children when user role is allowed', () => {
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: 1, role: 'loan_officer' };
    render(<ProtectedRoute allowedRoles={['loan_officer', 'underwriter']}><p>Staff Only</p></ProtectedRoute>);
    expect(screen.getByText('Staff Only')).toBeInTheDocument();
  });

  it('redirects to dashboard when role not allowed', () => {
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: 1, role: 'customer' };
    render(<ProtectedRoute allowedRoles={['loan_officer']}><p>Staff Only</p></ProtectedRoute>);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Staff Only')).not.toBeInTheDocument();
  });
});
