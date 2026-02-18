// autoloan-nextjs-metafullstack/src/app/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

  it('renders Login button', () => {
    render(<LandingPage />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders Apply Now buttons', () => {
    render(<LandingPage />);
    const applyButtons = screen.getAllByText('Apply Now');
    expect(applyButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders payment calculator', () => {
    render(<LandingPage />);
    expect(screen.getByText('Calculate Your Payments')).toBeInTheDocument();
    expect(screen.getByText('Your Monthly Payment')).toBeInTheDocument();
  });
});
