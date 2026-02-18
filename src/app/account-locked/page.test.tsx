import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  apiFetch: vi.fn(),
}));

import AccountLockedPage from './page';
import { apiFetch } from '@/services/api';

const mockApiFetch = vi.mocked(apiFetch);

describe('AccountLockedPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('renders locked state', () => {
    render(<AccountLockedPage />);
    expect(screen.getByText('Account Locked')).toBeInTheDocument();
    expect(screen.getByText(/too many failed login attempts/)).toBeInTheDocument();
    expect(screen.getByText('Send Unlock Instructions')).toBeInTheDocument();
  });

  it('shows error when no email stored', async () => {
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByText('Send Unlock Instructions'));
    await waitFor(() => expect(screen.getByText(/No email address found/)).toBeInTheDocument());
  });

  it('sends unlock instructions successfully', async () => {
    localStorage.setItem('lockedEmail', 'test@example.com');
    mockApiFetch.mockResolvedValueOnce({} as never);
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByText('Send Unlock Instructions'));
    await waitFor(() => expect(screen.getByText('Unlock Email Sent')).toBeInTheDocument());
    expect(screen.getByText(/Unlock instructions have been sent/)).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    localStorage.setItem('lockedEmail', 'test@example.com');
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByText('Send Unlock Instructions'));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('shows error on non-Error failure', async () => {
    localStorage.setItem('lockedEmail', 'test@example.com');
    mockApiFetch.mockRejectedValueOnce('unknown');
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByText('Send Unlock Instructions'));
    await waitFor(() => expect(screen.getByText(/Failed to send/)).toBeInTheDocument());
  });

  it('navigates to login from sent state', async () => {
    localStorage.setItem('lockedEmail', 'test@example.com');
    mockApiFetch.mockResolvedValueOnce({} as never);
    render(<AccountLockedPage />);
    fireEvent.click(screen.getByText('Send Unlock Instructions'));
    await waitFor(() => expect(screen.getByText('Unlock Email Sent')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back to Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to login from locked state', () => {
    render(<AccountLockedPage />);
    const backBtns = screen.getAllByText('Back to Login');
    fireEvent.click(backBtns[0]);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
