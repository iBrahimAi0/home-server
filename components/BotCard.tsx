"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Cpu,
  HardDrive,
  Clock,
  ExternalLink,
  Terminal,
  AlertTriangle,
  Hash,
  FileCode2,
  Trash2,
  UploadCloud,
  Key,
  Database,
  Zap,
} from "lucide-react";
import { BotData } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { BotControls } from "./BotControls";
import { DeleteBotConfirmModal } from "./bots/DeleteBotConfirmModal";
import { UploadProjectModal } from "./bots/UploadProjectModal";
import { useToast } from "@/components/ui/Toast";

interface BotCardProps {
  bot: BotData;
  onRefresh?: () => void;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 || (days === 0 && hours === 0 && minutes < 5)) {
    parts.push(`${secs}s`);
  }
  return parts.slice(0, 2).join(" ");
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  const toast = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUploadProjectOpen, setIsUploadProjectOpen] = useState(false);

  const ramPercent =
    bot.ramLimitMB && bot.ramLimitMB > 0
      ? Math.min(100, Math.round(((bot.ramUsageMB || 0) / bot.ramLimitMB) * 100))
      : 0;

  const storagePercent =
    bot.storageLimitMB && bot.storageLimitMB > 0
      ? Math.min(100, Math.round(((bot.storageUsedMB || 0) / bot.storageLimitMB) * 100))
      : 0;

  return (
    <div
      id={`bot-card-${bot.id}`}
      className="group relative flex flex-col justify-between rounded-xl bg-panel border border-line p-5 transition-all duration-200 hover:border-gold/40 hover:bg-raised shadow-sm"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-raised border border-line text-gold group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
              {bot.status === "online" && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-line" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/bots/${bot.id}`}
                  className="font-bold text-white hover:text-gold transition-colors text-sm flex items-center gap-1.5 truncate tracking-tight"
                >
                  <span className="truncate">{bot.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" />
                </Link>
                {bot.autoStart && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-semibold">
                    <Zap className="w-2.5 h-2.5" />
                    Auto
                  </span>
                )}
              </div>
              <p
                className="text-[11px] text-slate-400 truncate mt-0.5 font-mono"
                title={bot.path}
              >
                {bot.path}
              </p>
            </div>
          </div>

          <StatusBadge status={bot.status} size="sm" />
        </div>

        {/* Crash alert banner */}
        {bot.status === "crashed" && bot.lastCrashReason && (
          <div className="mt-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 flex items-start gap-2.5 text-xs text-rose-300 font-mono shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="overflow-hidden">
              <span className="font-bold text-rose-200">Crash Alert: </span>
              <span className="text-[11px] break-all">
                {bot.lastCrashReason}
              </span>
              {bot.restartCount > 0 && (
                <div className="mt-1 text-[10px] text-rose-400">
                  Restarts triggered: {bot.restartCount}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resource Telemetry Micro-HUD */}
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-inset border border-line p-3">
          {/* CPU */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 font-mono uppercase">
              <Cpu className="w-3 h-3 text-gold" />
              <span>CPU</span>
            </div>
            <span className="mt-1 text-xs font-bold font-mono text-white">
              {bot.status === "online" ? `${bot.cpuUsage}%` : "—"}
            </span>
          </div>

          {/* RAM */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 font-mono uppercase">
              <HardDrive className="w-3 h-3 text-sky-400" />
              <span>RAM</span>
            </div>
            <span className="mt-1 text-xs font-bold font-mono text-white truncate">
              {bot.status === "online" ? `${bot.ramUsageMB}M` : "—"}
              {Boolean(bot.ramLimitMB && bot.ramLimitMB > 0) && (
                <span className="text-[10px] text-slate-400 font-normal">
                  /{bot.ramLimitMB}M
                </span>
              )}
            </span>
            {bot.status === "online" && Boolean(bot.ramLimitMB && bot.ramLimitMB > 0) && (
              <div className="mt-1 h-1 w-full bg-raised rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    ramPercent > 85 ? "bg-rose-500" : "bg-gold"
                  }`}
                  style={{ width: `${ramPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Storage / Uptime */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 font-mono uppercase">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Disk</span>
            </div>
            <span className="mt-1 text-xs font-bold font-mono text-white truncate">
              {bot.storageUsedMB !== undefined ? `${bot.storageUsedMB}M` : "—"}
              {Boolean(bot.storageLimitMB && bot.storageLimitMB > 0) && (
                <span className="text-[10px] text-slate-400 font-normal">
                  /{bot.storageLimitMB}M
                </span>
              )}
            </span>
            {Boolean(bot.storageLimitMB && bot.storageLimitMB > 0) && (
              <div className="mt-1 h-1 w-full bg-raised rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    storagePercent > 85 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* PID / Uptime */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 font-mono uppercase">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Uptime</span>
            </div>
            <span className="mt-1 text-xs font-bold font-mono text-white truncate">
              {bot.status === "online" ? formatUptime(bot.uptime) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Lifecycle Controls & Action Tabs Links */}
      <div className="mt-4 pt-3.5 border-t border-line flex items-center justify-between gap-2 flex-wrap">
        <BotControls
          botId={bot.id}
          botName={bot.name}
          status={bot.status}
          compact={true}
          onActionSuccess={(action, msg) => {
            toast.success(msg || `Bot ${action} successful`, `Bot ${action}`);
            if (onRefresh) onRefresh();
          }}
          onActionError={(action, err) => {
            toast.error(err, `${action} Failed`);
          }}
        />

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id={`btn-upload-project-${bot.id}`}
            onClick={() => setIsUploadProjectOpen(true)}
            title="Upload Project ZIP"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-gold hover:text-white bg-gold/10 hover:bg-gold/20 border border-gold/30 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload</span>
          </button>

          <Link
            id={`link-files-${bot.id}`}
            href={`/bots/${bot.id}?tab=files`}
            title="Manage bot files and code editor"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-raised hover:bg-raised border border-line transition-all"
          >
            <FileCode2 className="w-3 h-3 text-gold" />
            <span>Files</span>
          </Link>

          <Link
            id={`link-db-${bot.id}`}
            href={`/bots/${bot.id}?tab=databases`}
            title="Manage SQLite Database"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-raised hover:bg-raised border border-line transition-all"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>DB</span>
          </Link>

          <Link
            id={`link-logs-${bot.id}`}
            href={`/bots/${bot.id}?tab=console`}
            title="Live console stream"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-raised hover:bg-raised border border-line transition-all"
          >
            <Terminal className="w-3 h-3 text-sky-400" />
            <span>Console</span>
          </Link>

          <button
            id={`btn-delete-bot-${bot.id}`}
            onClick={() => setIsDeleteOpen(true)}
            title="Remove bot from dashboard"
            className="inline-flex items-center gap-1 p-1.5 rounded text-slate-400 hover:text-rose-400 bg-raised hover:bg-rose-500/10 border border-line hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Bot Confirmation Modal */}
      <DeleteBotConfirmModal
        botId={bot.id}
        botName={bot.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => {
          toast.info(`Bot "${bot.name}" removed.`);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Upload Project Archive Modal */}
      <UploadProjectModal
        botId={bot.id}
        botName={bot.name}
        isOpen={isUploadProjectOpen}
        onClose={() => setIsUploadProjectOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
