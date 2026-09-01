'use client';

import React, { useState } from 'react';
import { X, FilePlus, FolderPlus, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface CreateModalProps {
  botId: string;
  parentPath: string;
  type: 'file' | 'folder';
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateModal({ botId, parentPath, type, isOpen, onClose, onCreated }: CreateModalProps) {
  const [name, setName] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'file') {
        await api.createFile(botId, parentPath, name.trim(), initialContent);
      } else {
        await api.createFolder(botId, parentPath, name.trim());
      }
      setName('');
      setInitialContent('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to create ${type}.`);
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
              {type === 'file' ? <FilePlus className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <h3 className="font-semibold text-white text-sm">
              {type === 'file' ? 'Create New File' : 'Create New Folder'}
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
              {type === 'file' ? 'File Name' : 'Folder Name'}
            </label>
            <input
              id="input-create-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'file' ? 'e.g. config.json or bot.js' : 'e.g. commands or utils'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-white text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target location: <span className="font-mono text-purple-300">/{parentPath || 'root'}</span>
            </p>
          </div>

          {type === 'file' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Content (Optional)
              </label>
              <textarea
                id="input-create-content"
                rows={4}
                value={initialContent}
                onChange={(e) => setInitialContent(e.target.value)}
                placeholder="// Initial file content..."
                className="w-full p-3 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-white font-mono text-xs focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-400 resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-create-submit"
              type="submit"
              disabled={isLoading || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{type === 'file' ? 'Create File' : 'Create Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
