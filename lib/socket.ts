'use client';

import { io, Socket } from 'socket.io-client';

type EventCallback<T = unknown> = (data: T) => void;

function getSocketServerUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL && process.env.NEXT_PUBLIC_SOCKET_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_SOCKET_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

class RealtimeClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();
  private isConnected = false;

  constructor() {
    // Initialized in browser runtime
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.socket && this.socket.connected) return;

    const socketUrl = getSocketServerUrl();

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.emitInternal('connection_change', { connected: true, transport: 'socket.io' });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emitInternal('connection_change', { connected: false, transport: 'socket.io' });
      });

      this.socket.on('connect_error', () => {
        this.isConnected = false;
        this.emitInternal('connection_change', { connected: false, transport: 'socket.io' });
      });

      // Bridge real socket events from Express BotManager
      const events = [
        'system_status',
        'system_metrics_update',
        'bots_list',
        'bot_status_changed',
        'new_log',
        'bots_metrics_update',
      ];

      for (const evt of events) {
        this.socket.on(evt, (data) => {
          this.emitInternal(evt, data);
        });
      }
    } catch (err) {
      console.warn('[Realtime] Socket.IO initialization error:', err);
    }
  }

  public on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<any>);

    return () => {
      this.off(event, callback);
    };
  }

  public off<T = unknown>(event: string, callback: EventCallback<T>) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<any>);
    }
  }

  private emitInternal(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[Realtime] Callback error for ${event}:`, err);
        }
      }
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const realtime = new RealtimeClient();
