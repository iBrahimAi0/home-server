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
    const panel = terminalEndRef.current?.parentElement;
    if (panel) panel.scrollTop = panel.scrollHeight;
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


  return (
    <div className="space-y-4">
      {/* Output Terminal Card */}
      <div className="forge-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line">
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
        <div className="rounded-lg bg-canvas border border-line p-4 font-mono text-xs h-[420px] overflow-y-auto space-y-1.5 select-text">
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
                    <span className="text-gold shrink-0 font-bold">[DEPLOY]</span>
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
            className="w-full bg-canvas text-white placeholder-slate-500 px-3.5 py-2.5 text-xs font-mono rounded-lg border border-line focus:outline-none focus:border-gold transition-colors"
          />
        </form>
      </div>

      <div className="forge-card p-4 flex gap-5 text-sm"><span>CPU {bot.cpuUsage}%</span><span>Memory {bot.ramUsageMB} MiB</span></div>
    </div>
  );
}
