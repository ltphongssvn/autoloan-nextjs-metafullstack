import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => key === 'token' ? 'test-reset-tok' : null }), // pragma: allowlist secret
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  authService: { resetPassword: vi.fn() }, // pragma: allowlist secret
}));

import ResetPasswordPage from './page';
import { authService } from '@/services/auth';

const mockReset = vi.mocked(authService.resetPassword);

const fillPasswords = (pw: string, confirm: string) => {
  const inputs = document.querySelectorAll('input[type="password"]');
  fireEvent.change(inputs[0], { target: { value: pw } });
  fireEvent.change(inputs[1], { target: { value: confirm } });
};

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders form', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText('Reset Password', { selector: 'h6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows mismatch error', async () => {
    render(<ResetPasswordPage />);
    fillPasswords('abc123', 'xyz789'); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(screen.getByText('Passwords do not match')).toBeInTheDocument());
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('shows min length error', async () => {
    render(<ResetPasswordPage />);
    fillPasswords('abc', 'abc'); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument());
  });

  it('resets password successfully', async () => {
    mockReset.mockResolvedValueOnce(undefined);
    render(<ResetPasswordPage />);
    fillPasswords('newpass1', 'newpass1'); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith('test-reset-tok', 'newpass1', 'newpass1'); // pragma: allowlist secret
      expect(screen.getByText(/reset successfully/i)).toBeInTheDocument();
    });
  });

  it('shows API error', async () => {
    mockReset.mockRejectedValueOnce(new Error('Token expired'));
    render(<ResetPasswordPage />);
    fillPasswords('newpass1', 'newpass1'); // pragma: allowlist secret
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(screen.getByText('Token expired')).toBeInTheDocument());
  });

  it('navigates back to login', () => {
    render(<ResetPasswordPage />);
    fireEvent.click(screen.getByText('Back to login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
