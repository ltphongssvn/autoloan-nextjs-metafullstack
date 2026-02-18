import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'John', role: 'customer' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return { ...actual, use: () => ({ id: '1' }) };
});
vi.mock('@/services/applications', () => ({
  applicationsService: { get: vi.fn(), sign: vi.fn() },
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import AgreementPage from './page';
import { applicationsService } from '@/services/applications';

const mockGet = vi.mocked(applicationsService.get);
const mockSign = vi.mocked(applicationsService.sign);

const makeApp = (overrides = {}) => ({
  id: 1, user_id: 1, application_number: 'APP-0001', status: 'approved',
  current_step: 5,
  personal_info: { first_name: 'John', last_name: 'Doe', dob: '1990-01-01' },
  car_details: { make: 'Toyota', model: 'Camry', year: '2024', price: '35000' },
  loan_details: { amount: '30000', down_payment: '5000' },
  employment_info: { employer: 'Acme', income: '80000' },
  loan_term: 60, interest_rate: '6.9', monthly_payment: '590.50',
  submitted_at: '2025-01-15', decided_at: '2025-01-20', signature_data: null,
  signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-15', ...overrides,
});

// Mock canvas
const mockGetImageData = vi.fn().mockReturnValue({ data: new Uint8ClampedArray(400) });
const mockCtx = {
  strokeStyle: '', lineWidth: 0, lineCap: '', beginPath: vi.fn(), moveTo: vi.fn(),
  lineTo: vi.fn(), stroke: vi.fn(), clearRect: vi.fn(), getImageData: mockGetImageData,
};
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as never;
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,test') as never;
Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', { get: () => 500 });

describe('AgreementPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as never;
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,test') as never;
    mockGetImageData.mockReturnValue({ data: new Uint8ClampedArray(400) });
  });

  it('renders agreement with loan details', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Auto Loan Agreement')).toBeInTheDocument());
    expect(screen.getByText(/APP-0001/)).toBeInTheDocument();
    expect(screen.getByText('LOAN AGREEMENT')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/60 months/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    expect(screen.getByText('Loading agreement...')).toBeInTheDocument();
  });

  it('shows error on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('navigates back to dashboard', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Auto Loan Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows warning when not approved', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ status: 'under_review' }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/has not been approved/)).toBeInTheDocument());
  });

  it('shows already signed state', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ signed_at: '2025-01-25T10:00:00Z' }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/has been signed/)).toBeInTheDocument());
    expect(screen.queryByText('Sign Agreement')).not.toBeInTheDocument();
  });

  it('enables sign button only when agreed', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    expect(screen.getByText('Sign Agreement').closest('button')).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I have read/));
    // Still disabled because canvas is empty
    expect(screen.getByText('Sign Agreement').closest('button')).not.toBeDisabled();
  });

  it('signs the agreement', async () => {
    // Make canvas non-empty
    mockGetImageData.mockReturnValue({ data: new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 0]) });
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockSign.mockResolvedValueOnce(makeApp({ signed_at: '2025-01-25' }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/I have read/));
    fireEvent.click(screen.getByText('Sign Agreement'));
    await waitFor(() => expect(mockSign).toHaveBeenCalledWith(1, 'data:image/png;base64,test'));
  });

  it('does not sign when not agreed', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Sign Agreement'));
    expect(mockSign).not.toHaveBeenCalled();
  });

  it('handles sign error', async () => {
    mockGetImageData.mockReturnValue({ data: new Uint8ClampedArray([0, 0, 0, 255]) });
    mockGet.mockResolvedValueOnce(makeApp() as never);
    mockSign.mockRejectedValueOnce(new Error('Sign failed'));
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Sign Agreement')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/I have read/));
    fireEvent.click(screen.getByText('Sign Agreement'));
    await waitFor(() => expect(screen.getByText('Sign failed')).toBeInTheDocument());
  });

  it('clears signature', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('Clear Signature')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Clear Signature'));
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('handles canvas drawing events', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('SIGNATURE')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('handles touch drawing events', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('SIGNATURE')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.touchStart(canvas, { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchMove(canvas, { touches: [{ clientX: 20, clientY: 20 }] });
    fireEvent.touchEnd(canvas);
    expect(mockCtx.beginPath).toHaveBeenCalled();
  });

  it('stops drawing on mouse leave', async () => {
    mockGet.mockResolvedValueOnce(makeApp() as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('SIGNATURE')).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(canvas);
    mockCtx.lineTo.mockClear();
    fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });
    expect(mockCtx.lineTo).not.toHaveBeenCalled();
  });

  it('shows fallback app ID', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ application_number: '' }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/APP-0001/)).toBeInTheDocument());
  });

  it('renders with missing fields', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ personal_info: {}, car_details: {}, loan_details: {}, monthly_payment: 0 }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText('LOAN AGREEMENT')).toBeInTheDocument());
  });

  it('does not draw when already signed', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ signed_at: '2025-01-25' }) as never);
    render(<AgreementPage params={Promise.resolve({ id: '1' })} />);
    await waitFor(() => expect(screen.getByText(/has been signed/)).toBeInTheDocument());
    const canvas = document.querySelector('canvas')!;
    mockCtx.beginPath.mockClear();
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    expect(mockCtx.beginPath).not.toHaveBeenCalled();
  });
});
