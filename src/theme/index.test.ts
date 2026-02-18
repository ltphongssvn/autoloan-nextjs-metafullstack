// autoloan-nextjs-metafullstack/src/theme/index.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn((cb: () => void) => cb()),
}));

import { ThemeRegistry, theme } from './index';

describe('Theme barrel export', () => {
  it('exports ThemeRegistry component', () => {
    expect(ThemeRegistry).toBeDefined();
    expect(typeof ThemeRegistry).toBe('function');
  });

  it('exports theme object', () => {
    expect(theme).toBeDefined();
    expect(theme).toHaveProperty('palette');
    expect(theme).toHaveProperty('typography');
  });
});
