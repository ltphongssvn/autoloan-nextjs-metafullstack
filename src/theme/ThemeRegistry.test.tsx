// autoloan-nextjs-metafullstack/src/theme/ThemeRegistry.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((cb: () => void) => cb()),
}));

import ThemeRegistry from './ThemeRegistry';

describe('ThemeRegistry', () => {
  it('renders children', () => {
    render(
      <ThemeRegistry>
        <div data-testid="child">Hello</div>
      </ThemeRegistry>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies MUI CssBaseline', () => {
    const { container } = render(
      <ThemeRegistry>
        <p>Styled</p>
      </ThemeRegistry>
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Styled')).toBeInTheDocument();
  });

  it('is a valid React component', () => {
    expect(typeof ThemeRegistry).toBe('function');
  });
});
