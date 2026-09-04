import {
  BotData,
  BotCreatePayload,
  BotUpdatePayload,
  LogEntry,
  SystemStatus,
  ApiResponse,
  FileListResult,
  BotFileContent,
  BotFileItem,
  ZipArchiveInspection,
  GitStatus,
  GitUpdateCheckResult,
  GitPullResult
} from './types';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token = process.env.NEXT_PUBLIC_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('nexus_api_key') : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-api-key'] = token;
  }
  return headers;
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
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    return handleResponse<SystemStatus>(res);
  },

  /**
   * Fetches all Discord bots and their runtime states from Express backend
   */
  async getBots(): Promise<BotData[]> {
    try {
      const url = `${getApiBaseUrl()}/api/bots`;
      const res = await fetch(url, {
        headers: { ...getAuthHeaders() },
        cache: 'no-store'
      });
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
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Starts a Discord bot process via Express BotManager
   */
  async startBot(id: string): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/start`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
    });
    return handleResponse<{ success: boolean; message: string; data?: BotData }>(res);
  },

  /**
   * Creates a brand new bot directly from the web dashboard (no manual JSON editing required)
   */
  async createBot(payload: BotCreatePayload): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Updates an existing bot's configuration
   */
  async updateBot(id: string, payload: BotUpdatePayload): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Permanently removes a bot from configuration
   */
  async deleteBot(id: string): Promise<{ message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<{ message: string }>(res);
  },

  /**
   * Fetches in-memory stdout/stderr logs from Express BotManager
   */
  async getBotLogs(id: string, limit = 300): Promise<LogEntry[]> {
    try {
      const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/logs?limit=${limit}`;
      const res = await fetch(url, {
        headers: { ...getAuthHeaders() },
        cache: 'no-store'
      });
      return await handleResponse<LogEntry[]>(res);
    } catch {
      return [];
    }
  },

  /**
   * FILE MANAGEMENT
   */

  /**
   * Lists files and directories inside a bot root
   */
  async listFiles(botId: string, relativePath = ''): Promise<FileListResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    return handleResponse<FileListResult>(res);
  },

  /**
   * Reads raw file text content
   */
  async readFileContent(botId: string, relativePath: string): Promise<BotFileContent> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/content?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    return handleResponse<BotFileContent>(res);
  },

  /**
   * Saves text content to a file
   */
  async saveFileContent(botId: string, relativePath: string, content: string): Promise<{ path: string; size: number }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/content`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ path: relativePath, content })
    });
    return handleResponse<{ path: string; size: number }>(res);
  },

  /**
   * Creates a new file
   */
  async createFile(botId: string, parentPath: string, name: string, initialContent = ''): Promise<BotFileItem> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/file`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ path: parentPath, name, initialContent })
    });
    return handleResponse<BotFileItem>(res);
  },

  /**
   * Creates a new folder
   */
  async createFolder(botId: string, parentPath: string, name: string): Promise<BotFileItem> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/folder`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ path: parentPath, name })
    });
    return handleResponse<BotFileItem>(res);
  },

  /**
   * Renames a file or folder
   */
  async renameEntity(botId: string, oldPath: string, newName: string): Promise<{ oldPath: string; newPath: string; newName: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/rename`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ path: oldPath, newName })
    });
    return handleResponse<{ oldPath: string; newPath: string; newName: string }>(res);
  },

  /**
   * Deletes a file or directory
   */
  async deleteEntity(botId: string, relativePath: string): Promise<{ message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<{ message: string }>(res);
  },

  /**
   * Deletes multiple files and/or directories in a single request
   */
  async deleteEntities(botId: string, relativePaths: string[]): Promise<{ results: { path: string; success: boolean; error?: string }[] }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/batch-delete`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ paths: relativePaths })
    });
    return handleResponse<{ results: { path: string; success: boolean; error?: string }[] }>(res);
  },

  /**
   * Uploads files directly into the bot directory
   */
  async uploadFiles(botId: string, destinationPath: string, files: File[], overwrite = false): Promise<any> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/upload`;
    const formData = new FormData();
    formData.append('destinationPath', destinationPath);
    formData.append('overwrite', String(overwrite));
    for (const file of files) {
      formData.append('files', file);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse<any>(res);
  },

  /**
   * Inspects a ZIP archive and returns entry preview without extracting
   */
  async inspectArchive(botId: string, archiveFile?: File, existingArchivePath?: string): Promise<ZipArchiveInspection> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/inspect-archive`;
    const formData = new FormData();
    if (archiveFile) {
      formData.append('archive', archiveFile);
    }
    if (existingArchivePath) {
      formData.append('archivePath', existingArchivePath);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse<ZipArchiveInspection>(res);
  },

  /**
   * Extracts an archive (.zip / .rar) safely
   */
  async extractArchive(
    botId: string,
    destinationPath: string,
    archiveFile?: File,
    existingArchivePath?: string
  ): Promise<{ extractedCount: number; totalBytes?: number }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/extract`;
    const formData = new FormData();
    formData.append('destinationPath', destinationPath);
    if (archiveFile) {
      formData.append('archive', archiveFile);
    }
    if (existingArchivePath) {
      formData.append('archivePath', existingArchivePath);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return handleResponse<{ extractedCount: number; totalBytes?: number }>(res);
  },

  /**
   * RESTRICTED GITHUB SYNCHRONIZATION
   */

  /**
   * Retrieves Git status for a bot
   */
  async getGitStatus(botId: string): Promise<GitStatus> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/status`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: 'no-store'
    });
    return handleResponse<GitStatus>(res);
  },

  /**
   * Checks for remote Git updates
   */
  async checkGitUpdates(botId: string, branch = 'main'): Promise<GitUpdateCheckResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/check`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ branch })
    });
    return handleResponse<GitUpdateCheckResult>(res);
  },

  /**
   * Pulls latest Git updates safely
   */
  async pullGitUpdates(botId: string, branch = 'main'): Promise<GitPullResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/pull`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ branch })
    });
    return handleResponse<GitPullResult>(res);
  },

  /**
   * Configures repository URL and branch for a bot
   */
  async configureGitRepo(botId: string, repoUrl: string, branch = 'main'): Promise<{ repoUrl: string; branch: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/config`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ repoUrl, branch })
    });
    return handleResponse<{ repoUrl: string; branch: string }>(res);
  }
};
