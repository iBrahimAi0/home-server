'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Pause, 
  Play, 
  Search, 
  Copy, 
  Check, 
  Download, 
  Wifi, 
  WifiOff, 
  ArrowDownCircle
} from 'lucide-react';
import { LogEntry, BotData } from '@/lib/types';
import { realtime } from '@/lib/socket';
import { api } from '@/lib/api';

interface TerminalProps {
  initialBotId?: string;
  bots?: BotData[];
  heightClass?: string;
  showBotSelector?: boolean;
}

export function Terminal({
  initialBotId = 'all',
  bots = [],
  heightClass = 'h-[500px]',
  showBotSelector = true,
}: TerminalProps) {
  const [prevInitialBotId, setPrevInitialBotId] = useState(initialBotId);
  const [selectedBotId, setSelectedBotId] = useState<string>(initialBotId);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest bot list available to the log loader without making it a
  // dependency of the fetch effect below — `bots` is replaced with a new array
  // reference every ~2.5s via the `bots_metrics_update` socket event, and using
  // it as a dependency was causing the terminal to re-fetch and reset its log
  // view (losing scroll position and any just-arrived live entries) every tick.
  const botsRef = useRef(bots);
  useEffect(() => {
    botsRef.current = bots;
  }, [bots]);

  if (initialBotId !== prevInitialBotId) {
    setPrevInitialBotId(initialBotId);
    setSelectedBotId(initialBotId);
  }

  // Load logs on mount / selection change only (NOT on every bots metrics tick)
  useEffect(() => {
    let isMounted = true;

    async function loadLogs() {
      try {
        if (selectedBotId === 'all') {
          let botList = botsRef.current;
          if (!botList || botList.length === 0) {
            botList = await api.getBots().catch(() => []);
          }
          if (botList.length === 0) {
            if (isMounted) setLogs([]);
            return;
          }
          const allPromises = botList.map(b => api.getBotLogs(b.id, 100).catch(() => []));
          const allResults = await Promise.all(allPromises);
          const merged = allResults.flat().sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          if (isMounted) {
            setLogs(merged);
          }
        } else {
          const fetchedLogs = await api.getBotLogs(selectedBotId, 300).catch(() => []);
          if (isMounted) {
            setLogs(fetchedLogs || []);
          }
        }
      } catch {
        if (isMounted) {
          setLogs((prev) => prev);
        }
      }
    }

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, [selectedBotId]);

  // Subscribe to live log events via Socket.IO
  useEffect(() => {
    realtime.connect();

    const unsubLog = realtime.on<LogEntry>('new_log', (newLog) => {
      setLogs((prev) => {
        if (prev.some(l => l.id === newLog.id)) return prev;
        const updated = [...prev, newLog];
        return updated.length > 1000 ? updated.slice(-1000) : updated;
      });
    });

    const unsubConn = realtime.on<{ connected: boolean }>('connection_change', ({ connected }) => {
      setIsConnected(connected);
    });

    return () => {
      unsubLog();
      unsubConn();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleCopy = () => {
    const formatted = filteredLogs.map(l => `[${l.time}] ${l.type.padEnd(6, ' ')} [${l.botName}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const formatted = filteredLogs.map(l => `[${l.timestamp}] [${l.type}] [${l.botName}] ${l.message}`).join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexuspanel-logs-${selectedBotId}-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedBotId !== 'all' && log.botId !== selectedBotId) return false;
    if (filterLevel !== 'ALL' && log.type !== filterLevel) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.botName.toLowerCase().includes(q) ||
        log.time.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLogTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'ERROR':
        return 'text-rose-400 font-bold bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20';
      case 'WARN':
        return 'text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20';
      case 'SYSTEM':
        return 'text-indigo-400 font-semibold bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20';
      case 'INFO':
      default:
        return 'text-sky-400 font-medium bg-sky-500/10 px-1 py-0.2 rounded border border-sky-500/20';
    }
  };

  return (
    <div
      id="terminal-console"
      className="flex flex-col rounded-lg bg-[#0A0D14] border border-[#1C2434] shadow-xl overflow-hidden font-mono"
    >
      {/* Terminal Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[#0E131E] border-b border-[#1C2434] select-none text-xs">
        {/* Left: Window Controls & Bot Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-[#20293C]">
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">Terminal</span>
          </div>

          {showBotSelector && (
            <div className="relative flex items-center">
              <select
                id="select-terminal-bot"
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="bg-[#151C2A] text-slate-200 text-xs font-mono rounded-md px-2.5 py-1 border border-[#232E44] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="all">All Managed Bots</option>
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Search, Filter, Actions, Connection Status */}
        <div className="flex items-center gap-2 flex-wrap ml-auto font-sans">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-terminal-search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#151C2A] text-slate-200 placeholder-slate-500 pl-7 pr-2.5 py-1 text-xs font-mono rounded-md border border-[#232E44] focus:outline-none focus:border-indigo-500 w-28 sm:w-36 transition-all"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-0.5 bg-[#151C2A] p-0.5 rounded-md border border-[#232E44] text-xs font-mono">
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'SYSTEM'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Auto-scroll Toggle */}
          <button
            id="btn-terminal-autoscroll"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Pause autoscroll' : 'Resume autoscroll'}
            className={`p-1.5 rounded-md border text-xs transition-colors flex items-center cursor-pointer ${
              autoScroll
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                : 'bg-[#151C2A] border-[#232E44] text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          {/* Clear Button */}
          <button
            id="btn-terminal-clear"
            onClick={handleClear}
            title="Clear display"
            className="p-1.5 rounded-md bg-[#151C2A] hover:bg-[#1E273A] border border-[#232E44] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Copy Button */}
          <button
            id="btn-terminal-copy"
            onClick={handleCopy}
            title="Copy logs"
            className="p-1.5 rounded-md bg-[#151C2A] hover:bg-[#1E273A] border border-[#232E44] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          {/* Download Button */}
          <button
            id="btn-terminal-download"
            onClick={handleDownload}
            title="Download log file"
            className="p-1.5 rounded-md bg-[#151C2A] hover:bg-[#1E273A] border border-[#232E44] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
          </button>

          {/* Connection Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Log Stream Output Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`p-3.5 overflow-y-auto ${heightClass} text-xs leading-relaxed`}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 select-none py-12">
            <TerminalIcon className="w-6 h-6 text-slate-400" />
            <p className="text-xs">No console logs available for this filter.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-[#131A26] px-1.5 py-0.5 rounded transition-colors"
              >
                {/* Timestamp */}
                <span className="text-slate-400 shrink-0 select-none text-[11px]">
                  [{log.time}]
                </span>

                {/* Level Tag */}
                <span className={`shrink-0 text-[10px] font-mono ${getLogTypeBadge(log.type)}`}>
                  {log.type}
                </span>

                {/* Bot Name Tag (if viewing all bots) */}
                {selectedBotId === 'all' && (
                  <span className="text-slate-400 shrink-0 text-[10px] px-1 rounded bg-[#151C2A] border border-[#232E44]">
                    {log.botName}
                  </span>
                )}

                {/* Log Message Content */}
                <span
                  className={`break-all whitespace-pre-wrap ${
                    log.type === 'ERROR'
                      ? 'text-rose-300'
                      : log.type === 'WARN'
                      ? 'text-amber-200'
                      : log.type === 'SYSTEM'
                      ? 'text-indigo-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#090C12] border-t border-[#1C2434] text-[10px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span>Entries: <strong className="text-slate-300">{filteredLogs.length}</strong></span>
          {searchQuery && (
            <span className="text-indigo-400">
              Filter: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownCircle className="w-3 h-3" />
              <span>Scroll to bottom</span>
            </button>
          )}
          <span>Socket.IO Realtime Stream</span>
        </div>
      </div>
    </div>
  );
}
