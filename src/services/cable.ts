// autoloan-nextjs-metafullstack/src/services/cable.ts

type MessageHandler = (data: Record<string, unknown>) => void;
type ConnectionState = 'disconnected' | 'connecting' | 'connected';

interface Subscription {
  channel: string;
  params: Record<string, unknown>;
  handler: MessageHandler;
}

const API_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/cable';

class CableService {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private onStateChange?: (state: ConnectionState) => void;

  connect(token?: string) {
    if (this.state === 'connecting' || this.state === 'connected') return;
    this.state = 'connecting';
    this.onStateChange?.(this.state);

    const url = token ? `${API_WS_URL}?token=${token}` : API_WS_URL;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.handleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.state = 'connected';
      this.reconnectAttempts = 0;
      this.onStateChange?.(this.state);
      this.subscriptions.forEach((sub) => this.sendSubscribe(sub));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ping' || msg.type === 'welcome' || msg.type === 'confirm_subscription') return;
        if (msg.identifier && msg.message) {
          const id = typeof msg.identifier === 'string' ? msg.identifier : JSON.stringify(msg.identifier);
          const sub = this.subscriptions.get(id);
          if (sub) sub.handler(msg.message);
        }
      } catch { /* ignore parse errors */ }
    };

    this.ws.onclose = () => {
      this.state = 'disconnected';
      this.onStateChange?.(this.state);
      this.handleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.subscriptions.clear();
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.state = 'disconnected';
    this.onStateChange?.(this.state);
  }

  subscribe(channel: string, params: Record<string, unknown>, handler: MessageHandler): () => void {
    const identifier = JSON.stringify({ channel, ...params });
    const sub: Subscription = { channel, params, handler };
    this.subscriptions.set(identifier, sub);
    if (this.state === 'connected') this.sendSubscribe(sub);
    return () => {
      this.subscriptions.delete(identifier);
      this.sendUnsubscribe(identifier);
    };
  }

  setStateChangeHandler(handler: (state: ConnectionState) => void) {
    this.onStateChange = handler;
  }

  getState(): ConnectionState { return this.state; }

  private sendSubscribe(sub: Subscription) {
    const identifier = JSON.stringify({ channel: sub.channel, ...sub.params });
    this.send({ command: 'subscribe', identifier });
  }

  private sendUnsubscribe(identifier: string) {
    this.send({ command: 'unsubscribe', identifier });
  }

  private send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.state = 'disconnected';
      this.connect();
    }, delay);
  }
}

export const cableService = new CableService();
export type { ConnectionState, MessageHandler };
