'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BotData, BotDatabaseInfo, QueryResult, TableDataResult, TableInfo } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Database, Play } from 'lucide-react';

interface ForgeDatabasesTabProps {
  bot: BotData;
}

export function ForgeDatabasesTab({ bot }: ForgeDatabasesTabProps) {
  const toast = useToast();
  const [dbInfo, setDbInfo] = useState<BotDatabaseInfo | null>(null);
  const [selectedDb, setSelectedDb] = useState('database.sqlite');
  const [newDbName, setNewDbName] = useState('database.sqlite');
  const [connectionsFrom, setConnectionsFrom] = useState('%');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // SQL Query execution
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM bot_settings LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchDatabases = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getBotDatabases(bot.id);
      setDbInfo(data);
      if (data.databases && data.databases.length > 0) {
        setSelectedDb(data.databases[0].relativePath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch databases';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [bot.id, toast]);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;

    setIsCreating(true);
    try {
      await api.createBotDatabase(bot.id, newDbName.trim(), true);
      toast.success(`Created database "${newDbName}"`);
      await fetchDatabases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create database';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await api.executeBotQuery(bot.id, sqlQuery.trim(), selectedDb);
      setQueryResult(res);
      toast.success(`Query executed in ${res.durationMs}ms`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SQL query failed';
      toast.error(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  const databases = dbInfo?.databases || [];

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Manage Databases Card */}
      <div className="forge-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Manage databases</h3>
          <button
            onClick={() => {
              const el = document.getElementById('new-db-form-input');
              el?.focus();
            }}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            <span>New database</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            Loading database registry...
          </div>
        ) : databases.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No databases yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2027] text-slate-500">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Username</th>
                  <th className="pb-3 font-semibold">Endpoint</th>
                  <th className="pb-3 font-semibold text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1E24]">
                {databases.map((d) => (
                  <tr key={d.relativePath} className="hover:bg-[#181A20] transition-colors">
                    <td className="py-3 text-white font-bold flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>{d.name}</span>
                    </td>
                    <td className="py-3 text-slate-400">sqlite_root</td>
                    <td className="py-3 text-slate-400">127.0.0.1 (local)</td>
                    <td className="py-3 text-right text-slate-400">{d.sizeFormatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. New Database Form Card */}
      <div className="forge-card p-5 space-y-4 font-sans">
        <h3 className="text-sm font-bold text-white tracking-tight">New database</h3>

        <form onSubmit={handleCreateDatabase} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Database name</label>
            <input
              id="new-db-form-input"
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="database.sqlite"
              className="w-full bg-[#0D0E12] text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Connections from</label>
            <input
              type="text"
              value={connectionsFrom}
              onChange={(e) => setConnectionsFrom(e.target.value)}
              placeholder="%"
              className="w-full bg-[#0D0E12] text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623]"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="forge-btn-primary text-xs py-2 px-5"
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Create</span>
          </button>
        </form>
      </div>

      {/* 3. SQL Query Console */}
      <div className="forge-card p-5 space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">SQL Console</h3>
          <button
            onClick={handleExecuteSql}
            disabled={isExecuting}
            className="forge-btn-primary text-xs py-1 px-3"
          >
            {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            <span>Run SQL</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          className="w-full bg-[#0D0E12] text-emerald-400 font-mono text-xs px-3.5 py-2.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623] resize-none"
        />

        {queryResult && (
          <div className="rounded-lg bg-[#0D0E12] border border-[#1E2027] p-3 text-xs font-mono max-h-48 overflow-auto">
            <div className="text-slate-400 mb-2">
              Result ({queryResult.rows ? queryResult.rows.length : 0} rows, {queryResult.durationMs}ms):
            </div>
            {queryResult.rows && queryResult.rows.length > 0 ? (
              <pre className="text-slate-200 text-[11px]">
                {JSON.stringify(queryResult.rows, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500">Statement executed successfully. No rows returned.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
