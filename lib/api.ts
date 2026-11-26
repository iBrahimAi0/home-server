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
  GitPullResult,
  BotDatabaseInfo,
  BotDatabaseFile,
  TableInfo,
  TableDataResult,
  QueryResult,
} from "./types";

function getApiBaseUrl(): string {
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    process.env.NEXT_PUBLIC_API_URL.trim() !== ""
  ) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  return "";
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token =
    (typeof window !== "undefined"
      ? localStorage.getItem("nexus_api_key")
      : null);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-api-key"] = token;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json().catch(() => {
    throw new Error(
      `Invalid response from backend server (HTTP ${res.status})`,
    );
  });

  if (!res.ok || json.success === false) {
    throw new Error(
      json.error || json.message || `Request failed with status ${res.status}`,
    );
  }

  return json.data !== undefined ? json.data : (json as unknown as T);
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
      cache: "no-store",
    });
    return handleResponse<SystemStatus>(res);
  },

  /**
   * Fetches all Discord bots and their runtime states from Express backend
   */
  async getBots(): Promise<BotData[]> {
    const res = await fetch(`${getApiBaseUrl()}/api/bots`, { headers: getAuthHeaders(), cache: "no-store" });
    return handleResponse<BotData[]>(res);
  },

  /**
   * Fetches detailed information for a single bot from Express backend
   */
  async getBot(id: string): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Starts a Discord bot process via Express BotManager
   */
  async startBot(
    id: string,
  ): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/start`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse<{
      success: boolean;
      message: string;
      data?: BotData;
    }>(res);
  },

  /**
   * Stops a running Discord bot process via Express BotManager
   */
  async stopBot(
    id: string,
  ): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/stop`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse<{
      success: boolean;
      message: string;
      data?: BotData;
    }>(res);
  },

  /**
   * Restarts a Discord bot process via Express BotManager
   */
  async restartBot(
    id: string,
  ): Promise<{ success: boolean; message: string; data?: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}/restart`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse<{
      success: boolean;
      message: string;
      data?: BotData;
    }>(res);
  },

  /**
   * Creates a brand new bot directly from the web dashboard.
   * Supports starter templates and optional direct .zip project upload.
   */
  async createBot(payload: BotCreatePayload): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots`;

    if (payload.projectArchive) {
      // Send as multipart form data
      const formData = new FormData();
      formData.append("id", payload.id);
      formData.append("name", payload.name);
      if (payload.description)
        formData.append("description", payload.description);
      if (payload.path) formData.append("path", payload.path);
      if (payload.command) formData.append("command", payload.command);
      if (payload.args) formData.append("args", JSON.stringify(payload.args));
      formData.append("autoStart", String(!!payload.autoStart));
      if (payload.ramLimitMB !== undefined)
        formData.append("ramLimitMB", String(payload.ramLimitMB));
      if (payload.storageLimitMB !== undefined)
        formData.append("storageLimitMB", String(payload.storageLimitMB));
      formData.append(
        "installDependencies",
        String(!!payload.installDependencies),
      );
      if (payload.env) formData.append("env", JSON.stringify(payload.env));
      if (payload.template) formData.append("template", payload.template);
      if (payload.envText) formData.append("envText", payload.envText);
      formData.append("projectArchive", payload.projectArchive);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });
      return handleResponse<BotData>(res);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Uploads and unpacks a .zip project archive directly into an existing bot's directory
   */
  async uploadBotProject(
    botId: string,
    archive: File,
    runInstall = false,
    restart = false,
  ): Promise<{ extractedCount: number; bot: BotData }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/upload-project`;
    const formData = new FormData();
    formData.append("archive", archive);
    formData.append("runInstall", String(runInstall));
    formData.append("restart", String(restart));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    return handleResponse<{ extractedCount: number; bot: BotData }>(res);
  },

  /**
   * Installs dependencies (runs npm install or pip install) for a bot
   */
  async installBotDependencies(
    botId: string,
  ): Promise<{ success: boolean; message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/install`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  /**
   * Alias for installBotDependencies
   */
  async installDependencies(
    botId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.installBotDependencies(botId);
  },

  /**
   * Sends text input directly to a running bot process's stdin.
   */
  async sendBotStdin(
    botId: string,
    input: string,
  ): Promise<{ success: boolean; message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/stdin`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ input }),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  /**
   * Executes a shell command inside the bot's working directory.
   */
  async execBotCommand(
    botId: string,
    command: string,
  ): Promise<{
    success: boolean;
    data: { success: boolean; exitCode: number | null; message: string };
  }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/exec`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ command }),
    });
    return handleResponse<{
      success: boolean;
      data: { success: boolean; exitCode: number | null; message: string };
    }>(res);
  },

  /**
   * Alias for execBotCommand
   */
  async executeBotCommand(
    botId: string,
    command: string,
  ): Promise<{
    success: boolean;
    data: { success: boolean; exitCode: number | null; message: string };
  }> {
    return this.execBotCommand(botId, command);
  },

  /**
   * Returns download URL for bot project .zip export
   */
  getBotProjectExportUrl(botId: string): string {
    return `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/export`;
  },

  /**
   * Retrieves environment variables and secrets for a bot
   */
  async getBotEnv(botId: string): Promise<Record<string, string>> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/env`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<Record<string, string>>(res);
  },

  /**
   * Updates environment variables and secrets for a bot
   */
  async updateBotEnvText(botId: string, envText: string) {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/env`;
    const res = await fetch(url, { method: "PUT", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ envText }) });
    return handleResponse<Record<string, string>>(res);
  },

  async updateBotEnv(
    botId: string,
    env: Record<string, string>,
    restart = false,
  ): Promise<Record<string, string>> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/env`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ env, restart }),
    });
    return handleResponse<Record<string, string>>(res);
  },

  /**
   * Updates an existing bot's configuration
   */
  async updateBot(id: string, payload: BotUpdatePayload): Promise<BotData> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<BotData>(res);
  },

  /**
   * Permanently removes a bot from configuration
   */
  async deleteBot(id: string): Promise<{ message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
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
        cache: "no-store",
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
  async listFiles(botId: string, relativePath = ""): Promise<FileListResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<FileListResult>(res);
  },

  /**
   * Alias for listFiles
   */
  async getFiles(botId: string, relativePath = ""): Promise<FileListResult> {
    return this.listFiles(botId, relativePath);
  },

  /**
   * Reads raw file text content
   */
  async readFileContent(
    botId: string,
    relativePath: string,
  ): Promise<BotFileContent> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/content?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<BotFileContent>(res);
  },

  /**
   * Saves text content to a file
   */
  async saveFileContent(
    botId: string,
    relativePath: string,
    content: string,
  ): Promise<{ path: string; size: number }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/content`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ path: relativePath, content }),
    });
    return handleResponse<{ path: string; size: number }>(res);
  },

  /**
   * Creates a new file
   */
  async createFile(
    botId: string,
    parentPath: string,
    name: string,
    initialContent = "",
  ): Promise<BotFileItem> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/file`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ path: parentPath, name, initialContent }),
    });
    return handleResponse<BotFileItem>(res);
  },

  /**
   * Creates a new folder
   */
  async createFolder(
    botId: string,
    parentPath: string,
    name: string,
  ): Promise<BotFileItem> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/folder`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ path: parentPath, name }),
    });
    return handleResponse<BotFileItem>(res);
  },

  /**
   * Renames a file or folder
   */
  async renameEntity(
    botId: string,
    oldPath: string,
    newName: string,
  ): Promise<{ oldPath: string; newPath: string; newName: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/rename`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ path: oldPath, newName }),
    });
    return handleResponse<{
      oldPath: string;
      newPath: string;
      newName: string;
    }>(res);
  },

  /**
   * Deletes a file or directory
   */
  async deleteEntity(
    botId: string,
    relativePath: string,
  ): Promise<{ message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<{ message: string }>(res);
  },

  /**
   * Deletes multiple files and/or directories in a single request
   */
  async deleteEntities(
    botId: string,
    relativePaths: string[],
  ): Promise<{
    results: { path: string; success: boolean; error?: string }[];
  }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/batch-delete`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ paths: relativePaths }),
    });
    return handleResponse<{
      results: { path: string; success: boolean; error?: string }[];
    }>(res);
  },

  /**
   * Uploads files directly into the bot directory
   */
  async uploadFiles(
    botId: string,
    destinationPath: string,
    files: File[],
    overwrite = false,
  ): Promise<any> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/upload`;
    const formData = new FormData();
    formData.append("destinationPath", destinationPath);
    formData.append("overwrite", String(overwrite));
    for (const file of files) {
      formData.append("files", file);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });
    return handleResponse<any>(res);
  },

  /**
   * Inspects a ZIP archive and returns entry preview without extracting
   */
  async inspectArchive(
    botId: string,
    archiveFile?: File,
    existingArchivePath?: string,
  ): Promise<ZipArchiveInspection> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/inspect-archive`;
    const formData = new FormData();
    if (archiveFile) {
      formData.append("archive", archiveFile);
    }
    if (existingArchivePath) {
      formData.append("archivePath", existingArchivePath);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
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
    existingArchivePath?: string,
  ): Promise<{ extractedCount: number; totalBytes?: number }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/files/extract`;
    const formData = new FormData();
    formData.append("destinationPath", destinationPath);
    if (archiveFile) {
      formData.append("archive", archiveFile);
    }
    if (existingArchivePath) {
      formData.append("archivePath", existingArchivePath);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
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
      cache: "no-store",
    });
    return handleResponse<GitStatus>(res);
  },

  /**
   * Checks for remote Git updates
   */
  async checkGitUpdates(
    botId: string,
    branch = "main",
  ): Promise<GitUpdateCheckResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/check`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ branch }),
    });
    return handleResponse<GitUpdateCheckResult>(res);
  },

  /**
   * Pulls latest Git updates safely
   */
  async pullGitUpdates(botId: string, branch = "main"): Promise<GitPullResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/pull`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ branch }),
    });
    return handleResponse<GitPullResult>(res);
  },

  /**
   * Alias for pullGitUpdates
   */
  async pullGit(botId: string, branch = "main"): Promise<GitPullResult> {
    return this.pullGitUpdates(botId, branch);
  },

  /**
   * Configures repository URL and branch for a bot
   */
  async configureGitRepo(
    botId: string,
    repoUrl: string,
    branch = "main",
  ): Promise<{ repoUrl: string; branch: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/git/config`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ repoUrl, branch }),
    });
    return handleResponse<{ repoUrl: string; branch: string }>(res);
  },

  /**
   * Database Management: Lists all detected SQLite database files for a bot
   */
  async getBotDatabases(botId: string): Promise<BotDatabaseInfo> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<BotDatabaseInfo>(res);
  },

  /**
   * Creates a new SQLite database file for a bot
   */
  async createBotDatabase(
    botId: string,
    name = "database.sqlite",
    updateEnv = true,
  ): Promise<BotDatabaseFile> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/create`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name, updateEnv }),
    });
    return handleResponse<BotDatabaseFile>(res);
  },

  /**
   * Retrieves tables and column schemas for a bot's SQLite database
   */
  async getBotTables(
    botId: string,
    db = "database.sqlite",
  ): Promise<{ database: string; tables: TableInfo[] }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/tables?db=${encodeURIComponent(db)}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<{ database: string; tables: TableInfo[] }>(res);
  },

  /**
   * Retrieves paginated row data for a table in the bot's database
   */
  async getBotTableData(
    botId: string,
    table: string,
    db = "database.sqlite",
    limit = 50,
    offset = 0,
  ): Promise<TableDataResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/table-data?table=${encodeURIComponent(table)}&db=${encodeURIComponent(db)}&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });
    return handleResponse<TableDataResult>(res);
  },

  /**
   * Executes arbitrary SQL query against the bot's database
   */
  async executeBotQuery(
    botId: string,
    query: string,
    db = "database.sqlite",
  ): Promise<QueryResult> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ query, db }),
    });
    return handleResponse<QueryResult>(res);
  },

  /**
   * Seeds starter schema template into the bot's database
   */
  async seedBotDatabase(
    botId: string,
    template = "general",
    db = "database.sqlite",
  ): Promise<{ success: boolean; message: string }> {
    const url = `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/seed`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ template, db }),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  /**
   * Returns download URL for direct database file export
   */
  getBotDatabaseDownloadUrl(botId: string, db = "database.sqlite"): string {
    return `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/db/download?db=${encodeURIComponent(db)}`;
  },

  /**
   * Returns download URL for full bot project ZIP backup/export
   */
  getBotExportDownloadUrl(botId: string): string {
    return `${getApiBaseUrl()}/api/bots/${encodeURIComponent(botId)}/export`;
  },
};
