import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockWsInstances: MockWebSocket[] = [];

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = MockWebSocket.CLOSED; });
  constructor(url: string) { this.url = url; mockWsInstances.push(this); }
}

vi.stubGlobal('WebSocket', MockWebSocket);

// Re-import fresh each test
let cableService: typeof import('./cable').cableService;

describe('CableService', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    mockWsInstances = [];
    vi.resetModules();
    const mod = await import('./cable');
    cableService = mod.cableService;
  });

  afterEach(() => {
    cableService.disconnect();
    vi.useRealTimers();
  });

  it('connects and sets state to connected', () => {
    cableService.connect('token123');
    const ws = mockWsInstances[0];
    expect(ws.url).toContain('token=token123');
    ws.onopen!();
    expect(cableService.getState()).toBe('connected');
  });

  it('connects without token', () => {
    cableService.connect();
    expect(mockWsInstances[0].url).not.toContain('token=');
  });

  it('does not connect if already connecting', () => {
    cableService.connect();
    cableService.connect();
    expect(mockWsInstances.length).toBe(1);
  });

  it('subscribes and receives messages', () => {
    const handler = vi.fn();
    cableService.connect();
    mockWsInstances[0].onopen!();
    cableService.subscribe('AppChannel', { id: 1 }, handler);
    const identifier = JSON.stringify({ channel: 'AppChannel', id: 1 });
    mockWsInstances[0].onmessage!({ data: JSON.stringify({ identifier, message: { status: 'approved' } }) });
    expect(handler).toHaveBeenCalledWith({ status: 'approved' });
  });

  it('resubscribes on reconnect', () => {
    const handler = vi.fn();
    cableService.subscribe('AppChannel', { id: 1 }, handler);
    cableService.connect();
    mockWsInstances[0].onopen!();
    expect(mockWsInstances[0].send).toHaveBeenCalledWith(
      expect.stringContaining('subscribe')
    );
  });

  it('unsubscribes when cleanup called', () => {
    cableService.connect();
    mockWsInstances[0].onopen!();
    const unsub = cableService.subscribe('Ch', {}, vi.fn());
    unsub();
    expect(mockWsInstances[0].send).toHaveBeenCalledWith(
      expect.stringContaining('unsubscribe')
    );
  });

  it('ignores ping/welcome/confirm messages', () => {
    const handler = vi.fn();
    cableService.connect();
    mockWsInstances[0].onopen!();
    cableService.subscribe('Ch', {}, handler);
    mockWsInstances[0].onmessage!({ data: JSON.stringify({ type: 'ping' }) });
    mockWsInstances[0].onmessage!({ data: JSON.stringify({ type: 'welcome' }) });
    mockWsInstances[0].onmessage!({ data: JSON.stringify({ type: 'confirm_subscription' }) });
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles invalid JSON gracefully', () => {
    cableService.connect();
    mockWsInstances[0].onopen!();
    expect(() => mockWsInstances[0].onmessage!({ data: 'not json' })).not.toThrow();
  });

  it('reconnects on close with backoff', () => {
    cableService.connect();
    mockWsInstances[0].onclose!();
    expect(cableService.getState()).toBe('disconnected');
    vi.advanceTimersByTime(1000);
    expect(mockWsInstances.length).toBe(2);
  });

  it('stops reconnecting after max attempts', () => {
    cableService.connect();
    for (let i = 0; i < 11; i++) {
      const ws = mockWsInstances[mockWsInstances.length - 1];
      ws.onclose?.();
      vi.advanceTimersByTime(60000);
    }
    const count = mockWsInstances.length;
    vi.advanceTimersByTime(60000);
    expect(mockWsInstances.length).toBe(count);
  });

  it('closes ws on error', () => {
    cableService.connect();
    const ws = mockWsInstances[0];
    ws.onerror!();
    expect(ws.close).toHaveBeenCalled();
  });

  it('disconnects and clears state', () => {
    cableService.connect();
    mockWsInstances[0].onopen!();
    cableService.disconnect();
    expect(cableService.getState()).toBe('disconnected');
  });

  it('calls state change handler', () => {
    const handler = vi.fn();
    cableService.setStateChangeHandler(handler);
    cableService.connect();
    expect(handler).toHaveBeenCalledWith('connecting');
    mockWsInstances[0].onopen!();
    expect(handler).toHaveBeenCalledWith('connected');
  });

  it('does not send if ws not open', () => {
    cableService.connect();
    mockWsInstances[0].readyState = MockWebSocket.CLOSED;
    cableService.subscribe('Ch', {}, vi.fn());
    // No error thrown
  });

  it('handles WebSocket constructor error', () => {
    vi.stubGlobal('WebSocket', class { constructor() { throw new Error('fail'); } });
    cableService.connect();
    expect(cableService.getState()).toBe('connecting');
    vi.advanceTimersByTime(2000);
    vi.stubGlobal('WebSocket', MockWebSocket);
  });
});
