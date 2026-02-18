import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  apiFetch: vi.fn(),
}));

import ConfirmEmailPage from './page';
import { apiFetch } from '@/services/api';

const mockApiFetch = vi.mocked(apiFetch);

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('shows error when no token', async () => {
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText('Confirmation Failed')).toBeInTheDocument());
    expect(screen.getByText(/Invalid confirmation link/)).toBeInTheDocument();
  });

  it('confirms email successfully', async () => {
    mockSearchParams = new URLSearchParams('confirmation_token=abc123');
    mockApiFetch.mockResolvedValueOnce({} as never);
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText('Email Confirmed!')).toBeInTheDocument());
    expect(screen.getByText(/confirmed successfully/)).toBeInTheDocument();
  });

  it('shows error on confirmation failure', async () => {
    mockSearchParams = new URLSearchParams('confirmation_token=bad');
    mockApiFetch.mockRejectedValueOnce(new Error('Token expired'));
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText('Confirmation Failed')).toBeInTheDocument());
    expect(screen.getByText('Token expired')).toBeInTheDocument();
  });

  it('shows generic error on non-Error failure', async () => {
    mockSearchParams = new URLSearchParams('confirmation_token=bad');
    mockApiFetch.mockRejectedValueOnce('unknown');
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText(/link may have expired/)).toBeInTheDocument());
  });

  it('navigates to login from success', async () => {
    mockSearchParams = new URLSearchParams('confirmation_token=abc');
    mockApiFetch.mockResolvedValueOnce({} as never);
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText('Go to Login')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Go to Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to login from error', async () => {
    render(<ConfirmEmailPage />);
    await waitFor(() => expect(screen.getByText('Go to Login')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Go to Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
