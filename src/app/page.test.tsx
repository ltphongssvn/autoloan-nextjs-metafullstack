// autoloan-nextjs-metafullstack/src/app/page.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

import Home from './page';

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the Next.js logo', () => {
    render(<Home />);
    expect(screen.getByAltText('Next.js logo')).toBeInTheDocument();
  });

  it('renders Deploy Now link', () => {
    render(<Home />);
    expect(screen.getByText('Deploy Now')).toBeInTheDocument();
  });

  it('renders Documentation link', () => {
    render(<Home />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('renders Templates and Learning links', () => {
    render(<Home />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });
});
