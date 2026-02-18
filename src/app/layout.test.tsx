// autoloan-nextjs-metafullstack/src/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('renders children content', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Content</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders html element with lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <p>Hello</p>
      </RootLayout>
    );
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
  });

  it('applies font CSS variables to body', () => {
    const { container } = render(
      <RootLayout>
        <p>Hello</p>
      </RootLayout>
    );
    const body = container.querySelector('body');
    expect(body?.className).toContain('--font-geist-sans');
    expect(body?.className).toContain('--font-geist-mono');
  });
});
