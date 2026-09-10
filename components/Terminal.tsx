<<<<<<< HEAD
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ArrowDownCircle,
  CornerDownLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { LogEntry, BotData } from "@/lib/types";
import { realtime } from "@/lib/socket";
import { api } from "@/lib/api";
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

interface TerminalProps {
  initialBotId?: string;
  bots?: BotData[];
  heightClass?: string;
  showBotSelector?: boolean;
}

export function Terminal({
<<<<<<< HEAD
  initialBotId = "all",
  bots = [],
  heightClass = "h-[500px]",
=======
  initialBotId = 'all',
  bots = [],
  heightClass = 'h-[500px]',
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  showBotSelector = true,
}: TerminalProps) {
  const [prevInitialBotId, setPrevInitialBotId] = useState(initialBotId);
  const [selectedBotId, setSelectedBotId] = useState<string>(initialBotId);
  const [logs, setLogs] = useState<LogEntry[]>([]);
<<<<<<< HEAD
  const [filterLevel, setFilterLevel] = useState<
    "ALL" | "INFO" | "WARN" | "ERROR" | "SYSTEM"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
=======
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

<<<<<<< HEAD
  // Interactive Console Command State
  const [commandInput, setCommandInput] = useState("");
  const [commandMode, setCommandMode] = useState<"exec" | "stdin">("exec");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string>(
    initialBotId !== "all" ? initialBotId : bots[0]?.id || "",
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const temporaryInputRef = useRef<string>("");
=======
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
        if (selectedBotId === "all") {
=======
        if (selectedBotId === 'all') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          let botList = botsRef.current;
          if (!botList || botList.length === 0) {
            botList = await api.getBots().catch(() => []);
          }
          if (botList.length === 0) {
            if (isMounted) setLogs([]);
            return;
          }
<<<<<<< HEAD
          const allPromises = botList.map((b) =>
            api.getBotLogs(b.id, 100).catch(() => []),
          );
          const allResults = await Promise.all(allPromises);
          const merged = allResults
            .flat()
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
=======
          const allPromises = botList.map(b => api.getBotLogs(b.id, 100).catch(() => []));
          const allResults = await Promise.all(allPromises);
          const merged = allResults.flat().sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          if (isMounted) {
            setLogs(merged);
          }
        } else {
<<<<<<< HEAD
          const fetchedLogs = await api
            .getBotLogs(selectedBotId, 300)
            .catch(() => []);
=======
          const fetchedLogs = await api.getBotLogs(selectedBotId, 300).catch(() => []);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
    const unsubLog = realtime.on<LogEntry>("new_log", (newLog) => {
      setLogs((prev) => {
        if (prev.some((l) => l.id === newLog.id)) return prev;
=======
    const unsubLog = realtime.on<LogEntry>('new_log', (newLog) => {
      setLogs((prev) => {
        if (prev.some(l => l.id === newLog.id)) return prev;
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        const updated = [...prev, newLog];
        return updated.length > 1000 ? updated.slice(-1000) : updated;
      });
    });

<<<<<<< HEAD
    const unsubConn = realtime.on<{ connected: boolean }>(
      "connection_change",
      ({ connected }) => {
        setIsConnected(connected);
      },
    );
=======
    const unsubConn = realtime.on<{ connected: boolean }>('connection_change', ({ connected }) => {
      setIsConnected(connected);
    });
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

    return () => {
      unsubLog();
      unsubConn();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
<<<<<<< HEAD
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
=======
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
    const formatted = filteredLogs
      .map(
        (l) =>
          `[${l.time}] ${l.type.padEnd(6, " ")} [${l.botName}] ${l.message}`,
      )
      .join("\n");
=======
    const formatted = filteredLogs.map(l => `[${l.time}] ${l.type.padEnd(6, ' ')} [${l.botName}] ${l.message}`).join('\n');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
<<<<<<< HEAD
    const formatted = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.type}] [${l.botName}] ${l.message}`)
      .join("\n");
    const blob = new Blob([formatted], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
=======
    const formatted = filteredLogs.map(l => `[${l.timestamp}] [${l.type}] [${l.botName}] ${l.message}`).join('\n');
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    a.href = url;
    a.download = `nexuspanel-logs-${selectedBotId}-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

<<<<<<< HEAD
  useEffect(() => {
    if (selectedBotId !== "all") {
      setActiveTargetId(selectedBotId);
    } else if (!activeTargetId && bots.length > 0) {
      setActiveTargetId(bots[0].id);
    }
  }, [selectedBotId, bots, activeTargetId]);

  const effectiveBotId =
    selectedBotId !== "all" ? selectedBotId : activeTargetId;
  const targetBot = bots.find((b) => b.id === effectiveBotId);
  const isTargetOnline = targetBot?.status === "online";

  const appendLocalLog = (
    message: string,
    type: "INFO" | "WARN" | "ERROR" | "SYSTEM" = "SYSTEM",
  ) => {
    const entry: LogEntry = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      botId: effectiveBotId || "console",
      botName: targetBot?.name || "Console",
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      type,
      message,
    };
    setLogs((prev) => {
      const updated = [...prev, entry];
      return updated.length > 1000 ? updated.slice(-1000) : updated;
    });
  };

  const handleSendCommand = async (customCommand?: string) => {
    const raw = (
      customCommand !== undefined ? customCommand : commandInput
    ).trim();
    if (!raw) return;

    // Reset input and update history
    setCommandInput("");
    setHistoryIndex(-1);
    setCommandHistory((prev) =>
      [raw, ...prev.filter((c) => c !== raw)].slice(0, 50),
    );

    // Handle local built-in commands
    const lower = raw.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      handleClear();
      return;
    }

    if (lower === "help") {
      appendLocalLog(
        "═════════════════════════════════════════════════════════════════════",
        "SYSTEM",
      );
      appendLocalLog("NexusPanel Interactive Console Manual", "SYSTEM");
      appendLocalLog(
        "═════════════════════════════════════════════════════════════════════",
        "SYSTEM",
      );
      appendLocalLog(
        "• help                   Display this command reference menu",
        "SYSTEM",
      );
      appendLocalLog(
        "• clear | cls            Clear terminal log display",
        "SYSTEM",
      );
      appendLocalLog(
        "• start                  Start the targeted bot process",
        "SYSTEM",
      );
      appendLocalLog(
        "• stop                   Stop the targeted bot process",
        "SYSTEM",
      );
      appendLocalLog(
        "• restart                Restart the targeted bot process",
        "SYSTEM",
      );
      appendLocalLog(
        "• mode exec              Switch to Shell Execution mode ($)",
        "SYSTEM",
      );
      appendLocalLog(
        "• mode stdin             Switch to Process Standard Input mode (>)",
        "SYSTEM",
      );
      appendLocalLog(
        "• $ <command>            Force execution in Shell ($) mode (e.g. $ npm list)",
        "SYSTEM",
      );
      appendLocalLog(
        "• > <text>               Force input in Stdin (>) mode",
        "SYSTEM",
      );
      appendLocalLog(
        "Shortcuts: [Enter] execute • [↑ / ↓] command history • [Esc] clear input",
        "SYSTEM",
      );
      appendLocalLog(
        "═════════════════════════════════════════════════════════════════════",
        "SYSTEM",
      );
      return;
    }

    if (lower === "mode exec") {
      setCommandMode("exec");
      appendLocalLog(
        "Switched console mode to Shell Exec ($). Commands run in the bot directory.",
        "SYSTEM",
      );
      return;
    }

    if (lower === "mode stdin") {
      setCommandMode("stdin");
      appendLocalLog(
        "Switched console mode to Process Stdin (>). Input writes to the bot stdin stream.",
        "SYSTEM",
      );
      return;
    }

    // Bot targeted commands
    if (!effectiveBotId) {
      appendLocalLog(
        "Error: No target bot selected. Please select a bot to execute commands.",
        "ERROR",
      );
      return;
    }

    if (lower === "start") {
      try {
        appendLocalLog(
          `Initiating start for "${targetBot?.name || effectiveBotId}"...`,
          "SYSTEM",
        );
        await api.startBot(effectiveBotId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        appendLocalLog(`Failed to start bot: ${msg}`, "ERROR");
      }
      return;
    }

    if (lower === "stop") {
      try {
        appendLocalLog(
          `Initiating stop for "${targetBot?.name || effectiveBotId}"...`,
          "SYSTEM",
        );
        await api.stopBot(effectiveBotId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        appendLocalLog(`Failed to stop bot: ${msg}`, "ERROR");
      }
      return;
    }

    if (lower === "restart") {
      try {
        appendLocalLog(
          `Initiating restart for "${targetBot?.name || effectiveBotId}"...`,
          "SYSTEM",
        );
        await api.restartBot(effectiveBotId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        appendLocalLog(`Failed to restart bot: ${msg}`, "ERROR");
      }
      return;
    }

    // Determine execution mode (supports prefix override: $ or >)
    let executionMode = commandMode;
    let commandToRun = raw;

    if (raw.startsWith("$ ")) {
      executionMode = "exec";
      commandToRun = raw.slice(2).trim();
    } else if (raw.startsWith("> ")) {
      executionMode = "stdin";
      commandToRun = raw.slice(2).trim();
    }

    if (!commandToRun) return;

    if (executionMode === "stdin") {
      if (!isTargetOnline) {
        appendLocalLog(
          `Cannot send stdin: Bot "${targetBot?.name || effectiveBotId}" is offline. Start the bot first or switch to Exec ($) mode.`,
          "WARN",
        );
        return;
      }

      try {
        const emitted = realtime.emit("bot_stdin", {
          botId: effectiveBotId,
          input: commandToRun,
        });
        if (!emitted) {
          await api.sendBotStdin(effectiveBotId, commandToRun);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        appendLocalLog(`Failed to send stdin: ${msg}`, "ERROR");
      }
    } else {
      // Shell Exec Mode
      setIsExecuting(true);
      try {
        const result = await api.execBotCommand(effectiveBotId, commandToRun);
        if (!result.success) {
          appendLocalLog(
            `Command execution failed: ${result.data?.message || "Non-zero exit code"}`,
            "ERROR",
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Execution error";
        appendLocalLog(`Execution error: ${msg}`, "ERROR");
      } finally {
        setIsExecuting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex === -1) {
        temporaryInputRef.current = commandInput;
      }
      const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIndex);
      setCommandInput(commandHistory[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput(temporaryInputRef.current);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCommandInput("");
      setHistoryIndex(-1);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedBotId !== "all" && log.botId !== selectedBotId) return false;
    if (filterLevel !== "ALL" && log.type !== filterLevel) return false;
    if (searchQuery.trim() !== "") {
=======
  const filteredLogs = logs.filter((log) => {
    if (selectedBotId !== 'all' && log.botId !== selectedBotId) return false;
    if (filterLevel !== 'ALL' && log.type !== filterLevel) return false;
    if (searchQuery.trim() !== '') {
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.botName.toLowerCase().includes(q) ||
        log.time.toLowerCase().includes(q)
      );
    }
    return true;
  });

<<<<<<< HEAD
  const getLogTypeBadge = (type: LogEntry["type"]) => {
    switch (type) {
      case "ERROR":
        return "text-rose-400 font-bold bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20";
      case "WARN":
        return "text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20";
      case "SYSTEM":
        return "text-indigo-400 font-semibold bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20";
      case "INFO":
      default:
        return "text-sky-400 font-medium bg-sky-500/10 px-1 py-0.2 rounded border border-sky-500/20";
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
            {(["ALL", "INFO", "WARN", "ERROR", "SYSTEM"] as const).map(
              (lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    filterLevel === lvl
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ),
            )}
=======
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
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          </div>

          {/* Auto-scroll Toggle */}
          <button
            id="btn-terminal-autoscroll"
            onClick={() => setAutoScroll(!autoScroll)}
<<<<<<< HEAD
            title={autoScroll ? "Pause autoscroll" : "Resume autoscroll"}
            className={`p-1.5 rounded-md border text-xs transition-colors flex items-center cursor-pointer ${
              autoScroll
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                : "bg-[#151C2A] border-[#232E44] text-slate-400 hover:text-slate-200"
            }`}
          >
            {autoScroll ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
=======
            title={autoScroll ? 'Pause autoscroll' : 'Resume autoscroll'}
            className={`p-1.5 rounded-md border text-xs transition-colors flex items-center cursor-pointer ${
              autoScroll
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                : 'bg-[#151C2A] border-[#232E44] text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
=======
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-2.5 h-2.5" />
            ) : (
              <WifiOff className="w-2.5 h-2.5" />
            )}
            <span className="hidden sm:inline">
              {isConnected ? "Live" : "Offline"}
            </span>
=======
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
            <p className="text-xs">
              No console logs available for this filter.
            </p>
=======
            <p className="text-xs">No console logs available for this filter.</p>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
                <span
                  className={`shrink-0 text-[10px] font-mono ${getLogTypeBadge(log.type)}`}
                >
=======
                <span className={`shrink-0 text-[10px] font-mono ${getLogTypeBadge(log.type)}`}>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                  {log.type}
                </span>

                {/* Bot Name Tag (if viewing all bots) */}
<<<<<<< HEAD
                {selectedBotId === "all" && (
=======
                {selectedBotId === 'all' && (
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
                  <span className="text-slate-400 shrink-0 text-[10px] px-1 rounded bg-[#151C2A] border border-[#232E44]">
                    {log.botName}
                  </span>
                )}

                {/* Log Message Content */}
                <span
                  className={`break-all whitespace-pre-wrap ${
<<<<<<< HEAD
                    log.type === "ERROR"
                      ? "text-rose-300"
                      : log.type === "WARN"
                        ? "text-amber-200"
                        : log.type === "SYSTEM"
                          ? "text-indigo-300"
                          : "text-slate-300"
=======
                    log.type === 'ERROR'
                      ? 'text-rose-300'
                      : log.type === 'WARN'
                      ? 'text-amber-200'
                      : log.type === 'SYSTEM'
                      ? 'text-indigo-300'
                      : 'text-slate-300'
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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

<<<<<<< HEAD
      {/* Interactive Console Command Input Bar */}
      <div className="bg-[#0B0F19] border-t border-[#1C2434] p-3 space-y-2 select-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: Mode Switcher Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-[#141A27] p-0.5 border border-[#232E44] text-[11px] font-mono">
              <button
                type="button"
                id="btn-mode-exec"
                onClick={() => setCommandMode("exec")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  commandMode === "exec"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Shell Exec Mode ($): Runs shell command inside bot working directory"
              >
                <TerminalIcon className="w-3 h-3" />
                <span>Exec ($)</span>
              </button>
              <button
                type="button"
                id="btn-mode-stdin"
                onClick={() => setCommandMode("stdin")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  commandMode === "stdin"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Process Stdin Mode (>): Writes directly to running bot process standard input"
              >
                <ChevronRight className="w-3 h-3" />
                <span>Stdin (&gt;)</span>
              </button>
            </div>

            {/* Target Bot Selector (when viewing 'all' bots) */}
            {selectedBotId === "all" && bots.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs font-mono hidden sm:inline">
                  Target:
                </span>
                <select
                  id="select-target-bot"
                  value={effectiveBotId}
                  onChange={(e) => setActiveTargetId(e.target.value)}
                  className="bg-[#141A27] text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1 border border-[#232E44] focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Bot Status & Mode Hints */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {commandMode === "stdin" && !isTargetOnline && effectiveBotId ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span>Offline (stdin requires active bot)</span>
                <button
                  type="button"
                  onClick={() => handleSendCommand("start")}
                  className="underline hover:text-amber-300 ml-1 cursor-pointer font-semibold"
                >
                  Start Bot
                </button>
              </div>
            ) : (
              <span className="text-slate-400 text-[10px] hidden md:inline">
                {commandMode === "exec"
                  ? "Runs shell command in bot workspace"
                  : "Sends text directly to child process stdin"}
              </span>
            )}
          </div>
        </div>

        {/* Command Input Row */}
        <div className="flex items-center gap-2">
          {/* Prompt prefix display */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141A27] border border-[#232E44] text-xs font-mono select-none shrink-0">
            <span className="text-slate-400 max-w-[130px] truncate">
              {targetBot ? targetBot.name : "bot"}
            </span>
            <span
              className={
                commandMode === "exec"
                  ? "text-indigo-400 font-bold"
                  : "text-emerald-400 font-bold"
              }
            >
              {commandMode === "exec" ? "$" : ">"}
            </span>
          </div>

          {/* Command text input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              id="input-terminal-command"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting || !effectiveBotId}
              placeholder={
                !effectiveBotId
                  ? "No bots configured to target..."
                  : commandMode === "exec"
                    ? "Enter shell command (e.g., npm test, git status, dir, help)..."
                    : isTargetOnline
                      ? "Enter input to send to process standard input (help)..."
                      : "Target bot is offline. Start bot to send stdin or switch to Exec ($)..."
              }
              className="w-full bg-[#06080E] text-slate-100 placeholder-slate-500 border border-[#232E44] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-lg px-3 py-1.5 font-mono text-xs outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Execute / Send Button */}
          <button
            type="button"
            id="btn-terminal-send-command"
            onClick={() => handleSendCommand()}
            disabled={isExecuting || !effectiveBotId || !commandInput.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold font-sans transition-all shadow-md cursor-pointer shrink-0"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Quick action shortcuts & keyboard guidance */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">Quick Actions:</span>
            <button
              type="button"
              onClick={() => handleSendCommand("help")}
              className="px-1.5 py-0.5 rounded bg-[#141A27] hover:bg-[#1E273A] border border-[#232E44] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              help
            </button>
            <button
              type="button"
              onClick={() => handleSendCommand("clear")}
              className="px-1.5 py-0.5 rounded bg-[#141A27] hover:bg-[#1E273A] border border-[#232E44] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              clear
            </button>
            {targetBot && (
              <>
                {isTargetOnline ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendCommand("restart")}
                      className="px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                    >
                      restart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendCommand("stop")}
                      className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                    >
                      stop
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendCommand("start")}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                  >
                    start
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 hidden sm:flex">
            <span>
              Press{" "}
              <kbd className="px-1 py-0.2 rounded bg-[#141A27] border border-[#232E44] text-slate-300">
                ↵
              </kbd>{" "}
              to execute
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-[#141A27] border border-[#232E44] text-slate-300">
                ↑↓
              </kbd>{" "}
              history
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-[#141A27] border border-[#232E44] text-slate-300">
                Esc
              </kbd>{" "}
              clear
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#090C12] border-t border-[#1C2434] text-[10px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span>
            Entries:{" "}
            <strong className="text-slate-300">{filteredLogs.length}</strong>
          </span>
=======
      {/* Terminal Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#090C12] border-t border-[#1C2434] text-[10px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span>Entries: <strong className="text-slate-300">{filteredLogs.length}</strong></span>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
<<<<<<< HEAD
                terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
=======
                terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
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
