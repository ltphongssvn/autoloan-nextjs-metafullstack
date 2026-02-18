import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'Sam', role: 'underwriter' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return { ...actual, use: () => ({ id: '1' }) };
});
vi.mock('@/services/applications', () => ({
  applicationsService: { get: vi.fn() },
}));
vi.mock('@/services/staff', () => ({
  underwriterService: { getNotes: vi.fn(), approve: vi.fn(), reject: vi.fn(), requestDocuments: vi.fn() },
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import UnderwriterAnalysisPage from './page';
import { applicationsService } from '@/services/applications';
import { underwriterService } from '@/services/staff';
import { authService } from '@/services/auth';

const mockGet = vi.mocked(applicationsService.get);
const mockGetNotes = vi.mocked(underwriterService.getNotes);
const mockApprove = vi.mocked(underwriterService.approve);
const mockReject = vi.mocked(underwriterService.reject);
const mockRequestDocs = vi.mocked(underwriterService.requestDocuments);
const mockLogout = vi.mocked(authService.logout);

const makeApp = (overrides = {}) => ({
  id: 1, user_id: 2, application_number: 'APP-0001', status: 'under_review',
  current_step: 5,
  personal_info: { first_name: 'John', last_name: 'Doe', dob: '1990-01-01' },
  car_details: { make: 'Toyota', model: 'Camry', year: '2024', price: '35000' },
  loan_details: { amount: '30000', down_payment: '5000' },
  employment_info: { employer: 'Acme', income: '80000', years: '5' },
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: null, signature_data: null,
  signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15', ...overrides,
});

describe('UnderwriterAnalysisPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetNotes.mockResolvedValue([]);
  });

  it('renders analysis page with risk assessment', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    expect(screen.getByText(/APP-0001/)).toBeInTheDocument();
    expect(screen.getByText('RISK ASSESSMENT')).toBeInTheDocument();
    expect(screen.getByText('APPLICANT SUMMARY')).toBeInTheDocument();
    expect(screen.getByText('LOAN CALCULATION')).toBeInTheDocument();
    expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    expect(screen.getByText('Loading application...')).toBeInTheDocument();
  });

  it('shows error on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('navigates back', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/underwriter');
  });

  it('handles logout', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockLogout.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('displays officer notes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockGetNotes.mockResolvedValueOnce([{ id: 1, note: 'Looks legit', internal: true, created_at: '2025-01-20', user_id: 2 }]);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/Looks legit/)).toBeInTheDocument());
    expect(screen.getByText('OFFICER NOTES')).toBeInTheDocument();
  });

  it('approves application', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockApprove.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.getByText('Approve Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirm Approval'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith(1, expect.objectContaining({ loan_term: 48 })));
    expect(mockPush).toHaveBeenCalledWith('/underwriter');
  });

  it('rejects application with reason', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockReject.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(screen.getByText('Reject Application')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Insufficient income'));
    fireEvent.click(screen.getByText('Confirm Rejection'));
    await waitFor(() => expect(mockReject).toHaveBeenCalledWith(1, 'Insufficient income', ''));
    expect(mockPush).toHaveBeenCalledWith('/underwriter');
  });

  it('reject does nothing without reason', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(screen.getByText('Reject Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirm Rejection'));
    expect(mockReject).not.toHaveBeenCalled();
  });

  it('rejects with additional explanation', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockReject.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(screen.getByText('Reject Application')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Other'));
    fireEvent.change(screen.getByLabelText('Additional Explanation'), { target: { value: 'Custom reason' } });
    fireEvent.click(screen.getByText('Confirm Rejection'));
    await waitFor(() => expect(mockReject).toHaveBeenCalledWith(1, 'Other: Custom reason', ''));
  });

  it('requests documents', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockRequestDocs.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    await waitFor(() => expect(screen.getByText('Select Documents to Request:')).toBeInTheDocument());
    const reqBtns = screen.getAllByRole('button', { name: /request documents/i }); expect(reqBtns[reqBtns.length - 1]).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Proof of Income (Pay Stubs)'));
    const submitBtns2 = screen.getAllByRole('button', { name: /request documents/i }); fireEvent.click(submitBtns2[submitBtns2.length - 1]);
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalledWith(1, ['proof_of_income'], 'Additional documents required'));
  });

  it('does not request docs with none selected', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    await waitFor(() => expect(screen.getByText('Select Documents to Request:')).toBeInTheDocument());
  });

  it('cancels approve modal', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.getByText('Approve Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Approve Application')).not.toBeInTheDocument());
  });

  it('cancels reject modal', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(screen.getByText('Reject Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Reject Application')).not.toBeInTheDocument());
  });

  it('cancels docs modal', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    await waitFor(() => expect(screen.getByText('Select Documents to Request:')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Select Documents to Request:')).not.toBeInTheDocument());
  });

  it('renders with missing info fields', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ personal_info: {}, car_details: {}, loan_details: {}, employment_info: {} }) as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Financial Analysis')).toBeInTheDocument());
  });

  it('shows fallback app ID', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ application_number: '' }) as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('renders failing risk items for bad ratios', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ employment_info: { income: '10000', years: '0' } }) as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('RISK ASSESSMENT')).toBeInTheDocument());
  });

  it('toggles doc checkboxes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    await waitFor(() => expect(screen.getByText('Select Documents to Request:')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Government ID'));
    expect(screen.getByLabelText('Government ID')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Government ID'));
    expect(screen.getByLabelText('Government ID')).not.toBeChecked();
  });

  it('fills decision notes and conditions in approve modal', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockApprove.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Decision Notes'), { target: { value: 'Good app' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(screen.getByText('Approve Application')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Conditions'), { target: { value: 'Must insure' } });
    fireEvent.change(screen.getByLabelText('APR %'), { target: { value: '5.5' } });
    fireEvent.click(screen.getByText('Confirm Approval'));
    await waitFor(() => expect(mockApprove).toHaveBeenCalledWith(1, expect.objectContaining({
      decision_notes: 'Good app', approval_conditions: 'Must insure', interest_rate: 5.5,
    })));
  });

  it('requests docs with custom notes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockRequestDocs.mockResolvedValueOnce(undefined);
    render(<UnderwriterAnalysisPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('UNDERWRITER DECISION')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Docs' }));
    await waitFor(() => expect(screen.getByText('Select Documents to Request:')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Bank Statements (Last 3 months)'));
    fireEvent.change(screen.getByPlaceholderText('Please provide the requested documents...'), { target: { value: 'Need 3 months' } });
    const submitBtn = screen.getAllByText('Request Documents').find(el => el.closest('button') && !el.closest('button')?.disabled);
    fireEvent.click(submitBtn!.closest('button')!);
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalledWith(1, ['bank_statements'], 'Need 3 months'));
  });
});
