'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface UploadModalProps {
  botId: string;
  destinationPath: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadModal({ botId, destinationPath, isOpen, onClose, onUploaded }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      await api.uploadFiles(botId, destinationPath, selectedFiles, overwrite);
      setSelectedFiles([]);
      onUploaded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload files.';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-md bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">Upload Bot Files</h3>
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
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-5 border border-dashed rounded-lg cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-[#222D40] hover:border-indigo-500/50 bg-[#0B0E14]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-400 mb-1.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-white">Click or drag files here to upload</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Destination: /{destinationPath || 'root'}
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>Selected ({selectedFiles.length})</span>
                <span>{(totalSize / 1024 / 1024).toFixed(2)} MB total</span>
              </div>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-xs font-mono"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Overwrite Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="checkbox-overwrite"
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 bg-[#0B0E14] border-[#1E273A]"
            />
            <label htmlFor="checkbox-overwrite" className="text-xs text-slate-300 cursor-pointer select-none">
              Replace existing files if duplicate name exists
            </label>
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
              id="btn-upload-submit"
              type="button"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Uploading...' : `Upload (${selectedFiles.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
