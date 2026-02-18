// autoloan-nextjs-metafullstack/src/theme/EmotionCache.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';

const mockInsertedHTML: Array<() => React.ReactNode> = [];
vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((cb: () => React.ReactNode) => {
    mockInsertedHTML.push(cb);
    cb();
  }),
}));

import NextAppDirEmotionCacheProvider from './EmotionCache';

const StyledDiv = styled.div`
  color: red;
  font-size: 16px;
  background: blue;
`;

describe('NextAppDirEmotionCacheProvider', () => {
  it('renders children', () => {
    render(
      <NextAppDirEmotionCacheProvider options={{ key: 'mui-test' }}>
        <div data-testid="emotion-child">Content</div>
      </NextAppDirEmotionCacheProvider>
    );
    expect(screen.getByTestId('emotion-child')).toBeInTheDocument();
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

  it('processes emotion styles from styled components', () => {
    const { container } = render(
      <NextAppDirEmotionCacheProvider options={{ key: 'ssr' }}>
        <StyledDiv data-testid="styled">Styled Content</StyledDiv>
      </NextAppDirEmotionCacheProvider>
    );
    expect(screen.getByTestId('styled')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="styled"]')).toHaveAttribute('class');
  });

  it('handles global styles', () => {
    render(
      <NextAppDirEmotionCacheProvider options={{ key: 'glob' }}>
        <Global styles={css`body { margin: 0; padding: 0; }`} />
        <div data-testid="global-child">Global</div>
      </NextAppDirEmotionCacheProvider>
    );
    expect(screen.getByTestId('global-child')).toBeInTheDocument();
  });

  it('calls useServerInsertedHTML for SSR style extraction', () => {
    render(
      <NextAppDirEmotionCacheProvider options={{ key: 'ssrcheck' }}>
        <StyledDiv>SSR Test</StyledDiv>
      </NextAppDirEmotionCacheProvider>
    );
    expect(mockInsertedHTML.length).toBeGreaterThan(0);
  });

  it('is a valid React component', () => {
    expect(typeof NextAppDirEmotionCacheProvider).toBe('function');
  });
});
