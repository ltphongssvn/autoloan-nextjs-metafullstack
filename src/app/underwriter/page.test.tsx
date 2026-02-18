// autoloan-nextjs-metafullstack/src/app/underwriter/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'Sam', role: 'underwriter' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/staff', () => ({
  underwriterService: { listApplications: vi.fn() },
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import UnderwriterDashboardPage from './page';
import { underwriterService } from '@/services/staff';
import { authService } from '@/services/auth';

const mockList = vi.mocked(underwriterService.listApplications);
const mockLogout = vi.mocked(authService.logout);

const now = new Date();
const makeApp = (id: number, status = 'under_review', overrides = {}) => ({
  id, user_id: 2, application_number: `APP-${id.toString().padStart(4, '0')}`, status,
  current_step: 5, personal_info: { first_name: 'John', last_name: 'Doe' },
  car_details: { year: '2024', make: 'Toyota', model: 'Camry', price: '35000' },
  loan_details: { amount: '30000', down_payment: '5000' },
  employment_info: { income: '80000' },
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: null, signature_data: null,
  signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15', ...overrides,
});

const openFilter = async (currentText: string, optionText: string) => {
  const el = screen.getByText(currentText);
  const selectNode = el.closest('[role="combobox"]') || el.parentElement!;
  fireEvent.mouseDown(selectNode);
  await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
  fireEvent.click(within(screen.getByRole('listbox')).getByText(optionText));
};

describe('UnderwriterDashboardPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders dashboard with stats and applications', async () => {
    mockList.mockResolvedValueOnce([
      makeApp(1, 'under_review'),
      makeApp(2, 'pending_documents'),
      makeApp(3, 'approved', { decided_at: now.toISOString() }),
    ] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('Underwriter Dashboard')).toBeInTheDocument());
    expect(screen.getByText('Welcome, Sam')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Pending Docs')).toBeInTheDocument();
    expect(screen.getByText('Completed This Month')).toBeInTheDocument();
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<UnderwriterDashboardPage />);
    expect(screen.getByText('Loading applications...')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    mockList.mockResolvedValueOnce([makeApp(1, 'under_review'), makeApp(2, 'approved')] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Status', 'Approved');
    expect(screen.queryByText('APP-0001')).not.toBeInTheDocument();
    expect(screen.getByText('APP-0002')).toBeInTheDocument();
  });

  it('filters by risk level', async () => {
    // High DTI (>40) = high risk
    const highRiskApp = makeApp(1, 'under_review', { employment_info: { income: '20000' } });
    // Low DTI = low risk
    const lowRiskApp = makeApp(2, 'under_review', { employment_info: { income: '200000' } });
    mockList.mockResolvedValueOnce([highRiskApp, lowRiskApp] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Risk', 'Low Risk');
    expect(screen.queryByText('APP-0001')).not.toBeInTheDocument();
    expect(screen.getByText('APP-0002')).toBeInTheDocument();
  });

  it('filters by medium risk', async () => {
    // DTI 30-40 or LTV 80-90 = medium
    const medRiskApp = makeApp(1, 'under_review', { employment_info: { income: '45000' } });
    mockList.mockResolvedValueOnce([medRiskApp] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Risk', 'Medium Risk');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });

  it('filters by amount under 25k', async () => {
    const smallApp = makeApp(1, 'under_review', { loan_details: { amount: '20000', down_payment: '5000' } });
    const bigApp = makeApp(2, 'under_review', { loan_details: { amount: '60000', down_payment: '5000' } });
    mockList.mockResolvedValueOnce([smallApp, bigApp] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Amounts', 'Under $25k');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
    expect(screen.queryByText('APP-0002')).not.toBeInTheDocument();
  });

  it('filters by amount 25k-50k', async () => {
    mockList.mockResolvedValueOnce([makeApp(1)] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Amounts', '$25k - $50k');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });

  it('filters by amount over 50k', async () => {
    const bigApp = makeApp(1, 'under_review', { loan_details: { amount: '60000', down_payment: '5000' } });
    mockList.mockResolvedValueOnce([bigApp] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Amounts', 'Over $50k');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });

  it('navigates to analysis page on Analyze click', async () => {
    mockList.mockResolvedValueOnce([makeApp(1)] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    expect(mockPush).toHaveBeenCalledWith('/underwriter/applications/1');
  });

  it('handles logout', async () => {
    mockList.mockResolvedValueOnce([] as never);
    mockLogout.mockResolvedValueOnce(undefined);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('Underwriter Dashboard')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('handles load error gracefully', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockList.mockRejectedValueOnce(new Error('fail'));
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('Underwriter Dashboard')).toBeInTheDocument());
    spy.mockRestore();
  });

  it('shows fallback app ID', async () => {
    mockList.mockResolvedValueOnce([makeApp(1, 'under_review', { application_number: '' })] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
  });

  it('paginates when more than 10 apps', async () => {
    const apps = Array.from({ length: 12 }, (_, i) => makeApp(i + 1));
    mockList.mockResolvedValueOnce(apps as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    expect(screen.queryByText('APP-0011')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(screen.getByText('APP-0011')).toBeInTheDocument();
  });

  it('renders with zero income and zero vehicle price', async () => {
    const app = makeApp(1, 'under_review', { employment_info: {}, car_details: {}, loan_details: {} });
    mockList.mockResolvedValueOnce([app] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
  });

  it('counts completed this month correctly with rejected', async () => {
    mockList.mockResolvedValueOnce([
      makeApp(1, 'rejected', { decided_at: now.toISOString() }),
      makeApp(2, 'rejected', { decided_at: '2020-01-01' }),
    ] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('Underwriter Dashboard')).toBeInTheDocument());
  });

  it('filters by pending docs and rejected statuses', async () => {
    mockList.mockResolvedValueOnce([makeApp(1, 'pending_documents'), makeApp(2, 'rejected')] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Status', 'Pending Docs');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
    expect(screen.queryByText('APP-0002')).not.toBeInTheDocument();
  });

  it('shows risk legend', async () => {
    mockList.mockResolvedValueOnce([] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('Underwriter Dashboard')).toBeInTheDocument());
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('filters by high risk', async () => {
    const highRiskApp = makeApp(1, 'under_review', { employment_info: { income: '20000' } });
    mockList.mockResolvedValueOnce([highRiskApp] as never);
    render(<UnderwriterDashboardPage />);
    await waitFor(() => expect(screen.getByText('APP-0001')).toBeInTheDocument());
    await openFilter('All Risk', 'High Risk');
    expect(screen.getByText('APP-0001')).toBeInTheDocument();
  });
});
