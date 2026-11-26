"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Table as TableIcon,
  Play,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  Code2,
  HardDrive,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  BotDatabaseFile,
  BotDatabaseInfo,
  TableInfo,
  TableDataResult,
  QueryResult,
} from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

interface DatabaseManagerTabProps {
  botId: string;
  botName: string;
}

const STARTER_SCHEMAS = [
  {
    id: "general",
    name: "General Bot (Settings & Logs)",
    desc: "bot_settings key-value store and command_logs table",
  },
  {
    id: "economy",
    name: "Economy & Leveling",
    desc: "users balance/XP/levels and transactions ledger",
  },
  {
    id: "moderation",
    name: "Moderation & Logs",
    desc: "warnings tracking and mod_logs audit trail",
  },
  {
    id: "reaction_roles",
    name: "Reaction Roles",
    desc: "message_id to emoji and role_id mapping",
  },
];

export function DatabaseManagerTab({
  botId,
  botName,
}: DatabaseManagerTabProps) {
  const toast = useToast();

  const [dbInfo, setDbInfo] = useState<BotDatabaseInfo | null>(null);
  const [selectedDb, setSelectedDb] = useState<string>("database.sqlite");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableDataResult | null>(null);
  const [pageOffset, setPageOffset] = useState<number>(0);
  const pageSize = 25;

  // View mode: 'tables' or 'query'
  const [viewMode, setViewMode] = useState<"tables" | "query">("tables");

  // SQL Query state
  const [queryInput, setQueryInput] = useState<string>(
    "SELECT * FROM bot_settings LIMIT 10;",
  );
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingDb, setIsCreatingDb] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDbName, setNewDbName] = useState("database.sqlite");

  const fetchDatabases = useCallback(async () => {
    try {
      const data = await api.getBotDatabases(botId);
      setDbInfo(data);
      if (data.databases.length > 0) {
        const currentValid = data.databases.some(
          (d) => d.relativePath === selectedDb,
        );
        if (!currentValid) {
          setSelectedDb(data.databases[0].relativePath);
        }
      }
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load databases";
      toast.error(msg, "Database Error");
      return null;
    }
  }, [botId, selectedDb, toast]);

  const fetchTables = useCallback(
    async (dbTarget = selectedDb) => {
      try {
        const res = await api.getBotTables(botId, dbTarget);
        setTables(res.tables || []);
        if (res.tables && res.tables.length > 0) {
          setSelectedTable((prev) => {
            const exists = res.tables.some((t) => t.name === prev);
            return exists ? prev : res.tables[0].name;
          });
        } else {
          setSelectedTable(null);
          setTableData(null);
        }
      } catch {
        setTables([]);
        setSelectedTable(null);
        setTableData(null);
      }
    },
    [botId, selectedDb],
  );

  const fetchTableData = useCallback(
    async (table: string, offset = 0) => {
      if (!table) return;
      try {
        const data = await api.getBotTableData(
          botId,
          table,
          selectedDb,
          pageSize,
          offset,
        );
        setTableData(data);
        setPageOffset(offset);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to read table rows";
        toast.error(msg);
      }
    },
    [botId, selectedDb, pageSize, toast],
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      const info = await fetchDatabases();
      if (isMounted && info && info.databases.length > 0) {
        await fetchTables(info.defaultDb || "database.sqlite");
      }
      if (isMounted) setIsLoading(false);
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchDatabases, fetchTables]);

  // When selectedTable changes, fetch rows
  useEffect(() => {
    if (selectedTable && viewMode === "tables") {
      fetchTableData(selectedTable, 0);
    }
  }, [selectedTable, viewMode, fetchTableData]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDatabases();
    await fetchTables(selectedDb);
    if (selectedTable) {
      await fetchTableData(selectedTable, pageOffset);
    }
    setIsRefreshing(false);
    toast.success("Database refreshed.", "Refreshed");
  };

  // Create database handler
  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    setIsCreatingDb(true);
    try {
      const created = await api.createBotDatabase(botId, newDbName.trim());
      toast.success(
        `Created database "${created.name}" and configured DATABASE_URL in .env.`,
        "Database Created",
      );
      setShowCreateModal(false);
      setNewDbName("database.sqlite");
      setSelectedDb(created.relativePath);
      await fetchDatabases();
      await fetchTables(created.relativePath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create database";
      toast.error(msg, "Create Error");
    } finally {
      setIsCreatingDb(false);
    }
  };

  // Seed starter schema handler
  const handleSeedSchema = async (templateId: string) => {
    setIsSeeding(true);
    try {
      const res = await api.seedBotDatabase(botId, templateId, selectedDb);
      toast.success(
        res.message || "Schema applied successfully.",
        "Schema Seeded",
      );
      await fetchDatabases();
      await fetchTables(selectedDb);
      // Auto-set sample query for user convenience
      if (templateId === "general") {
        setQueryInput("SELECT * FROM bot_settings;");
      } else if (templateId === "economy") {
        setQueryInput("SELECT * FROM users;");
      } else if (templateId === "moderation") {
        setQueryInput("SELECT * FROM warnings;");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed schema";
      toast.error(msg, "Seed Error");
    } finally {
      setIsSeeding(false);
    }
  };

  // Execute custom SQL query
  const handleRunQuery = async () => {
    if (!queryInput.trim()) return;
    setIsExecuting(true);
    setQueryError(null);
    try {
      const result = await api.executeBotQuery(
        botId,
        queryInput.trim(),
        selectedDb,
      );
      setQueryResult(result);
      if (result.type === "mutation") {
        toast.success(
          `Executed in ${result.durationMs}ms`,
          "SQL Success",
        );
        // Refresh tables in background in case CREATE/DROP/ALTER was run
        fetchTables(selectedDb);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Query execution failed";
      setQueryError(msg);
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = () => {
    const url = api.getBotDatabaseDownloadUrl(botId, selectedDb);
    window.open(url, "_blank");
    toast.info(`Downloading ${selectedDb}...`);
  };

  const currentDbObj = dbInfo?.databases.find(
    (d) => d.relativePath === selectedDb,
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Top Database Toolbar */}
      <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] p-4 flex flex-wrap items-center justify-between gap-3.5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Database className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white font-mono">
                Bot SQLite Database
              </span>
              {currentDbObj && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentDbObj.sizeFormatted}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Self-contained zero-config SQL database for {botName}
            </p>
          </div>
        </div>

        {/* Database Selector & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {dbInfo && dbInfo.databases.length > 1 && (
            <select
              value={selectedDb}
              onChange={(e) => {
                setSelectedDb(e.target.value);
                fetchTables(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-inset border border-line text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {dbInfo.databases.map((db) => (
                <option key={db.relativePath} value={db.relativePath}>
                  {db.relativePath} ({db.sizeFormatted})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-raised hover:bg-raised text-slate-200 hover:text-white border border-line text-xs font-medium transition-colors cursor-pointer"
            title="Create new database file"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New DB</span>
          </button>

          {currentDbObj && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-raised hover:bg-raised text-slate-200 hover:text-white border border-line text-xs font-medium transition-colors cursor-pointer"
              title="Download SQLite file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-raised hover:bg-raised text-slate-300 hover:text-white border border-line text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-xs font-mono text-slate-400">
            Connecting to bot SQLite engine...
          </p>
        </div>
      ) : !dbInfo?.hasDatabases ? (
        /* Empty State: No database yet */
        <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Database className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white tracking-tight">
              No Database Configured
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              This bot does not have an SQLite database file yet. Initialize one
              with 1-click starter tables for settings, leveling, or moderation.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {STARTER_SCHEMAS.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSeedSchema(tpl.id)}
                disabled={isSeeding}
                className="flex flex-col items-start p-3 rounded-xl bg-inset border border-line hover:border-indigo-500/50 hover:bg-panel text-left transition-all cursor-pointer w-64 disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{tpl.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {tpl.desc}
                </p>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleSeedSchema("general")}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Initialize Standard database.sqlite</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Database View */
        <div className="space-y-4">
          {/* Sub Navigation: Tables vs SQL Query Console */}
          <div className="flex items-center justify-between border-b border-line pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("tables")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewMode === "tables"
                    ? "bg-raised text-white border border-indigo-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-panel"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tables & Schema</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  {tables.length}
                </span>
              </button>

              <button
                onClick={() => setViewMode("query")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewMode === "query"
                    ? "bg-raised text-white border border-indigo-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-panel"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>SQL Query Console</span>
              </button>
            </div>

            {/* Quick Schema Seed Action */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Seed Schema:
              </span>
              <div className="flex items-center gap-1">
                {STARTER_SCHEMAS.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSeedSchema(tpl.id)}
                    disabled={isSeeding}
                    className="px-2 py-1 rounded text-[10px] font-mono text-slate-300 hover:text-white bg-panel hover:bg-raised border border-line transition-colors cursor-pointer disabled:opacity-50"
                    title={tpl.desc}
                  >
                    +{tpl.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Tables & Data */}
          {viewMode === "tables" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Table List */}
              <div className="md:col-span-4 rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] p-3 space-y-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tables</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tables.length} total
                  </span>
                </div>

                {tables.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-slate-400">
                    No tables created yet. Use Seed Schema buttons above or SQL
                    Console to create tables.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {tables.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                          selectedTable === t.name
                            ? "bg-indigo-600/15 border border-indigo-500/35 text-white font-semibold"
                            : "hover:bg-raised text-slate-300 hover:text-white border border-transparent"
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {t.rowCount} rows
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Schema and Data Browser */}
              <div className="md:col-span-8 space-y-4">
                {selectedTable && (
                  <>
                    {/* Columns Schema Box */}
                    {tables.find((t) => t.name === selectedTable) && (
                      <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-sky-400" />
                            <span>{selectedTable} Schema</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {
                              tables.find((t) => t.name === selectedTable)!
                                .columns.length
                            }{" "}
                            columns
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {tables
                            .find((t) => t.name === selectedTable)!
                            .columns.map((col) => (
                              <div
                                key={col.name}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-inset border border-line text-xs font-mono"
                              >
                                {col.pk && (
                                  <Key className="w-3 h-3 text-amber-400" />
                                )}
                                <span className="text-white font-semibold">
                                  {col.name}
                                </span>
                                <span className="text-[10px] text-indigo-400">
                                  {col.type}
                                </span>
                                {col.notnull && (
                                  <span className="text-[9px] text-rose-400">
                                    NOT NULL
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Table Data Viewer */}
                    <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-panel border-b border-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">
                            {selectedTable} Records
                          </span>
                          {tableData && (
                            <span className="text-[10px] font-mono text-slate-400">
                              (showing {tableData.rows.length} of{" "}
                              {tableData.totalRows} rows)
                            </span>
                          )}
                        </div>

                        {/* Pagination */}
                        {tableData && tableData.totalRows > pageSize && (
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <button
                              disabled={pageOffset === 0}
                              onClick={() =>
                                fetchTableData(
                                  selectedTable,
                                  Math.max(0, pageOffset - pageSize),
                                )
                              }
                              className="p-1 rounded bg-raised text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-slate-400 text-[10px]">
                              {Math.floor(pageOffset / pageSize) + 1} /{" "}
                              {Math.ceil(tableData.totalRows / pageSize)}
                            </span>
                            <button
                              disabled={
                                pageOffset + pageSize >= tableData.totalRows
                              }
                              onClick={() =>
                                fetchTableData(
                                  selectedTable,
                                  pageOffset + pageSize,
                                )
                              }
                              className="p-1 rounded bg-raised text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto max-h-[420px] font-mono text-xs">
                        {tableData && tableData.rows.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-inset border-b border-line text-slate-400 text-[11px]">
                                {tableData.columns.map((col) => (
                                  <th key={col} className="px-3.5 py-2 font-medium">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {tableData.rows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-panel transition-colors"
                                >
                                  {tableData.columns.map((col) => (
                                    <td
                                      key={col}
                                      className="px-3.5 py-2 text-slate-200 whitespace-nowrap"
                                    >
                                      {row[col] === null ||
                                      row[col] === undefined ? (
                                        <span className="text-slate-600 italic">
                                          NULL
                                        </span>
                                      ) : typeof row[col] === "object" ? (
                                        JSON.stringify(row[col])
                                      ) : (
                                        String(row[col])
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-8 text-center text-slate-500 font-mono text-xs">
                            No rows found in this table.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: SQL Query Console */}
          {viewMode === "query" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-inset border border-line overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-panel border-b border-line">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      Execute SQL Query ({selectedDb})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQueryInput("SELECT * FROM sqlite_master WHERE type='table';")
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-raised border border-line transition-colors cursor-pointer"
                    >
                      Show Tables
                    </button>
                    <button
                      onClick={() =>
                        setQueryInput(
                          "SELECT datetime('now') as server_time, sqlite_version() as version;",
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-raised border border-line transition-colors cursor-pointer"
                    >
                      Version
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <textarea
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleRunQuery();
                      }
                    }}
                    placeholder="Write SQL statement, e.g. SELECT * FROM users WHERE balance > 0; (Ctrl+Enter to run)"
                    rows={4}
                    className="w-full rounded-lg bg-canvas border border-line p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                  />

                  <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Tip: Press <kbd className="px-1 py-0.5 bg-raised border border-line rounded text-slate-300">Ctrl+Enter</kbd> to execute
                    </span>

                    <button
                      onClick={handleRunQuery}
                      disabled={isExecuting || !queryInput.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>Run Query</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {queryError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 flex items-start gap-2.5 text-xs text-rose-300 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold">SQL Error: </span>
                    <span>{queryError}</span>
                  </div>
                </div>
              )}

              {/* Query Results */}
              {queryResult && (
                <div className="rounded-2xl bg-inset/90 border border-white/[0.07] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] overflow-hidden shadow-sm">
                  <div className="px-4 py-2.5 bg-panel border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">
                        Query Results
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({queryResult.count || 0} rows in {queryResult.durationMs}ms)
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      SUCCESS
                    </span>
                  </div>

                  {queryResult.type === "select" &&
                  queryResult.rows &&
                  queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-[350px] font-mono text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-inset border-b border-line text-slate-400 text-[11px]">
                            {queryResult.columns?.map((col) => (
                              <th key={col} className="px-3.5 py-2 font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {queryResult.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-panel transition-colors"
                            >
                              {queryResult.columns?.map((col) => (
                                <td
                                  key={col}
                                  className="px-3.5 py-2 text-slate-200 whitespace-nowrap"
                                >
                                  {row[col] === null ||
                                  row[col] === undefined ? (
                                    <span className="text-slate-600 italic">
                                      NULL
                                    </span>
                                  ) : typeof row[col] === "object" ? (
                                    JSON.stringify(row[col])
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-mono text-xs">
                      {queryResult.message || "Query returned 0 rows."}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Database Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-inset border border-line rounded-xl shadow-2xl p-5 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Create New SQLite Database
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDatabase} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Database File Name
                </label>
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="database.sqlite"
                  className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Will be created in bot root and set in .env as DATABASE_URL and DB_PATH
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-raised border border-line cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDb || !newDbName.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingDb ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
