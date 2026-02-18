import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from './useNotification';

describe('useNotification', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification.open).toBe(false);
  });

  it('opens with message and severity', () => {
    const { result } = renderHook(() => useNotification());
    act(() => result.current.notify('Saved!', 'success'));
    expect(result.current.notification).toEqual({ message: 'Saved!', severity: 'success', open: true });
  });

  it('defaults to info severity', () => {
    const { result } = renderHook(() => useNotification());
    act(() => result.current.notify('Hello'));
    expect(result.current.notification.severity).toBe('info');
  });

  it('closes notification', () => {
    const { result } = renderHook(() => useNotification());
    act(() => result.current.notify('Test', 'error'));
    act(() => result.current.close());
    expect(result.current.notification.open).toBe(false);
    expect(result.current.notification.message).toBe('Test');
  });
});
