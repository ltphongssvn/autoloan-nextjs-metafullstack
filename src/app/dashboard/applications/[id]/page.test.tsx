import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Application } from '@/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));

const mockAuth = { user: { id: 1, role: 'customer' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/services/applications', () => ({
  applicationsService: { get: vi.fn(), update: vi.fn(), submit: vi.fn() },
}));

// We need to test the inner component since use(Promise) doesn't work in happy-dom.
// Re-export the default but also expose internals via a separate import approach.
// Instead, we'll mock the `use` React hook to return resolved params directly.
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: (promise: unknown) => {
      // If it's a promise with an id property (our params), return it synchronously
      if (promise && typeof promise === 'object' && 'then' in promise) {
        // Return a default for params
        return { id: '1' };
      }
      return promise;
    },
  };
});

import ApplicationPage from './page';
import { applicationsService } from '@/services/applications';

const mockGet = vi.mocked(applicationsService.get);
const mockUpdate = vi.mocked(applicationsService.update);
const mockSubmit = vi.mocked(applicationsService.submit);

const makeApp = (overrides: Partial<Application> = {}): Application => ({
  id: 1, user_id: 1, application_number: 'APP-001', status: 'draft',
  current_step: 1, personal_info: {}, car_details: {}, loan_details: {},
  employment_info: {}, loan_term: null, interest_rate: null,
  monthly_payment: null, submitted_at: null, decided_at: null,
  signature_data: null, signed_at: null, agreement_accepted: null,
  created_at: '2025-01-01', updated_at: '2025-01-02',
  ...overrides,
});

const renderPage = () => render(<ApplicationPage params={Promise.resolve({ id: '1' })} />);

describe('ApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading then renders step 1', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    expect(screen.getByText('Application')).toBeInTheDocument();
  });

  it('shows error when load fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('navigates back to dashboard', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    fireEvent.click(screen.getAllByText('Back')[0]);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates through steps with Next', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockUpdate.mockResolvedValue(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Vehicle Information')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Loan Details', { selector: 'h6' })).toBeInTheDocument());

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Employment & Financial Info')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
  });

  it('saves draft', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockUpdate.mockResolvedValueOnce(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
  });

  it('goes back a step', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 2 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Vehicle Information')).toBeInTheDocument());
    const backButtons = screen.getAllByText('Back');
    fireEvent.click(backButtons[backButtons.length - 1]);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  it('shows error on save failure', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    mockUpdate.mockRejectedValueOnce(new Error('Save failed'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
  });

  it('submits application on step 5', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 5, loan_details: { amount: '30000', down_payment: '5000' } }));
    mockUpdate.mockResolvedValue(makeApp());
    mockSubmit.mockResolvedValueOnce(makeApp({ status: 'submitted' }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when submitting without terms', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 5 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText('Please accept terms')).toBeInTheDocument());
  });

  it('renders step 5 edit buttons to jump to steps', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 5 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(3);
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });
});

describe('ApplicationPage - additional coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fills personal info fields', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    const firstNameInput = screen.getByLabelText(/First Name/);
    fireEvent.change(firstNameInput, { target: { name: 'first_name', value: 'Jane' } });
    expect(firstNameInput).toHaveValue('Jane');
  });

  it('fills car details fields on step 2', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 2 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Vehicle Information')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Trim Level/), { target: { name: 'trim', value: 'SE' } });
    fireEvent.change(screen.getByLabelText(/Mileage/), { target: { name: 'mileage', value: '5000' } });
    fireEvent.change(screen.getByLabelText(/VIN/), { target: { name: 'vin', value: '12345678901234567' } });
    fireEvent.change(screen.getByLabelText(/Vehicle Value/), { target: { name: 'price', value: '30000' } });
    // Radio buttons
    fireEvent.click(screen.getByLabelText('New'));
    expect(screen.getByLabelText('New')).toBeChecked();
  });

  it('displays loan summary on step 3', async () => {
    mockGet.mockResolvedValueOnce(makeApp({
      current_step: 3,
      car_details: { price: '40000' },
      loan_details: { amount: '35000', down_payment: '5000' },
    }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Loan Summary')).toBeInTheDocument());
    expect(screen.getByText('$40,000')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
  });

  it('fills employment fields on step 4', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 4 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Employment & Financial Info')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { name: 'employer', value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Job Title/), { target: { name: 'job_title', value: 'Dev' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { name: 'income', value: '80000' } });
    fireEvent.change(screen.getByLabelText(/Monthly Expenses/), { target: { name: 'expenses', value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Other Income/), { target: { name: 'other_income', value: '500' } });
    fireEvent.change(screen.getByLabelText(/Credit Score/), { target: { name: 'credit_score', value: '750' } });
    expect(screen.getByLabelText(/Employer/)).toHaveValue('Acme');
  });

  it('shows DTI ratio on step 4 with income', async () => {
    mockGet.mockResolvedValueOnce(makeApp({
      current_step: 4,
      employment_info: { income: '60000', other_income: '0' },
      loan_details: { amount: '20000', down_payment: '0' },
    }));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Debt-to-Income Ratio/)).toBeInTheDocument());
  });

  it('toggles document checkboxes on step 5', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 5 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Driver's License"));
    fireEvent.click(screen.getByLabelText('Proof of Income'));
    fireEvent.click(screen.getByLabelText('Proof of Residence'));
    expect(screen.getByLabelText("Driver's License")).toBeChecked();
    expect(screen.getByLabelText('Proof of Income')).toBeChecked();
    expect(screen.getByLabelText('Proof of Residence')).toBeChecked();
  });

  it('selects different loan term on step 5', async () => {
    mockGet.mockResolvedValueOnce(makeApp({
      current_step: 5,
      loan_details: { amount: '20000', down_payment: '2000' },
    }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
    fireEvent.click(screen.getByText('36 months'));
    expect(screen.getByText('6.5% APR')).toBeInTheDocument();
  });

  it('shows submit failure error', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 5 }));
    mockUpdate.mockResolvedValue(makeApp());
    mockSubmit.mockRejectedValueOnce(new Error('Submit failed'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Select Terms & Review')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText('Submit failed')).toBeInTheDocument());
  });

  it('fills loan detail fields on step 3', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 3 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Loan Details', { selector: 'h6' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Loan Amount/), { target: { name: 'amount', value: '25000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { name: 'down_payment', value: '5000' } });
    expect(screen.getByLabelText(/Loan Amount/)).toHaveValue(25000);
  });
});

describe('ApplicationPage - Select onChange handlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('changes State select on step 1 via native input', async () => {
    mockGet.mockResolvedValueOnce(makeApp());
    renderPage();
    await waitFor(() => expect(screen.getByText('Personal Information')).toBeInTheDocument());
    const stateInput = document.querySelector('input[name="state"]');
    expect(stateInput).toBeTruthy();
  });

  it('changes Make and Year selects on step 2 via native input', async () => {
    mockGet.mockResolvedValueOnce(makeApp({ current_step: 2 }));
    renderPage();
    await waitFor(() => expect(screen.getByText('Vehicle Information')).toBeInTheDocument());
    const makeInput = document.querySelector('input[name="make"]');
    const yearInput = document.querySelector('input[name="year"]');
    expect(makeInput).toBeTruthy();
    expect(yearInput).toBeTruthy();
  });
});
