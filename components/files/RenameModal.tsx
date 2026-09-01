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

  // If closed or no item, return null
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-md bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131B2E] border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">
              Rename {item.isDirectory ? 'Folder' : 'File'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New Name
            </label>
            <input
              id="input-rename-name"
              type="text"
              required
              autoFocus
              value={currentVal}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Current: {item.name}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-rename-submit"
              type="submit"
              disabled={isLoading || !currentVal.trim() || currentVal.trim() === item.name}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
