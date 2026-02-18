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

  it('renders payment calculator', () => {
    render(<LandingPage />);
    expect(screen.getByText('Calculate Your Payments')).toBeInTheDocument();
    expect(screen.getByText('Your Monthly Payment')).toBeInTheDocument();
    expect(screen.getByText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByText('Loan Term (Months)')).toBeInTheDocument();
  });

  it('displays a calculated monthly payment', () => {
    render(<LandingPage />);
    const paymentEl = screen.getByText(/^\$/);
    expect(paymentEl).toBeInTheDocument();
    expect(paymentEl.textContent).toMatch(/^\$\d+\.\d{2}$/);
  });

  it('renders interest rate select with APR options', () => {
    render(<LandingPage />);
    expect(screen.getByLabelText(/Interest Rate/)).toBeInTheDocument();
  });
});
