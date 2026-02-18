import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com', role: 'applicant' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/applications', () => ({
  applicationsService: { create: vi.fn(), submit: vi.fn() },
}));

import ApplyPage from './page';
import { applicationsService } from '@/services/applications';

const mockCreate = vi.mocked(applicationsService.create);
const mockSubmit = vi.mocked(applicationsService.submit);

describe('ApplyPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renders step 1 with pre-filled user info', () => {
    render(<ApplyPage />);
    expect(screen.getByText('Apply for Auto Loan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
  });

  it('validates step 1 required fields', () => {
    render(<ApplyPage />);
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: '' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/required fields/)).toBeInTheDocument();
  });

  it('navigates through steps', () => {
    render(<ApplyPage />);
    // Fill step 1
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Employment Details' })).toBeInTheDocument();

    // Fill step 2
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { value: '80000' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Vehicle Information' })).toBeInTheDocument();

    // Fill step 3
    fireEvent.change(screen.getByLabelText(/Make/), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Model/), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '35000' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Loan Details' })).toBeInTheDocument();

    // Fill step 4
    fireEvent.change(screen.getByLabelText(/Loan Amount/), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Review Your Application' })).toBeInTheDocument();
  });

  it('validates step 2 required fields', () => {
    render(<ApplyPage />);
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/employer and income/)).toBeInTheDocument();
  });

  it('validates step 3 required fields', () => {
    render(<ApplyPage />);
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { value: '80000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/vehicle details/)).toBeInTheDocument();
  });

  it('validates step 4 - down payment >= amount', () => {
    render(<ApplyPage />);
    // Navigate to step 4
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { value: '80000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Make/), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Model/), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '35000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Loan Amount/), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { value: '15000' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/Down payment must be less/)).toBeInTheDocument();
  });

  it('goes back a step', () => {
    render(<ApplyPage />);
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByRole('heading', { name: 'Employment Details' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
  });

  it('saves draft', async () => {
    mockCreate.mockResolvedValueOnce({ id: 42 } as never);
    render(<ApplyPage />);
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/dashboard/applications/42');
  });

  it('handles save error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Save failed'));
    render(<ApplyPage />);
    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
  });

  it('submits application from review step', async () => {
    mockCreate.mockResolvedValueOnce({ id: 10 } as never);
    mockSubmit.mockResolvedValueOnce({} as never);
    render(<ApplyPage />);
    // Navigate to review
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { value: '80000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Make/), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Model/), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '35000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Loan Amount/), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByText('Application Submitted!')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Go to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles submit error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Submit failed'));
    render(<ApplyPage />);
    // Navigate to review
    fireEvent.change(screen.getByLabelText(/Date of Birth/), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Employer/), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Annual Income/), { target: { value: '80000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Make/), { target: { value: 'Toyota' } });
    fireEvent.change(screen.getByLabelText(/Model/), { target: { value: 'Camry' } });
    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '35000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/Loan Amount/), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Submit Application'));
    await waitFor(() => expect(screen.getByText('Submit failed')).toBeInTheDocument());
  });

  it('navigates back to dashboard', () => {
    render(<ApplyPage />);
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('back button disabled on first step', () => {
    render(<ApplyPage />);
    expect(screen.getByText('Back')).toBeDisabled();
  });
});
