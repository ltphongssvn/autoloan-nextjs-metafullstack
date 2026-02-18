// autoloan-nextjs-metafullstack/src/theme/EmotionCache.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((cb: () => void) => cb()),
}));

import NextAppDirEmotionCacheProvider from './EmotionCache';

describe('NextAppDirEmotionCacheProvider', () => {
  it('renders children', () => {
    render(
      <NextAppDirEmotionCacheProvider options={{ key: 'mui-test' }}>
        <div data-testid="emotion-child">Content</div>
      </NextAppDirEmotionCacheProvider>
    );
    expect(screen.getByTestId('emotion-child')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts custom cache key', () => {
    const { container } = render(
      <NextAppDirEmotionCacheProvider options={{ key: 'custom' }}>
        <p>Cached</p>
      </NextAppDirEmotionCacheProvider>
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('Cached')).toBeInTheDocument();
  });

  it('is a valid React component', () => {
    expect(typeof NextAppDirEmotionCacheProvider).toBe('function');
  });
});
