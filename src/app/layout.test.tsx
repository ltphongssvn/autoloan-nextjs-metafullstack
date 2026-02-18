import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((cb: () => void) => cb()),
}));
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('renders children content', () => {
    const originalError = console.error;
    console.error = vi.fn();
    render(
      <RootLayout>
        <div data-testid="child">Test Content</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    console.error = originalError;
  });

  it('exports metadata with correct title and description', async () => {
    const layoutModule = await import('./layout');
    const metadata = (layoutModule as Record<string, unknown>).metadata as {
      title: string;
      description: string;
    };
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('AutoLoan - Vehicle Financing Made Simple');
    expect(metadata.description).toBe('Apply for auto loans online with a streamlined application process');
  });

  it('renders as a function component', () => {
    expect(typeof RootLayout).toBe('function');
  });
});
