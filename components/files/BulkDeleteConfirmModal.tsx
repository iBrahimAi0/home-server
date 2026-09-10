'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface BulkDeleteConfirmModalProps {
  botId: string;
  items: { path: string; name: string; isDirectory: boolean }[];
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function BulkDeleteConfirmModal({ botId, items, isOpen, onClose, onDeleted }: BulkDeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.deleteEntities(botId, items.map(i => i.path));
      const failed = (result?.results || []).filter(r => !r.success);
      if (failed.length > 0) {
        setError(`${failed.length} of ${items.length} item(s) could not be deleted: ${failed.map(f => f.path).join(', ')}`);
      } else {
        onDeleted();
        onClose();
      }
      // Refresh regardless so successfully deleted items disappear from the list
      onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete selected items.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const folderCount = items.filter(i => i.isDirectory).length;
  const fileCount = items.length - folderCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2 text-rose-400">
            <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Delete {items.length} Selected Item{items.length > 1 ? 's' : ''}
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
              <p className="font-semibold text-white">
                Permanently delete {fileCount > 0 && `${fileCount} file${fileCount > 1 ? 's' : ''}`}
                {fileCount > 0 && folderCount > 0 && ' and '}
                {folderCount > 0 && `${folderCount} folder${folderCount > 1 ? 's' : ''}`}?
              </p>
              <p className="text-rose-300 mt-1.5 font-medium">
                This action cannot be undone. Folder contents will be removed recursively.
              </p>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-md bg-[#0B0E14] border border-[#1E273A] divide-y divide-[#182030]">
            {items.map((item) => (
              <div key={item.path} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-mono text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">/{item.path}</span>
              </div>
            ))}
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
              id="btn-bulk-delete-confirm"
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Delete {items.length} Item{items.length > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
