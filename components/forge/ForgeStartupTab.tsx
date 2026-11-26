'use client';

import React, { useState, useEffect } from 'react';
import { BotData } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface ForgeStartupTabProps {
  bot: BotData;
  onRefresh?: () => void;
}

export function ForgeStartupTab({ bot, onRefresh }: ForgeStartupTabProps) {
  const toast = useToast();
  const [command, setCommand] = useState(bot.command ? `${bot.command} ${(bot.args || []).join(' ')}` : 'node index.js');
  const [dockerImage, setDockerImage] = useState('NodeJs 24');
  const [additionalPackages, setAdditionalPackages] = useState('');
  const [jsFile, setJsFile] = useState(bot.args?.[0] || 'index.js');

  const [envPairs, setEnvPairs] = useState<{ key: string; value: string; revealed: boolean }[]>([]);
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getBotEnv(bot.id).then((rawEnv) => {
      if (!isMounted) return;
      const pairs = Object.entries(rawEnv || {}).map(([key, value]) => ({
        key,
        value,
        revealed: false,
      }));
      if (pairs.length === 0) {
        setEnvPairs([
          { key: 'TOKEN', value: 'bot_token_secret_12345', revealed: false },
          { key: 'DATABASE_URL', value: 'sqlite:///database.sqlite', revealed: false },
        ]);
      } else {
        setEnvPairs(pairs);
      }
    }).catch(() => {
      setEnvPairs([
        { key: 'TOKEN', value: '••••••••', revealed: false },
        { key: 'MONGODB_URI', value: '••••••••', revealed: false },
      ]);
    }).finally(() => {
      if (isMounted) setIsLoadingEnv(false);
    });

    return () => { isMounted = false; };
  }, [bot.id]);

  const toggleReveal = (idx: number) => {
    setEnvPairs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, revealed: !p.revealed } : p))
    );
  };

  const handleAddVariable = () => {
    setEnvPairs((prev) => [...prev, { key: '', value: '', revealed: true }]);
  };

  const handleRemoveVariable = (idx: number) => {
    setEnvPairs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const envObj: Record<string, string> = {};
      for (const p of envPairs) {
        if (p.key.trim()) {
          envObj[p.key.trim()] = p.value;
        }
      }

      await api.updateBotEnv(bot.id, envObj, false);

      // Parse command and args
      const parts = command.trim().split(/\s+/);
      const chosenCommand = parts[0] || 'node';
      const chosenArgs = parts.slice(1);

      await api.updateBot(bot.id, {
        command: chosenCommand,
        args: chosenArgs,
      });

      toast.success('Startup command and environment variables updated');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Startup command */}
        <div className="forge-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Startup command</h3>
          <div className="space-y-1.5 pt-1">
            <label className="text-xs text-slate-400 font-medium">Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Docker image */}
        <div className="forge-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Docker image</h3>
          <div className="space-y-1.5 pt-1">
            <label className="text-xs text-slate-400 font-medium">Image</label>
            <select
              value={dockerImage}
              onChange={(e) => setDockerImage(e.target.value)}
              className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold cursor-pointer"
            >
              <option value="NodeJs 24">NodeJs 24</option>
              <option value="NodeJs 22">NodeJs 22</option>
              <option value="Python 3.12">Python 3.12</option>
            </select>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Advanced: the image used when running this server.
            </p>
          </div>
        </div>
      </div>

      {/* Variables */}
      <div className="forge-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">Variables</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Additional Node packages</label>
            <input
              type="text"
              value={additionalPackages}
              onChange={(e) => setAdditionalPackages(e.target.value)}
              placeholder="e.g. canvas sqlite3"
              className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">JS file</label>
            <input
              type="text"
              value={jsFile}
              onChange={(e) => setJsFile(e.target.value)}
              className="w-full bg-inset text-white text-xs font-mono px-3.5 py-2.5 rounded-lg border border-line focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="forge-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight">Environment</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-line text-slate-500">
                <th className="pb-3 font-semibold w-1/3">Key</th>
                <th className="pb-3 font-semibold">Value</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {envPairs.map((p, idx) => (
                <tr key={idx} className="hover:bg-raised transition-colors">
                  <td className="py-3">
                    <input
                      type="text"
                      value={p.key}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEnvPairs((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, key: val } : item))
                        );
                      }}
                      placeholder="KEY"
                      className="bg-transparent text-white font-bold focus:outline-none w-full"
                    />
                  </td>
                  <td className="py-3">
                    {p.revealed ? (
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEnvPairs((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                          );
                        }}
                        className="bg-inset text-slate-200 px-2 py-1 rounded border border-line focus:outline-none w-full max-w-sm"
                      />
                    ) : (
                      <span className="text-slate-500 tracking-widest font-mono">
                        ••••••••••••••••
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleReveal(idx)}
                      className="text-gold hover:underline font-medium cursor-pointer"
                    >
                      {p.revealed ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddVariable}
            className="forge-btn-dark text-xs py-2 px-4"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add variable</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="forge-btn-primary text-xs py-2 px-5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
