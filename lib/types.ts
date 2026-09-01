export type BotStatus = 'online' | 'offline' | 'starting' | 'stopping' | 'crashed';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';

export interface LogEntry {
  id: string;
  botId: string;
  botName: string;
  type: LogLevel;
  time: string;
  timestamp: string;
  message: string;
}

export interface BotConfig {
  id: string;
  name: string;
  description?: string;
  path: string;
  command?: string;
  args?: string[];
  autoStart?: boolean;
  env?: Record<string, string>;
}

export interface BotData {
  id: string;
  name: string;
  description: string;
  path: string;
  command: string;
  args: string[];
  autoStart: boolean;
  status: BotStatus;
  pid: number | null;
  uptime: number; // in seconds
  startedAt: string | null;
  cpuUsage: number; // percentage
  ramUsageMB: number; // MB
  restartCount: number;
  lastCrashReason: string | null;
  logsCount: number;
}

export interface SystemCpu {
  usagePercentage: number;
  cores: number;
  model: string;
  speedMHz: number;
  loadAverage: number[];
}

export interface SystemRam {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usagePercentage: number;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface SystemStorage {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPercentage: number;
  mount: string;
}

export interface SystemStatus {
  status: 'online' | 'degraded' | 'offline';
  cpu: SystemCpu;
  ram: SystemRam;
  storage: SystemStorage;
  uptime: number; // in seconds
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  type: string;
  nodeVersion: string;
  serverIp: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
