// autoloan-nextjs-metafullstack/src/app/officer/applications/[id]/page.test.tsx
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
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return { ...actual, use: () => ({ id: '1' }) };
});
vi.mock('@/services/applications', () => ({
  applicationsService: { get: vi.fn(), listDocuments: vi.fn(), deleteDocument: vi.fn(), uploadDocument: vi.fn() },
}));
vi.mock('@/services/staff', () => ({
  loanOfficerService: { getNotes: vi.fn(), addNote: vi.fn(), startVerification: vi.fn(), forwardToUnderwriter: vi.fn(), requestDocuments: vi.fn() },
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import OfficerApplicationReviewPage from './page';
import { applicationsService } from '@/services/applications';
import { loanOfficerService } from '@/services/staff';
import { authService } from '@/services/auth';

const mockGet = vi.mocked(applicationsService.get);
const mockListDocs = vi.mocked(applicationsService.listDocuments);
const mockDeleteDoc = vi.mocked(applicationsService.deleteDocument);
const mockGetNotes = vi.mocked(loanOfficerService.getNotes);
const mockAddNote = vi.mocked(loanOfficerService.addNote);
const mockStartVerify = vi.mocked(loanOfficerService.startVerification);
const mockForward = vi.mocked(loanOfficerService.forwardToUnderwriter);
const mockRequestDocs = vi.mocked(loanOfficerService.requestDocuments);
const mockLogout = vi.mocked(authService.logout);

const makeApp = (overrides = {}) => ({
  id: 1, user_id: 2, application_number: 'APP-0001', status: 'submitted',
  current_step: 5,
  personal_info: { first_name: 'John', last_name: 'Doe', dob: '1990-01-01', ssn: '123456789', phone: '555-1234', email: 'john@test.com', address: '123 Main', city: 'NY', state: 'NY', zip: '10001' },
  car_details: { make: 'Toyota', model: 'Camry', year: '2024', price: '35000' },
  loan_details: { amount: '30000', down_payment: '5000' },
  employment_info: { employer: 'Acme', job_title: 'Dev', income: '80000' },
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: null, signature_data: null,
  signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15', ...overrides,
});

const openActionSelect = async () => {
  const decisionCard = screen.getByText('Decision Center').closest('.MuiCard-root') as HTMLElement;
  const selectTrigger = within(decisionCard).getByRole('combobox');
  fireEvent.mouseDown(selectTrigger);
  await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument());
};

describe('OfficerApplicationReviewPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetNotes.mockResolvedValue([]);
    mockListDocs.mockResolvedValue([]);
  });

  it('renders review page with application details', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
    expect(screen.getByText(/APP-0001/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    expect(screen.getByText('Loading application...')).toBeInTheDocument();
  });

  it('shows error on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('navigates back to officer dashboard', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/officer');
  });

  it('handles logout', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockLogout.mockResolvedValueOnce(undefined);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('adds an internal note', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockAddNote.mockResolvedValueOnce(undefined);
    mockGetNotes.mockResolvedValue([]);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Add note...'), { target: { value: 'Test note' } });
    fireEvent.click(screen.getByText('Add Note'));
    await waitFor(() => expect(mockAddNote).toHaveBeenCalledWith(1, 'Test note'));
  });

  it('does not add empty note', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Note'));
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it('displays existing notes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockGetNotes.mockResolvedValueOnce([{ id: 1, note: 'Officer note 1', internal: true, created_at: '2025-01-20', user_id: 1 }]);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Officer note 1')).toBeInTheDocument());
  });

  it('displays documents', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockListDocs.mockResolvedValueOnce([
      { id: 1, doc_type: 'drivers_license', file_name: 'dl.pdf', file_url: '/dl.pdf', file_size: 100, content_type: 'application/pdf', status: 'verified', rejection_note: null, request_note: null, uploaded_at: '2025-01-10', verified_at: '2025-01-11', created_at: '2025-01-10' },
    ] as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Drivers License')).toBeInTheDocument());
  });

  it('deletes a document', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockListDocs.mockResolvedValueOnce([
      { id: 5, doc_type: 'proof_income', file_name: 'pay.pdf', file_url: null, file_size: 100, content_type: 'application/pdf', status: 'pending', rejection_note: null, request_note: null, uploaded_at: '2025-01-10', verified_at: null, created_at: '2025-01-10' },
    ] as never);
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    mockListDocs.mockResolvedValueOnce([]);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Proof Income')).toBeInTheDocument());
    const row = screen.getByText('Proof Income').closest('tr')!;
    const deleteBtn = Array.from(row.querySelectorAll('button')).find(b => b.querySelector('svg[data-testid="DeleteIcon"]'));
    if (deleteBtn) fireEvent.click(deleteBtn);
    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledWith(1, 5));
  });

  it('toggles verification checkboxes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Verification Checklist')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Applicant 18+'));
    fireEvent.click(screen.getByLabelText('ID matches'));
    fireEvent.click(screen.getByLabelText('Residency confirmed'));
    fireEvent.click(screen.getByLabelText('Employment verified'));
    fireEvent.click(screen.getByLabelText('Documents legible'));
    expect(screen.getByLabelText('Applicant 18+')).toBeChecked();
  });

  it('submits start verification action', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockStartVerify.mockResolvedValueOnce(makeApp({ status: 'pending' }) as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Start Verification'));
    fireEvent.click(screen.getByText('Submit Decision'));
    await waitFor(() => expect(mockStartVerify).toHaveBeenCalledWith(1));
  });

  it('submits forward to underwriter action with notes', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockAddNote.mockResolvedValueOnce(undefined);
    mockForward.mockResolvedValueOnce(makeApp({ status: 'under_review' }) as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Forward to Underwriter'));
    fireEvent.change(screen.getByPlaceholderText('Notes...'), { target: { value: 'Looks good' } });
    fireEvent.click(screen.getByText('Submit Decision'));
    await waitFor(() => expect(mockForward).toHaveBeenCalledWith(1));
    expect(mockAddNote).toHaveBeenCalledWith(1, 'Looks good');
  });

  it('opens request documents modal and sends request', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockRequestDocs.mockResolvedValueOnce(undefined);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Request Documents'));
    fireEvent.click(screen.getByText('Submit Decision'));
    await waitFor(() => expect(screen.getByText('Request Additional Documents')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Bank Statements (3 months)'));
    fireEvent.change(screen.getByPlaceholderText('Please provide bank statements...'), { target: { value: 'Need 3 months' } });
    fireEvent.click(screen.getByText('Send Request'));
    await waitFor(() => expect(mockRequestDocs).toHaveBeenCalled());
  });

  it('closes request documents modal on cancel', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Request Documents'));
    fireEvent.click(screen.getByText('Submit Decision'));
    await waitFor(() => expect(screen.getByText('Request Additional Documents')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Request Additional Documents')).not.toBeInTheDocument());
  });

  it('does not submit when no action selected', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    expect(screen.getByText('Submit Decision').closest('button')).toBeDisabled();
  });

  it('shows fallback app ID', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ application_number: '' }) as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('renders no documents message when empty', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockListDocs.mockResolvedValueOnce([]);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument());
  });

  it('renders with missing personal info fields', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ personal_info: {}, employment_info: {}, car_details: {}, loan_details: {}, monthly_payment: null, interest_rate: null }) as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Review Application')).toBeInTheDocument());
  });

  it('toggles other doc type text field in request modal', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Request Documents'));
    fireEvent.click(screen.getByText('Submit Decision'));
    await waitFor(() => expect(screen.getByText('Request Additional Documents')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Other'));
    expect(screen.getByPlaceholderText('Specify document type...')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Specify document type...'), { target: { value: 'Custom doc' } });
  });

  it('renders pending status app with forward option', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'pending' }) as never);
    render(<OfficerApplicationReviewPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Decision Center')).toBeInTheDocument());
    await openActionSelect();
    expect(within(screen.getByRole('listbox')).getByText('Forward to Underwriter')).toBeInTheDocument();
  });
});
