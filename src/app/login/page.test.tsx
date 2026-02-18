// autoloan-nextjs-metafullstack/src/app/login/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useServerInsertedHTML: vi.fn(),
}));

const mockSetUser = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false, setUser: mockSetUser, logout: vi.fn(), isAuthenticated: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/services/auth', () => ({
  authService: {
    login: vi.fn(),
  },
}));

import LoginPage from './page';
import { authService } from '@/services/auth';

const mockLogin = vi.mocked(authService.login);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders brand and navigation links', () => {
    render(<LoginPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('submits login and redirects on success', async () => {
    const mockUser = { id: 1, email: 'test@test.com', role: 'customer' };
    mockLogin.mockResolvedValueOnce(mockUser as never);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass1' }); // pragma: allowlist secret
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('navigates to signup', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('navigates to forgot password', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/forgot password/i));
    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
  });

  it('navigates back to home', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
