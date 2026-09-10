'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface DeleteConfirmModalProps {
  botId: string;
  item: { path: string; name: string; isDirectory: boolean } | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteConfirmModal({ botId, item, isOpen, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await api.deleteEntity(botId, item.path);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-md bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Confirm Delete
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Permanently Delete {item.isDirectory ? 'Folder' : 'File'}?</p>
              <p className="text-amber-200/90 mt-1 font-mono text-[11px]">
                Target: <strong className="text-white">/{item.path}</strong>
              </p>
              {item.isDirectory ? (
                <p className="text-rose-300 mt-1.5 font-medium">
                  Warning: All files, nested scripts, and subdirectories inside this folder will be permanently deleted!
                </p>
              ) : (
                <p className="text-amber-200/80 mt-1">
                  This action cannot be undone.
                </p>
              )}
            </div>
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
              id="btn-delete-confirm"
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
