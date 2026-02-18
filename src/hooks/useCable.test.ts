import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'applicant' }, isLoading: false, isAuthenticated: true, setUser: vi.fn(), logout: vi.fn() }),
}));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue(vi.fn());
const mockSetHandler = vi.fn();

vi.mock('@/services/cable', () => ({
  cableService: {
    connect: (...args: unknown[]) => mockConnect(...args),
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
    subscribe: (...args: unknown[]) => mockSubscribe(...args),
    setStateChangeHandler: (...args: unknown[]) => mockSetHandler(...args),
  },
}));

import { useCable, useChannel } from './useCable';

describe('useCable', () => {
  beforeEach(() => vi.clearAllMocks());

  it('connects on mount', () => {
    renderHook(() => useCable());
    expect(mockConnect).toHaveBeenCalled();
    expect(mockSetHandler).toHaveBeenCalled();
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useCable());
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('subscribe calls cableService.subscribe', () => {
    const { result } = renderHook(() => useCable());
    const handler = vi.fn();
    result.current.subscribe('Ch', { id: 1 }, handler);
    expect(mockSubscribe).toHaveBeenCalledWith('Ch', { id: 1 }, handler);
  });
});

describe('useChannel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('subscribes to channel on mount', () => {
    const handler = vi.fn();
    renderHook(() => useChannel('AppChannel', { id: 5 }, handler));
    expect(mockSubscribe).toHaveBeenCalledWith('AppChannel', { id: 5 }, handler);
  });

  it('unsubscribes on unmount', () => {
    const unsub = vi.fn();
    mockSubscribe.mockReturnValueOnce(unsub);
    const handler = vi.fn();
    const { unmount } = renderHook(() => useChannel('Ch', {}, handler));
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
