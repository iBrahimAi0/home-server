'use client';

import React, { useState } from 'react';
import { X, Bot, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface EnvRow {
  key: string;
  value: string;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateBotModal({ isOpen, onClose, onCreated }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [botPath, setBotPath] = useState('');
  const [command, setCommand] = useState('npm');
  const [argsText, setArgsText] = useState('start');
  const [autoStart, setAutoStart] = useState(false);
  const [envRows, setEnvRows] = useState<EnvRow[]>([{ key: '', value: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!idTouched) {
      setId(slugify(value));
    }
  };

  const handleEnvRowChange = (index: number, field: 'key' | 'value', value: string) => {
    setEnvRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addEnvRow = () => setEnvRows((prev) => [...prev, { key: '', value: '' }]);
  const removeEnvRow = (index: number) => setEnvRows((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setName('');
    setId('');
    setIdTouched(false);
    setDescription('');
    setBotPath('');
    setCommand('npm');
    setArgsText('start');
    setAutoStart(false);
    setEnvRows([{ key: '', value: '' }]);
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = slugify(id);
    if (!cleanId) {
      setError('A valid Bot ID is required (letters, numbers, dashes, underscores).');
      return;
    }
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!botPath.trim()) {
      setError('Server directory path is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const env: Record<string, string> = {};
      for (const row of envRows) {
        if (row.key.trim()) {
          env[row.key.trim()] = row.value;
        }
      }

      const args = argsText
        .split(/\s+/)
        .map((a) => a.trim())
        .filter(Boolean);

      await api.createBot({
        id: cleanId,
        name: name.trim(),
        description: description.trim() || undefined,
        path: botPath.trim(),
        command: command.trim() || 'npm',
        args: args.length > 0 ? args : ['start'],
        autoStart,
        env
      });

      reset();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create bot.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Create New Bot
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Display Name
              </label>
              <input
                id="input-bot-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Music Bot"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Bot ID
              </label>
              <input
                id="input-bot-id"
                type="text"
                required
                value={id}
                onChange={(e) => {
                  setIdTouched(true);
                  setId(e.target.value);
                }}
                placeholder="e.g. music-bot"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Description (Optional)
            </label>
            <input
              id="input-bot-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this bot do?"
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Server Directory Path
            </label>
            <input
              id="input-bot-path"
              type="text"
              required
              value={botPath}
              onChange={(e) => setBotPath(e.target.value)}
              placeholder="/home/ibra/home-server/bots/music-bot"
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Created automatically on the server if it doesn&apos;t exist yet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Command
              </label>
              <input
                id="input-bot-command"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npm"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Arguments
              </label>
              <input
                id="input-bot-args"
                type="text"
                value={argsText}
                onChange={(e) => setArgsText(e.target.value)}
                placeholder="start"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 font-mono cursor-pointer select-none">
            <input
              id="checkbox-bot-autostart"
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
            />
            <span>Auto-start this bot when the server boots</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Environment Variables (Optional)
              </label>
              <button
                type="button"
                onClick={addEnvRow}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Variable
              </button>
            </div>
            <div className="space-y-1.5">
              {envRows.map((row, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleEnvRowChange(index, 'key', e.target.value)}
                    placeholder="DISCORD_TOKEN"
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleEnvRowChange(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvRow(index)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-create-bot-submit"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Bot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
