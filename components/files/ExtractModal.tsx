'use client';

import React, { useState, useEffect } from 'react';
import { X, Archive, Loader2, AlertCircle, Eye, ShieldCheck, Folder } from 'lucide-react';
import { api } from '@/lib/api';
import { ZipArchiveInspection } from '@/lib/types';

interface ExtractModalProps {
  botId: string;
  destinationPath: string;
  existingArchive?: { path: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onExtracted: () => void;
}

export function ExtractModal({
  botId,
  destinationPath,
  existingArchive,
  isOpen,
  onClose,
  onExtracted
}: ExtractModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetSubdir, setTargetSubdir] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspection, setInspection] = useState<ZipArchiveInspection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setTargetSubdir('');
      setInspection(null);
      setError(null);
      return;
    }

    // If existing archive is provided, inspect it automatically for preview
    if (existingArchive && existingArchive.name.endsWith('.zip')) {
      handleInspect(null, existingArchive.path);
    }
  }, [isOpen, existingArchive]);

  if (!isOpen) return null;

  const handleInspect = async (file?: File | null, existingPath?: string) => {
    setIsInspecting(true);
    setError(null);
    try {
      const data = await api.inspectArchive(botId, file || undefined, existingPath);
      setInspection(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect archive.';
      setError(msg);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (f.name.endsWith('.zip')) {
        handleInspect(f, undefined);
      } else {
        setInspection(null);
      }
    }
  };

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archive extraction failed.';
      setError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Archive className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">Extract Archive</h3>
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

          {/* Existing or File Upload Source */}
          {existingArchive ? (
            <div className="p-3 rounded-md bg-[#0B0E14] border border-[#1E273A] text-xs">
              <span className="text-slate-400 block mb-1 font-mono text-[11px]">Selected Archive:</span>
              <div className="font-mono text-indigo-300 font-semibold truncate flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-indigo-400" />
                {existingArchive.name}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Upload Archive (.zip / .rar)
              </label>
              <input
                type="file"
                accept=".zip,.rar"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
              />
            </div>
          )}

          {/* Archive Inspection Preview */}
          {isInspecting ? (
            <div className="p-3 rounded-md bg-[#0B0E14] border border-[#1E273A] flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Inspecting archive contents...</span>
            </div>
          ) : inspection ? (
            <div className="p-3 rounded-md bg-[#0B0E14] border border-[#1E273A] text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1.5 border-b border-[#1A2232]">
                <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  Archive Preview
                </span>
                <span>{inspection.fileCount} entries ({(inspection.totalUncompressedBytes / 1024 / 1024).toFixed(1)} MB uncompressed)</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300 pr-1">
                {inspection.entries.slice(0, 10).map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between truncate">
                    <span className="truncate">{e.name}</span>
                    <span className="text-slate-500 shrink-0 ml-2">
                      {e.isDirectory ? '<DIR>' : `${Math.round(e.size / 1024)}KB`}
                    </span>
                  </div>
                ))}
                {inspection.entries.length > 10 && (
                  <div className="text-slate-500 text-[10px] italic">
                    + {inspection.entries.length - 10} more entries...
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Destination Subfolder Option */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Destination Subfolder (Optional)
            </label>
            <input
              type="text"
              value={targetSubdir}
              onChange={(e) => setTargetSubdir(e.target.value)}
              placeholder="e.g. commands (leave empty to extract in current folder)"
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Target: /{destinationPath || 'root'}{targetSubdir ? `/${targetSubdir}` : ''}
            </p>
          </div>

          {/* Security & Lifecycle Notice */}
          <div className="p-2.5 rounded-md bg-[#121824] border border-[#1E273A] text-[11px] text-slate-400 leading-relaxed font-mono flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span>Zip-Slip and Zip Bomb defenses active. Extracted files will <strong>not</strong> automatically execute or restart the bot.</span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-extract-submit"
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || (!existingArchive && !selectedFile)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
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
