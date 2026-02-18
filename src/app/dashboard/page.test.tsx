import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Application } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));

const mockAuth = {
  user: { id: 1, first_name: 'John', role: 'customer' } as Record<string, unknown>,
  isLoading: false,
  isAuthenticated: true,
  setUser: vi.fn(),
  logout: vi.fn(),
};
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/services/applications', () => ({
  applicationsService: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import DashboardPage from './page';
import { applicationsService } from '@/services/applications';
import { authService } from '@/services/auth';

const mockList = vi.mocked(applicationsService.list);
const mockCreate = vi.mocked(applicationsService.create);
const mockDelete = vi.mocked(applicationsService.delete);

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1, user_id: 1, application_number: 'APP-001', status: 'draft',
  current_step: 1, personal_info: {}, car_details: {}, loan_details: {},
  employment_info: {}, loan_term: null, interest_rate: null,
  monthly_payment: null, submitted_at: null, decided_at: null,
  signature_data: null, signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-02',
  ...overrides,
});

const emptyMeta = { current_page: 1, total_pages: 1, total_count: 0, per_page: 10 };

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: 1, first_name: 'John', role: 'customer' };
    mockAuth.isLoading = false;
  });

  it('shows empty state', async () => {
    mockList.mockResolvedValueOnce({ data: [], meta: emptyMeta });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('No applications found')).toBeInTheDocument());
    expect(screen.getByText(/Welcome back, John/)).toBeInTheDocument();
    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
  });

  it('renders applications list with vehicle and loan info', async () => {
    const apps = [
      makeApp({ id: 1, application_number: 'APP-001', status: 'draft', car_details: { make: 'Toyota', model: 'Camry', year: '2024' }, loan_details: { amount: '25000' }, loan_term: 48 }),
      makeApp({ id: 2, application_number: 'APP-002', status: 'submitted' }),
    ];
    mockList.mockResolvedValueOnce({ data: apps, meta: { ...emptyMeta, total_count: 2 } });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('APP-001')).toBeInTheDocument();
      expect(screen.getByText('APP-002')).toBeInTheDocument();
    });
    expect(screen.getByText('Toyota Camry 2024')).toBeInTheDocument();
    expect(screen.getByText('$25,000 | 48 months')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('creates new application', async () => {
    mockList.mockResolvedValueOnce({ data: [], meta: emptyMeta });
    mockCreate.mockResolvedValueOnce(makeApp({ id: 99 }));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('No applications found')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Application'));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ current_step: 1 });
      expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/99');
    });
  });

  it('deletes draft application', async () => {
    mockList.mockResolvedValueOnce({ data: [makeApp()], meta: { ...emptyMeta, total_count: 1 } });
    mockDelete.mockResolvedValueOnce(undefined);
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-001')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('DeleteIcon').closest('button')!);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(1));
  });

  it('cancels delete when confirm declined', async () => {
    mockList.mockResolvedValueOnce({ data: [makeApp()], meta: { ...emptyMeta, total_count: 1 } });
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-001')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('DeleteIcon').closest('button')!);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('handles logout', async () => {
    mockList.mockResolvedValueOnce({ data: [], meta: emptyMeta });
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(mockAuth.logout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to settings', async () => {
    mockList.mockResolvedValueOnce({ data: [], meta: emptyMeta });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('shows error when load fails', async () => {
    mockList.mockRejectedValueOnce(new Error('Network error'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('navigates to application detail on View', async () => {
    mockList.mockResolvedValueOnce({ data: [makeApp({ id: 5, application_number: 'APP-005', status: 'submitted' })], meta: { ...emptyMeta, total_count: 1 } });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-005')).toBeInTheDocument());
    fireEvent.click(screen.getByText('View'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/5');
  });

  it('shows fallback app ID when no application_number', async () => {
    mockList.mockResolvedValueOnce({ data: [makeApp({ id: 7, application_number: '' })], meta: { ...emptyMeta, total_count: 1 } });
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('#APP-0007')).toBeInTheDocument());
  });

  it('handles create failure', async () => {
    mockList.mockResolvedValueOnce({ data: [], meta: emptyMeta });
    mockCreate.mockRejectedValueOnce(new Error('Server error'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('No applications found')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Application'));
    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });

  it('handles delete failure', async () => {
    mockList.mockResolvedValueOnce({ data: [makeApp()], meta: { ...emptyMeta, total_count: 1 } });
    mockDelete.mockRejectedValueOnce(new Error('Delete failed'));
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-001')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('DeleteIcon').closest('button')!);
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeInTheDocument());
  });
});
