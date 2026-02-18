// autoloan-nextjs-metafullstack/src/app/dashboard/applications/[id]/status/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { Application } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'customer' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/applications', () => ({
  applicationsService: { get: vi.fn(), listDocuments: vi.fn(), uploadDocument: vi.fn() },
}));
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return { ...actual, use: () => ({ id: '1' }) };
});

import ApplicationStatusPage from './page';
import { applicationsService } from '@/services/applications';

const mockGet = vi.mocked(applicationsService.get);
const mockListDocs = vi.mocked(applicationsService.listDocuments);
const mockUploadDoc = vi.mocked(applicationsService.uploadDocument);

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1, user_id: 1, application_number: 'APP-001', status: 'submitted',
  current_step: 5, personal_info: {}, car_details: { year: '2024', make: 'Toyota', model: 'Camry' },
  loan_details: { amount: '30000' }, employment_info: {},
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: null,
  signature_data: null, signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15',
  ...overrides,
});

describe('ApplicationStatusPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders status page with application details', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Application Status')).toBeInTheDocument());
    expect(screen.getByText(/APP-001/)).toBeInTheDocument();
    expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
    expect(screen.getByText('2024 Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
    expect(screen.getByText('60 months')).toBeInTheDocument();
    expect(screen.getByText('$590.50')).toBeInTheDocument();
  });

  it('shows error when load fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('shows status description for submitted', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/submitted and is waiting/)).toBeInTheDocument());
  });

  it('shows status descriptions for various statuses', async () => {
    for (const [status, text] of [
      ['approved', /loan has been approved/],
      ['rejected', /not approved/],
      ['pending_documents', /Additional documents/],
      ['under_review', /underwriting review/],
      ['pending', /verifying your initial/],
    ] as [string, RegExp][]) {
      mockGet.mockResolvedValueOnce(makeApp({ status: status as Application['status'] }));
      mockListDocs.mockResolvedValueOnce([]);
      const { unmount } = render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
      await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
      unmount();
    }
  });

  it('shows document list', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockListDocs.mockResolvedValueOnce([
      { id: 1, doc_type: 'drivers_license', status: 'verified', file_attached: true, file_name: 'dl.pdf' } as never,
    ]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText("Driver's License")).toBeInTheDocument());
    expect(screen.getByText('dl.pdf')).toBeInTheDocument();
  });

  it('shows requested docs alert for pending_documents', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'pending_documents' }));
    mockListDocs.mockResolvedValueOnce([
      { id: 10, doc_type: 'proof_income', status: 'requested' } as never,
    ]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Action Required')).toBeInTheDocument());
    expect(screen.getByText('Upload proof income')).toBeInTheDocument();
  });

  it('shows submitted date in status history', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ submitted_at: '2025-02-01' }));
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1));
    expect(screen.getByText('Draft Created')).toBeInTheDocument();
  });

  it('navigates back to dashboard', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Back to Dashboard')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows fallback app ID', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ application_number: '' }));
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('handles upload', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'pending_documents' }));
    mockListDocs.mockResolvedValueOnce([
      { id: 10, doc_type: 'proof_income', status: 'requested' } as never,
    ]);
    mockUploadDoc.mockResolvedValueOnce(undefined as never);
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Upload proof income')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Upload proof income'));
  });

  it('renders draft status with default color', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'draft' }));
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('DRAFT')).toBeInTheDocument());
  });

  it('renders without submitted_at', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ submitted_at: null }));
    mockListDocs.mockResolvedValueOnce([]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Draft Created')).toBeInTheDocument());
  });

  it('triggers file upload and handles success', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'pending_documents' }));
    const requestedDoc = { id: 10, doc_type: 'proof_income', status: 'requested' } as never;
    mockListDocs.mockResolvedValueOnce([requestedDoc]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/Upload proof/)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Upload proof/));

    mockUploadDoc.mockResolvedValueOnce({} as never);
    mockListDocs.mockResolvedValueOnce([requestedDoc]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [file], writable: true });
    fireEvent.change(fileInput);
    await waitFor(() => expect(mockUploadDoc).toHaveBeenCalled());
  });

  it('ignores file change with no files', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'pending_documents' }));
    mockListDocs.mockResolvedValueOnce([
      { id: 10, doc_type: 'proof_income', status: 'requested' } as never,
    ]);
    render(<ApplicationStatusPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/Upload proof/)).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [], writable: true });
    fireEvent.change(fileInput);
    expect(mockUploadDoc).not.toHaveBeenCalled();
  });
});
