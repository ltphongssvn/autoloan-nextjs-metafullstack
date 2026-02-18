// autoloan-nextjs-metafullstack/src/app/signup/page.test.tsx
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
    signup: vi.fn(),
  },
}));

import SignupPage from './page';
import { authService } from '@/services/auth';

const mockSignup = vi.mocked(authService.signup);

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form', () => {
    render(<SignupPage />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders brand and navigation links', () => {
    render(<SignupPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@d.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc123' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'xyz789' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('submits signup and redirects on success', async () => {
    const mockUser = { id: 1, email: 'j@d.com', role: 'customer' };
    mockSignup.mockResolvedValueOnce(mockUser as never);

    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@d.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc123' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'abc123' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error on failed signup', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Email taken'));

    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@d.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc123' } }); // pragma: allowlist secret
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'abc123' } }); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
    });
  });

  it('navigates to login', () => {
    render(<SignupPage />);
    fireEvent.click(screen.getByText('Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates back to home', () => {
    render(<SignupPage />);
    fireEvent.click(screen.getByText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
