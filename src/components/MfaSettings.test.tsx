import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('@/services/api', () => ({
  apiFetch: vi.fn(),
  getAuthToken: vi.fn().mockReturnValue('token123'),
}));

const mockFetchGlobal = vi.fn();
vi.stubGlobal('fetch', mockFetchGlobal);

import MfaSettings from './MfaSettings';
import { apiFetch } from '@/services/api';

const mockApiFetch = vi.mocked(apiFetch);

describe('MfaSettings', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('renders check status button', () => {
    render(<MfaSettings />);
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Check MFA Status')).toBeInTheDocument();
  });

  it('fetches and shows MFA disabled', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText(/MFA is not enabled/)).toBeInTheDocument());
  });

  it('shows error on status fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('fail'));
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Failed to fetch MFA status')).toBeInTheDocument());
  });

  it('fetches and shows MFA enabled', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: true, mfa_configured: true } } } as never);
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('MFA is enabled')).toBeInTheDocument());
  });

  it('sets up MFA and shows QR code', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qr_code_svg: '<svg>QR</svg>', provisioning_uri: 'otpauth://test' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByText(/Scan this QR code/)).toBeInTheDocument());
  });

  it('shows error on setup failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: { message: 'Setup failed' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByText('Setup failed')).toBeInTheDocument());
  });

  it('shows network error on setup exception', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockRejectedValueOnce(new Error('net'));
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('enables MFA with code', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qr_code_svg: '<svg/>', provisioning_uri: 'x' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByLabelText('6-digit code')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '123456' } });
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { backup_codes: ['CODE1', 'CODE2'] } }) });
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: true, mfa_configured: true } } } as never);
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => expect(screen.getByText('MFA enabled successfully!')).toBeInTheDocument());
    expect(screen.getByText('CODE1')).toBeInTheDocument();
  });

  it('shows error on enable failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qr_code_svg: '<svg/>', provisioning_uri: 'x' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByLabelText('6-digit code')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '999999' } });
    mockFetchGlobal.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ status: { message: 'Bad code' } }) });
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => expect(screen.getByText('Bad code')).toBeInTheDocument());
  });

  it('shows network error on enable exception', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qr_code_svg: '<svg/>', provisioning_uri: 'x' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByLabelText('6-digit code')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '123456' } });
    mockFetchGlobal.mockRejectedValueOnce(new Error('net'));
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('disables MFA', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: true, mfa_configured: true } } } as never);
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('MFA is enabled')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code to disable'), { target: { value: '654321' } });
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    fireEvent.click(screen.getByText('Disable MFA'));
    await waitFor(() => expect(screen.getByText('MFA disabled successfully')).toBeInTheDocument());
  });

  it('shows error on disable failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: true, mfa_configured: true } } } as never);
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('MFA is enabled')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code to disable'), { target: { value: '000000' } });
    mockFetchGlobal.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: { message: 'Wrong code' } }) });
    fireEvent.click(screen.getByText('Disable MFA'));
    await waitFor(() => expect(screen.getByText('Wrong code')).toBeInTheDocument());
  });

  it('shows network error on disable exception', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: true, mfa_configured: true } } } as never);
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('MFA is enabled')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code to disable'), { target: { value: '111111' } });
    mockFetchGlobal.mockRejectedValueOnce(new Error('net'));
    fireEvent.click(screen.getByText('Disable MFA'));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('strips non-digit input', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: { data: { mfa_enabled: false, mfa_configured: false } } } as never);
    mockFetchGlobal.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qr_code_svg: '<svg/>', provisioning_uri: 'x' } }) });
    render(<MfaSettings />);
    fireEvent.click(screen.getByText('Check MFA Status'));
    await waitFor(() => expect(screen.getByText('Enable MFA')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Enable MFA'));
    await waitFor(() => expect(screen.getByLabelText('6-digit code')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: 'abc123' } });
    expect(screen.getByLabelText('6-digit code')).toHaveValue('123');
  });
});
