<<<<<<< HEAD
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
  GitBranch,
  Trash2,
  UploadCloud,
  Key,
} from "lucide-react";
import { BotData } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { BotControls } from "./BotControls";
import { DeleteBotConfirmModal } from "./bots/DeleteBotConfirmModal";
import { UploadProjectModal } from "./bots/UploadProjectModal";
import { useToast } from "@/components/ui/Toast";
=======
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Cpu, HardDrive, Clock, ExternalLink, Terminal, AlertTriangle, Hash, FileCode2, GitBranch, Trash2 } from 'lucide-react';
import { BotData } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { BotControls } from './BotControls';
import { DeleteBotConfirmModal } from './bots/DeleteBotConfirmModal';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

interface BotCardProps {
  bot: BotData;
  onRefresh?: () => void;
}

function formatUptime(seconds: number): string {
<<<<<<< HEAD
  if (!seconds || seconds <= 0) return "0s";
=======
  if (!seconds || seconds <= 0) return '0s';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
  return parts.slice(0, 2).join(" ");
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  const toast = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUploadProjectOpen, setIsUploadProjectOpen] = useState(false);
=======
  return parts.slice(0, 2).join(' ');
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

  return (
    <div
      id={`bot-card-${bot.id}`}
<<<<<<< HEAD
      className="group relative flex flex-col justify-between rounded-xl bg-[#121722] border border-[#1E273A] p-4.5 transition-all duration-200 hover:border-indigo-500/30 hover:bg-[#141A28] shadow-md hover:shadow-xl"
=======
      className="group relative flex flex-col justify-between rounded-lg bg-[#121722] border border-[#1E273A] p-4.5 transition-all duration-150 hover:border-[#2E3B54] hover:bg-[#151C2A]"
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
<<<<<<< HEAD
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#182133] border border-[#232E44] text-indigo-400 group-hover:scale-105 transition-transform shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/bots/${bot.id}`}
                  className="font-bold text-white hover:text-indigo-400 transition-colors text-sm flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{bot.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" />
                </Link>
              </div>
              <p
                className="text-[11px] text-slate-400 truncate mt-0.5 font-mono"
                title={bot.path}
              >
=======
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#182133] border border-[#232E44] text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/bots/${bot.id}`}
                  className="font-bold text-white hover:text-indigo-400 transition-colors text-sm flex items-center gap-1.5"
                >
                  {bot.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                {bot.path}
              </p>
            </div>
          </div>

          <StatusBadge status={bot.status} size="sm" />
        </div>

        {/* Crash alert banner */}
<<<<<<< HEAD
        {bot.status === "crashed" && bot.lastCrashReason && (
          <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/25 p-2.5 flex items-start gap-2 text-xs text-rose-300 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="overflow-hidden">
              <span className="font-bold text-rose-200">Crash Alert: </span>
              <span className="text-[11px] break-all">
                {bot.lastCrashReason}
              </span>
              {bot.restartCount > 0 && (
                <div className="mt-1 text-[10px] text-rose-400">
=======
        {bot.status === 'crashed' && bot.lastCrashReason && (
          <div className="mt-3 rounded-md bg-rose-500/10 border border-rose-500/20 p-2.5 flex items-start gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="overflow-hidden">
              <span className="font-semibold text-rose-200">Crash Alert: </span>
              <span className="font-mono text-[11px] break-all">{bot.lastCrashReason}</span>
              {bot.restartCount > 0 && (
                <div className="mt-1 text-[10px] text-rose-400 font-mono">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                  Restarts triggered: {bot.restartCount}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time telemetry metrics grid */}
<<<<<<< HEAD
        <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-lg bg-[#0C1018] border border-[#1A2232] p-2.5">
          {/* CPU */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono">
=======
        <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-md bg-[#0C1018] border border-[#1A2232] p-2.5">
          {/* CPU */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>CPU</span>
            </div>
            <span className="mt-0.5 text-xs font-semibold font-mono text-white">
<<<<<<< HEAD
              {bot.status === "online" ? `${bot.cpuUsage}%` : "—"}
=======
              {bot.status === 'online' ? `${bot.cpuUsage}%` : '—'}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            </span>
          </div>

          {/* RAM */}
          <div className="flex flex-col">
<<<<<<< HEAD
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono">
=======
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <HardDrive className="w-3 h-3 text-sky-400" />
              <span>RAM</span>
            </div>
            <span className="mt-0.5 text-xs font-semibold font-mono text-white">
<<<<<<< HEAD
              {bot.status === "online" ? `${bot.ramUsageMB}MB` : "—"}
=======
              {bot.status === 'online' ? `${bot.ramUsageMB}MB` : '—'}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            </span>
          </div>

          {/* Uptime */}
          <div className="flex flex-col">
<<<<<<< HEAD
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono">
=======
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Uptime</span>
            </div>
            <span className="mt-0.5 text-xs font-semibold font-mono text-white">
<<<<<<< HEAD
              {bot.status === "online" ? formatUptime(bot.uptime) : "—"}
=======
              {bot.status === 'online' ? formatUptime(bot.uptime) : '—'}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            </span>
          </div>

          {/* PID */}
          <div className="flex flex-col">
<<<<<<< HEAD
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono">
=======
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <Hash className="w-3 h-3 text-amber-400" />
              <span>PID</span>
            </div>
            <span className="mt-0.5 text-xs font-semibold font-mono text-white">
<<<<<<< HEAD
              {bot.status === "online" && bot.pid ? bot.pid : "—"}
=======
              {bot.status === 'online' && bot.pid ? bot.pid : '—'}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Lifecycle Controls & Action Tabs Links */}
      <div className="mt-3.5 pt-3 border-t border-[#1B2332] flex items-center justify-between gap-2 flex-wrap">
        <BotControls
          botId={bot.id}
          botName={bot.name}
          status={bot.status}
          compact={true}
<<<<<<< HEAD
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload</span>
          </button>

          <Link
            id={`link-env-${bot.id}`}
            href={`/bots/${bot.id}?tab=env`}
            title="Manage .env secrets"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-[#182030] hover:bg-[#202B40] border border-[#232E44] transition-colors"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>.env</span>
          </Link>

=======
          onActionSuccess={() => onRefresh && onRefresh()}
        />

        <div className="flex items-center gap-1.5">
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          <Link
            id={`link-files-${bot.id}`}
            href={`/bots/${bot.id}?tab=files`}
            title="Manage bot files"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-[#182030] hover:bg-[#202B40] border border-[#232E44] transition-colors"
          >
            <FileCode2 className="w-3 h-3 text-indigo-400" />
            <span>Files</span>
          </Link>

          <Link
<<<<<<< HEAD
=======
            id={`link-github-${bot.id}`}
            href={`/bots/${bot.id}?tab=github`}
            title="GitHub sync"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-[#182030] hover:bg-[#202B40] border border-[#232E44] transition-colors"
          >
            <GitBranch className="w-3 h-3 text-purple-400" />
            <span>Sync</span>
          </Link>

          <Link
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
            id={`link-logs-${bot.id}`}
            href={`/bots/${bot.id}?tab=logs`}
            title="Live console stream"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-[#182030] hover:bg-[#202B40] border border-[#232E44] transition-colors"
          >
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Logs</span>
          </Link>

          <button
            id={`btn-delete-bot-${bot.id}`}
            onClick={() => setIsDeleteOpen(true)}
            title="Remove bot from dashboard"
<<<<<<< HEAD
            className="inline-flex items-center gap-1 p-1 rounded-md text-slate-400 hover:text-rose-400 bg-[#182030] hover:bg-rose-500/10 border border-[#232E44] hover:border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
=======
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-rose-400 bg-[#182030] hover:bg-rose-500/10 border border-[#232E44] hover:border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          </button>
        </div>
      </div>

      {/* Delete Bot Confirmation Modal */}
      <DeleteBotConfirmModal
        botId={bot.id}
        botName={bot.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
<<<<<<< HEAD
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
=======
        onDeleted={() => onRefresh && onRefresh()}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      />
    </div>
  );
}
