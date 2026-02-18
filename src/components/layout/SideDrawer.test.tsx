import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
  useServerInsertedHTML: vi.fn(),
}));

const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', role: 'customer' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, isLoading: false, isAuthenticated: !!currentUser, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SideDrawer from './SideDrawer';

describe('SideDrawer', () => {
  beforeEach(() => { vi.clearAllMocks(); currentUser = mockUser; });

  it('renders applicant nav items', () => {
    render(<SideDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Customer Portal')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders officer nav items', () => {
    currentUser = { ...mockUser, role: 'loan_officer' };
    render(<SideDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Loan Officer Portal')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
  });

  it('renders underwriter nav items', () => {
    currentUser = { ...mockUser, role: 'underwriter' };
    render(<SideDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Underwriter Portal')).toBeInTheDocument();
    expect(screen.getByText('Analysis Queue')).toBeInTheDocument();
  });

  it('navigates and closes on click', () => {
    const onClose = vi.fn();
    render(<SideDrawer open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing for null user', () => {
    currentUser = null;
    render(<SideDrawer open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
