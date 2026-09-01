'use client';

import React, { useState } from 'react';
import { X, Archive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ExtractModalProps {
  botId: string;
  destinationPath: string;
  existingArchive?: { path: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onExtracted: () => void;
}

export function ExtractModal({ botId, destinationPath, existingArchive, isOpen, onClose, onExtracted }: ExtractModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetSubdir, setTargetSubdir] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!existingArchive && !selectedFile) {
      setError('Please select an archive to extract.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const finalDest = targetSubdir.trim()
        ? `${destinationPath ? destinationPath + '/' : ''}${targetSubdir.trim()}`
        : destinationPath;

      await api.extractArchive(
        botId,
        finalDest,
        selectedFile || undefined,
        existingArchive ? existingArchive.path : undefined
      );

      onExtracted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Archive extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-md bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131B2E] border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Archive className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Extract Archive</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {existingArchive ? (
            <div className="p-3 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-xs">
              <span className="text-slate-400 block mb-1">Archive to extract:</span>
              <div className="font-mono text-purple-300 font-semibold truncate flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-purple-400" />
                {existingArchive.name}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Upload Archive (.zip / .rar)
              </label>
              <input
                type="file"
                accept=".zip,.rar"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Extract Subfolder (Optional)
            </label>
            <input
              type="text"
              value={targetSubdir}
              onChange={(e) => setTargetSubdir(e.target.value)}
              placeholder="e.g. extracted_files (leave empty for current folder)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Destination: <span className="font-mono text-purple-300">/{destinationPath || 'root'}{targetSubdir ? `/${targetSubdir}` : ''}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[11px] text-purple-300/90 leading-relaxed">
            Archive extraction is automatically protected against Zip-Slip traversal attacks, Zip bombs, and sensitive file overwrites.
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
              id="btn-extract-submit"
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || (!existingArchive && !selectedFile)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              <span>{isExtracting ? 'Extracting...' : 'Extract Archive'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
