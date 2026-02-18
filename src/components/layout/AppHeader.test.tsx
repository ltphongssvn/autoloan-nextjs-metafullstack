import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
  useServerInsertedHTML: vi.fn(),
}));

const mockLogout = vi.fn();
const mockUser = { id: 1, first_name: 'John', last_name: 'Doe', role: 'applicant' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, isLoading: false, isAuthenticated: !!currentUser, setUser: vi.fn(), logout: mockLogout }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}));

import AppHeader from './AppHeader';

describe('AppHeader', () => {
  beforeEach(() => { vi.clearAllMocks(); currentUser = mockUser; });

  it('renders with user info', () => {
    render(<AppHeader />);
    expect(screen.getByText('AutoLoan')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows login button when no user', () => {
    currentUser = null;
    render(<AppHeader />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to dashboard on logo click', () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByText('AutoLoan'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to officer dashboard for loan_officer', () => {
    currentUser = { ...mockUser, role: 'loan_officer' };
    render(<AppHeader />);
    fireEvent.click(screen.getByText('AutoLoan'));
    expect(mockPush).toHaveBeenCalledWith('/officer');
  });

  it('navigates to underwriter dashboard for underwriter', () => {
    currentUser = { ...mockUser, role: 'underwriter' };
    render(<AppHeader />);
    fireEvent.click(screen.getByText('AutoLoan'));
    expect(mockPush).toHaveBeenCalledWith('/underwriter');
  });

  it('opens account menu and navigates to settings', async () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByLabelText('account'));
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('opens account menu and navigates to dashboard', async () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByLabelText('account'));
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Dashboard'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles logout from menu', async () => {
    render(<AppHeader />);
    fireEvent.click(screen.getByLabelText('account'));
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('shows menu button when showMenu is true', () => {
    const onMenuClick = vi.fn();
    render(<AppHeader showMenu onMenuClick={onMenuClick} />);
    fireEvent.click(screen.getByLabelText('menu'));
    expect(onMenuClick).toHaveBeenCalled();
  });

  it('handles missing last_name for initials', () => {
    currentUser = { ...mockUser, last_name: '' } as typeof mockUser;
    render(<AppHeader />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
