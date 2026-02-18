import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
  useServerInsertedHTML: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, first_name: 'John', last_name: 'Doe', role: 'applicant' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/services/auth', () => ({
  authService: { logout: vi.fn() },
}));

import MainLayout from './MainLayout';

describe('MainLayout', () => {
  it('renders children with header', () => {
    render(<MainLayout><div>Page Content</div></MainLayout>);
    expect(screen.getByText('AutoLoan')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('opens drawer on menu click', () => {
    render(<MainLayout><div>Content</div></MainLayout>);
    fireEvent.click(screen.getByLabelText('menu'));
    expect(screen.getByText('Applicant Portal')).toBeInTheDocument();
  });

  it('renders without drawer when showDrawer is false', () => {
    render(<MainLayout showDrawer={false}><div>Content</div></MainLayout>);
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument();
  });
});
