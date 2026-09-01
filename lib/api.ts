import { BotData, LogEntry, SystemStatus, ApiResponse } from './types';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json().catch(() => {
    throw new Error(`Invalid response from backend server (HTTP ${res.status})`);
  });

  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }

  return (json.data !== undefined ? json.data : (json as unknown as T));
}

/**
 * Centralized API Service communicating directly with Express Backend (:3001)
 */
export const api = {
  /**
   * Fetches overall system status and hardware telemetry from Express backend
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const url = `${getApiBaseUrl()}/api/status`;
    const res = await fetch(url, { cache: 'no-store' });
    return handleResponse<SystemStatus>(res);
  },

  /**
   * Fetches all Discord bots and their real runtime states from Express backend
   */
  async getBots(): Promise<BotData[]> {
    try {
      const url = `${getApiBaseUrl()}/api/bots`;
      const res = await fetch(url, { cache: 'no-store' });
      return await handleResponse<BotData[]>(res);
    } catch {
      return [];
    }
  },

  /**
   * Fetches detailed information for a single bot from Express backend
   */
  async getBot(id: string): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: 'no-store' });
    return handleResponse<BotData>(res);
  },

  /**
   * Starts a Discord bot process via Express BotManager
   */
  async startBot(id: string): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/start`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ success: boolean; message: string; data?: BotData }>(res);
  },

  /**
   * Stops a running Discord bot process via Express BotManager
   */
  async stopBot(id: string): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/stop`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ success: boolean; message: string; data?: BotData }>(res);
  },

  /**
   * Restarts a Discord bot process via Express BotManager
   */
  async restartBot(id: string): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/restart`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ success: boolean; message: string; data?: BotData }>(res);
  },

  /**
   * Fetches real in-memory stdout/stderr logs from Express BotManager
   */
  async getBotLogs(id: string, limit = 300): Promise<LogEntry[]> {
    try {
      const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/logs?limit=${limit}`;
      const res = await fetch(url, { cache: 'no-store' });
      return await handleResponse<LogEntry[]>(res);
    } catch {
      return [];
    }
  },
};
