import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  authService: { forgotPassword: vi.fn() },
}));

import ForgotPasswordPage from './page';
import { authService } from '@/services/auth';

const mockForgot = vi.mocked(authService.forgotPassword);

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders form', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset/i })).toBeInTheDocument();
  });

  it('sends reset and shows success', async () => {
    mockForgot.mockResolvedValueOnce(undefined);
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset/i }));
    await waitFor(() => {
      expect(mockForgot).toHaveBeenCalledWith('a@b.com');
      expect(screen.getByText(/instructions sent/i)).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    mockForgot.mockRejectedValueOnce(new Error('Not found'));
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset/i }));
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('navigates back to login', () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByText('Back to login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
