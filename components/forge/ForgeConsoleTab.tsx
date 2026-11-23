'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BotData, LogEntry } from '@/lib/types';
import { api } from '@/lib/api';
import { realtime } from '@/lib/socket';
import { useToast } from '@/components/ui/Toast';

interface ForgeConsoleTabProps {
  bot: BotData;
}

export function ForgeConsoleTab({ bot }: ForgeConsoleTabProps) {
  const toast = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    api.getBotLogs(bot.id, 100).then((entries) => {
      if (isMounted) setLogs(entries);
    }).catch(() => {});

    const unsubLog = realtime.on<LogEntry>('new_log', (log) => {
      if (isMounted && log.botId === bot.id) {
        setLogs((prev) => [...prev.slice(-200), log]);
      }
    });

    return () => {
      isMounted = false;
      unsubLog();
    };
  }, [bot.id]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleClear = () => {
    setLogs([]);
    toast.info('Console cleared');
  };

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.time}] [${l.type}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Logs copied to clipboard');
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isSending) return;

    const cmd = commandInput.trim();
    setCommandInput('');
    setIsSending(true);

    try {
      if (bot.status === 'online') {
        await api.sendBotStdin(bot.id, cmd);
      } else {
        await api.executeBotCommand(bot.id, cmd);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Command failed';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const ramUsedMB = bot.ramUsageMB || 95.96;
  const ramLimitMB = bot.ramLimitMB || 1515;

  return (
    <div className="space-y-4">
      {/* Output Terminal Card */}
      <div className="forge-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2027]">
          <span className="text-sm font-bold text-white tracking-tight">Output</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="forge-btn-dark text-xs py-1 px-3"
            >
              Clear
            </button>
            <button
              onClick={handleCopy}
              className="forge-btn-dark text-xs py-1 px-3"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Live Terminal Content */}
        <div className="rounded-lg bg-[#0A0B0E] border border-[#1A1C22] p-4 font-mono text-xs h-[420px] overflow-y-auto space-y-1.5 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-500">[CONSOLE] Live standard output and error stream ready...</div>
          ) : (
            logs.map((l, i) => {
              const isError = l.type === 'ERROR' || l.message.includes('ERROR');
              const isDeploy = l.message.startsWith('[DEPLOY]');
              const isBot = l.message.startsWith('[BOT]');
              const isMember = l.message.includes('LEAVE') || l.message.includes('MEMBER');

              return (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  {isDeploy ? (
                    <span className="text-[#FACC15] shrink-0 font-bold">[DEPLOY]</span>
                  ) : isError ? (
                    <span className="text-rose-400 shrink-0 font-bold">[ERROR]</span>
                  ) : isMember ? (
                    <span className="text-rose-400 shrink-0 font-bold">[MEMBER LEAVE]</span>
                  ) : isBot ? (
                    <span className="text-emerald-400 shrink-0 font-bold">[BOT]</span>
                  ) : (
                    <span className="text-emerald-400 shrink-0 font-bold">[{l.type}]</span>
                  )}
                  <span className="text-slate-300 break-all">{l.message.replace(/^\[.*?\]\s*/, '')}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Prompt */}
        <form onSubmit={handleSendCommand}>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a command..."
            className="w-full bg-[#0A0B0E] text-white placeholder-slate-500 px-3.5 py-2.5 text-xs font-mono rounded-lg border border-[#1A1C22] focus:outline-none focus:border-[#FACC15] transition-colors"
          />
        </form>
      </div>

      {/* 3 Sparkline Metrics at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Sparkline */}
        <div className="forge-card p-4 space-y-2">
          <span className="text-xs text-slate-400">CPU usage</span>
          <div className="text-lg font-bold font-mono text-white">
            {bot.status === 'online' ? `${bot.cpuUsage || '0.47'}%` : '0.00%'} <span className="text-slate-500 text-sm font-normal">/ 150%</span>
          </div>
          {/* Yellow SVG Sparkline Wave */}
          <div className="pt-2 h-12 w-full">
            <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
              <path
                d="M0,35 Q30,30 60,33 T120,25 T160,20 T200,32"
                fill="none"
                stroke="#FACC15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Memory Sparkline */}
        <div className="forge-card p-4 space-y-2">
          <span className="text-xs text-slate-400">Memory usage</span>
          <div className="text-lg font-bold font-mono text-white">
            {bot.status === 'online' ? `${ramUsedMB.toFixed(2)} MiB` : '0 MiB'} <span className="text-slate-500 text-sm font-normal">/ {(ramLimitMB / 1024).toFixed(2)} GiB</span>
          </div>
          <div className="pt-2 h-12 w-full">
            <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
              <path
                d="M0,28 Q40,29 80,28 T140,29 T200,28"
                fill="none"
                stroke="#FACC15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Network Sparkline */}
        <div className="forge-card p-4 space-y-2">
          <span className="text-xs text-slate-400">Network in / out</span>
          <div className="text-lg font-bold font-mono text-white">
            1.04 GiB <span className="text-slate-500 text-sm font-normal">/ 183.5 MiB</span>
          </div>
          <div className="pt-2 h-12 w-full">
            <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
              <path
                d="M0,32 Q50,34 90,28 T130,12 T170,26 T200,29"
                fill="none"
                stroke="#FACC15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
