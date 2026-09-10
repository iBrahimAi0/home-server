'use client';

import React, { useState } from 'react';
import { X, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface RenameModalProps {
  botId: string;
  item: { path: string; name: string; isDirectory: boolean } | null;
  isOpen: boolean;
  onClose: () => void;
  onRenamed: () => void;
}

export function RenameModal({ botId, item, isOpen, onClose, onRenamed }: RenameModalProps) {
  const [newName, setNewName] = useState(item?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentVal = newName || item.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = currentVal.trim();
    if (!trimmed || trimmed === item.name) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.renameEntity(botId, item.path, trimmed);
      onRenamed();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rename item.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-md bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Rename {item.isDirectory ? 'Folder' : 'File'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              New Name
            </label>
            <input
              id="input-rename-name"
              type="text"
              required
              autoFocus
              value={currentVal}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Current: {item.name}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-rename-submit"
              type="submit"
              disabled={isLoading || !currentVal.trim() || currentVal.trim() === item.name}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
