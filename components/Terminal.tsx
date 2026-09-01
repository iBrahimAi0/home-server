'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Pause, 
  Play, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Download, 
  Wifi, 
  WifiOff, 
  ArrowDownCircle,
  Bot
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

  // Sync state if initialBotId prop changes
  if (initialBotId !== prevInitialBotId) {
    setPrevInitialBotId(initialBotId);
    setSelectedBotId(initialBotId);
  }

  // Initialize and load historical logs
  useEffect(() => {
    let isMounted = true;

    async function loadLogs() {
      try {
        if (selectedBotId === 'all') {
          // Fetch logs from all bots
          let botList = bots;
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
  }, [selectedBotId, bots]);

  // Subscribe to live log events via realtime Socket.IO / SSE
  useEffect(() => {
    realtime.connect();

    const unsubLog = realtime.on<LogEntry>('new_log', (newLog) => {
      setLogs((prev) => {
        // Prevent duplicate log IDs
        if (prev.some(l => l.id === newLog.id)) return prev;
        const updated = [...prev, newLog];
        // Keep memory safe (max 1000 items in view)
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

  // Auto scroll to bottom when new logs arrive if enabled
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
    a.download = `home-server-logs-${selectedBotId}-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs based on bot selection, log level, and search text
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
        return 'text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20';
      case 'WARN':
        return 'text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20';
      case 'SYSTEM':
        return 'text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20';
      case 'INFO':
      default:
        return 'text-sky-400 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20';
    }
  };

  return (
    <div
      id="terminal-console"
      className="flex flex-col rounded-xl bg-[#090D16] border border-[#1E293B] shadow-2xl overflow-hidden font-mono"
    >
      {/* Terminal Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-[#0E1424] border-b border-[#1E293B] select-none text-xs">
        {/* Left: Window Controls & Bot Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block border border-rose-600" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block border border-amber-600" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block border border-emerald-600" />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
            <TerminalIcon className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-slate-200">Terminal Console</span>
          </div>

          {showBotSelector && (
            <div className="relative flex items-center">
              <select
                id="select-terminal-bot"
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="bg-[#151D30] text-slate-200 text-xs font-sans rounded-lg px-2.5 py-1.5 border border-slate-700/70 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option value="all">🌐 All Managed Bots</option>
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    🤖 {b.name} ({b.status})
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
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-terminal-search"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#151D30] text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-700/70 focus:outline-none focus:border-purple-500 w-32 sm:w-44 transition-all"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-[#151D30] p-0.5 rounded-lg border border-slate-700/70 text-xs">
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'SYSTEM'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded transition-colors text-[11px] font-medium ${
                  filterLevel === lvl
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Auto-scroll Toggle Button */}
          <button
            id="btn-terminal-autoscroll"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Pause auto-scrolling' : 'Resume auto-scrolling'}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              autoScroll
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Button */}
          <button
            id="btn-terminal-clear"
            onClick={handleClear}
            title="Clear Console Display"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            id="btn-terminal-copy"
            onClick={handleCopy}
            title="Copy filtered logs"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button */}
          <button
            id="btn-terminal-download"
            onClick={handleDownload}
            title="Download log file"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Connection Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Log Output Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`p-4 overflow-y-auto ${heightClass} text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent`}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 select-none font-sans py-12">
            <TerminalIcon className="w-8 h-8 opacity-40 text-slate-600" />
            <p className="text-sm">No console logs available for the selected filter.</p>
            <p className="text-xs text-slate-600">Logs will appear automatically when bots start or receive events.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 hover:bg-slate-800/30 px-1.5 py-0.5 rounded transition-colors group"
              >
                {/* Timestamp */}
                <span className="text-slate-500 shrink-0 select-none text-xs">
                  [{log.time}]
                </span>

                {/* Level Tag */}
                <span className={`shrink-0 text-[11px] font-mono tracking-wider ${getLogTypeBadge(log.type)}`}>
                  {log.type.padEnd(6, ' ')}
                </span>

                {/* Bot Name Tag (if viewing all bots) */}
                {selectedBotId === 'all' && (
                  <span className="text-slate-400 shrink-0 text-xs px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
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
                      ? 'text-purple-300'
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

      {/* Terminal Footer Info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0A0F1A] border-t border-[#1E293B] text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>
            Total Entries: <span className="text-slate-300 font-semibold">{filteredLogs.length}</span>
          </span>
          {searchQuery && (
            <span className="text-purple-400 font-sans">
              Filter: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-sans">
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Scroll to bottom</span>
            </button>
          )}
          <span>Stream: <span className="text-slate-300">Socket.IO / Realtime EventStream</span></span>
        </div>
      </div>
    </div>
  );
}
