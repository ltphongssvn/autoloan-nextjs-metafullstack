// autoloan-nextjs-metafullstack/src/app/officer/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'Jane', role: 'loan_officer' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/staff', () => ({
  loanOfficerService: { listApplications: vi.fn() },
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import OfficerDashboardPage from './page';
import { loanOfficerService } from '@/services/staff';
import { authService } from '@/services/auth';

const mockList = vi.mocked(loanOfficerService.listApplications);
const mockLogout = vi.mocked(authService.logout);

const makeApp = (id: number, status = 'submitted', overrides = {}) => ({
  id, user_id: 2, application_number: `APP-${id.toString().padStart(4, '0')}`, status,
  current_step: 5, personal_info: { first_name: 'John', last_name: 'Doe' },
  car_details: { year: '2024', make: 'Toyota', model: 'Camry' },
  loan_details: { amount: '30000' }, employment_info: {},
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: null, signature_data: null,
  signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15', ...overrides,
});

const openDateFilter = async (value: string) => {
  const allDatesText = screen.getByText('All Dates');
  const selectNode = allDatesText.closest('[role="combobox"]') || allDatesText.parentElement!;
  fireEvent.mouseDown(selectNode);
  await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
  fireEvent.click(within(screen.getByRole('listbox')).getByText(value));
};

describe('OfficerDashboardPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders dashboard with applications', async () => {
    mockList.mockResolvedValueOnce([makeApp(1), makeApp(2, 'pending'), makeApp(3, 'under_review')] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('Officer Dashboard')).toBeInTheDocument());
    expect(screen.getByText('Welcome, Jane')).toBeInTheDocument();
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('New Applications')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<OfficerDashboardPage />);
    expect(screen.getByText('Loading applications...')).toBeInTheDocument();
  });

  it('filters by status tab', async () => {
    mockList.mockResolvedValueOnce([makeApp(1, 'submitted'), makeApp(2, 'pending')] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('tab', { name: 'Verifying' }));
    expect(screen.queryByText('APP-0001')).not.toBeInTheDocument();
    expect(screen.getByText('APP-0002')).toBeInTheDocument();
  });

  it('filters by search term', async () => {
    mockList.mockResolvedValueOnce([makeApp(1), makeApp(2, 'submitted', { personal_info: { first_name: 'Alice', last_name: 'Smith' } })] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'Alice' } });
    expect(screen.queryByText('APP-0001')).not.toBeInTheDocument();
    expect(screen.getByText('APP-0002')).toBeInTheDocument();
  });

  it('filters by date range', async () => {
    const oldApp = makeApp(1, 'submitted', { created_at: '2020-01-01' });
    const newApp = makeApp(2, 'submitted', { created_at: new Date().toISOString() });
    mockList.mockResolvedValueOnce([oldApp, newApp] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openDateFilter('Last 7 Days');
    expect(screen.queryByText('APP-0001')).not.toBeInTheDocument();
    expect(screen.getByText('APP-0002')).toBeInTheDocument();
  });

  it('navigates to application review on View click', async () => {
    mockList.mockResolvedValueOnce([makeApp(1)] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(mockPush).toHaveBeenCalledWith('/officer/applications/1');
  });

  it('handles logout', async () => {
    mockList.mockResolvedValueOnce([] as never);
    mockLogout.mockResolvedValueOnce(undefined);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('Officer Dashboard')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('handles load error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockList.mockRejectedValueOnce(new Error('Network error'));
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('Officer Dashboard')).toBeInTheDocument());
    consoleSpy.mockRestore();
  });

  it('shows fallback app ID when no application_number', async () => {
    mockList.mockResolvedValueOnce([makeApp(1, 'submitted', { application_number: '' })] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
  });

  it('paginates when more than 10 apps', async () => {
    const apps = Array.from({ length: 12 }, (_, i) => makeApp(i + 1));
    mockList.mockResolvedValueOnce(apps as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    expect(screen.queryByText('APP-0011')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(screen.getByText('APP-0011')).toBeInTheDocument();
  });

  it('filters by today date range', async () => {
    const todayApp = makeApp(1, 'submitted', { created_at: new Date().toISOString() });
    mockList.mockResolvedValueOnce([todayApp] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openDateFilter('Today');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });

  it('filters by month date range', async () => {
    const recentApp = makeApp(1, 'submitted', { created_at: new Date().toISOString() });
    mockList.mockResolvedValueOnce([recentApp] as never);
    render(<OfficerDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openDateFilter('Last 30 Days');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });
});
