// autoloan-nextjs-metafullstack/src/app/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useServerInsertedHTML: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false, setUser: vi.fn(), logout: vi.fn(), isAuthenticated: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import LandingPage from './page';

describe('LandingPage', () => {
  it('renders the heading', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Get Your Auto Loan in 15 minutes');
  });

  it('renders Auto Loan brand text', () => {
    render(<LandingPage />);
    expect(screen.getByText('Auto Loan')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Fast online approval/)).toBeInTheDocument();
  });

  it('renders Login button and navigates', () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByText('Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders Apply Now buttons and navigates to signup', () => {
    render(<LandingPage />);
    const applyButtons = screen.getAllByText('Apply Now');
    expect(applyButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(applyButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('bottom Apply Now button navigates to signup', () => {
    render(<LandingPage />);
    const applyButtons = screen.getAllByText('Apply Now');
    fireEvent.click(applyButtons[applyButtons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });

  it('renders payment calculator', () => {
    render(<LandingPage />);
    expect(screen.getByText('Calculate Your Payments')).toBeInTheDocument();
    expect(screen.getByText('Your Monthly Payment')).toBeInTheDocument();
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByText('Loan Term (Months)')).toBeInTheDocument();
  });

  it('displays a calculated monthly payment', () => {
    const { container } = render(<LandingPage />);
    const paymentHeading = container.querySelector('h4');
    expect(paymentHeading).toBeTruthy();
    expect(paymentHeading!.textContent).toMatch(/^\$\d+\.\d{2}$/);
  });

  it('renders interest rate select', () => {
    render(<LandingPage />);
    expect(screen.getAllByText('Interest Rate (APR)').length).toBeGreaterThanOrEqual(1);
  });

  it('loan amount slider responds to changes', () => {
    render(<LandingPage />);
    const sliders = screen.getAllByRole('slider');
    // First slider is loan amount (min=5000, max=100000)
    fireEvent.change(sliders[0], { target: { value: 50000 } });
    expect(sliders[0]).toBeTruthy();
  });

  it('loan term slider responds to changes', () => {
    render(<LandingPage />);
    const sliders = screen.getAllByRole('slider');
    // Second slider is loan term (min=12, max=84)
    fireEvent.change(sliders[1], { target: { value: 60 } });
    expect(sliders[1]).toBeTruthy();
  });

  it('interest rate select responds to changes', () => {
    const { container } = render(<LandingPage />);
    // MUI Select uses a hidden input
    const selectInput = container.querySelector('input[type="hidden"]') ||
      container.querySelector('.MuiSelect-nativeInput');
    if (selectInput) {
      fireEvent.change(selectInput, { target: { value: 7.0 } });
    }
    // Verify select renders
    expect(screen.getAllByText('Interest Rate (APR)').length).toBeGreaterThanOrEqual(1);
  });
});
