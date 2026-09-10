<<<<<<< HEAD
"use client";

import { io, Socket } from "socket.io-client";
=======
'use client';

import { io, Socket } from 'socket.io-client';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

type EventCallback<T = unknown> = (data: T) => void;

function getSocketServerUrl(): string {
<<<<<<< HEAD
  if (
    process.env.NEXT_PUBLIC_SOCKET_URL &&
    process.env.NEXT_PUBLIC_SOCKET_URL.trim() !== ""
  ) {
    return process.env.NEXT_PUBLIC_SOCKET_URL.replace(/\/+$/, "");
  }
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    process.env.NEXT_PUBLIC_API_URL.trim() !== ""
  ) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
}

class RealtimeClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();
  private isConnected = false;

  constructor() {
    // Initialized in browser runtime
  }

  public connect() {
<<<<<<< HEAD
    if (typeof window === "undefined") return;
=======
    if (typeof window === 'undefined') return;
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    if (this.socket && this.socket.connected) return;

    const socketUrl = getSocketServerUrl();

    try {
      this.socket = io(socketUrl, {
<<<<<<< HEAD
        transports: ["websocket", "polling"],
=======
        transports: ['websocket', 'polling'],
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

<<<<<<< HEAD
      this.socket.on("connect", () => {
        this.isConnected = true;
        this.emitInternal("connection_change", {
          connected: true,
          transport: "socket.io",
        });
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        this.emitInternal("connection_change", {
          connected: false,
          transport: "socket.io",
        });
      });

      this.socket.on("connect_error", () => {
        this.isConnected = false;
        this.emitInternal("connection_change", {
          connected: false,
          transport: "socket.io",
        });
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      });

      // Bridge real socket events from Express BotManager
      const events = [
<<<<<<< HEAD
        "system_status",
        "system_metrics_update",
        "bots_list",
        "bot_status_changed",
        "new_log",
        "bots_metrics_update",
=======
        'system_status',
        'system_metrics_update',
        'bots_list',
        'bot_status_changed',
        'new_log',
        'bots_metrics_update',
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      ];

      for (const evt of events) {
        this.socket.on(evt, (data) => {
          this.emitInternal(evt, data);
        });
      }
    } catch (err) {
<<<<<<< HEAD
      console.warn("[Realtime] Socket.IO initialization error:", err);
    }
  }

  public on<T = unknown>(
    event: string,
    callback: EventCallback<T>,
  ): () => void {
=======
      console.warn('[Realtime] Socket.IO initialization error:', err);
    }
  }

  public on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD

  public emit(event: string, ...args: unknown[]): boolean {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, ...args);
      return true;
    }
    return false;
  }

  public emitWithAck<T = unknown>(
    event: string,
    data: unknown,
    timeoutMs = 10000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error("Socket.IO is not currently connected"));
      }
      let answered = false;
      const timer = setTimeout(() => {
        if (!answered) {
          answered = true;
          reject(new Error(`Timeout waiting for response to ${event}`));
        }
      }, timeoutMs);

      this.socket.emit(event, data, (response: unknown) => {
        if (!answered) {
          answered = true;
          clearTimeout(timer);
          resolve(response as T);
        }
      });
    });
  }
=======
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
}

export const realtime = new RealtimeClient();
