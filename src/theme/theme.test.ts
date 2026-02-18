// autoloan-nextjs-metafullstack/src/theme/theme.test.ts
import { describe, it, expect } from 'vitest';
import theme from './theme';

describe('MUI Theme', () => {
  it('should define primary palette colors', () => {
    expect(theme.palette.primary.main).toBe('#667eea');
    expect(theme.palette.primary.dark).toBe('#5a67d8');
    expect(theme.palette.primary.light).toBe('#818cf8');
    expect(theme.palette.primary.contrastText).toBe('#ffffff');
  });

  it('should define secondary palette colors', () => {
    expect(theme.palette.secondary.main).toBe('#764ba2');
  });

  it('should define status colors', () => {
    expect(theme.palette.success.main).toBe('#10b981');
    expect(theme.palette.error.main).toBe('#ef4444');
    expect(theme.palette.warning.main).toBe('#f59e0b');
    expect(theme.palette.info.main).toBe('#3b82f6');
  });

  it('should define background colors', () => {
    expect(theme.palette.background.default).toBe('#f9fafb');
    expect(theme.palette.background.paper).toBe('#ffffff');
  });

  it('should define text colors', () => {
    expect(theme.palette.text.primary).toBe('#1f2937');
    expect(theme.palette.text.secondary).toBe('#6b7280');
  });

  it('should set border radius to 8', () => {
    expect(theme.shape.borderRadius).toBe(8);
  });

  it('should configure typography with system font stack', () => {
    expect(theme.typography.fontFamily).toContain('-apple-system');
    expect(theme.typography.fontFamily).toContain('Roboto');
  });

  it('should disable button text transform', () => {
    expect(theme.typography.button.textTransform).toBe('none');
  });

  it('should be a valid MUI theme object', () => {
    expect(theme).toHaveProperty('palette');
    expect(theme).toHaveProperty('typography');
    expect(theme).toHaveProperty('shape');
    expect(theme).toHaveProperty('components');
  });
});
