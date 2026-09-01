'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    } catch (err: any) {
      setError(err.message || 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-lg bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131B2E] border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Upload Files</h3>
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

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragOver
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-[#1E293B] hover:border-purple-500/50 bg-[#0A0E17]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-white">Click or drag files here to upload</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Destination: <span className="font-mono text-purple-300">/{destinationPath || 'root'}</span>
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>Selected Files ({selectedFiles.length})</span>
                <span>{(totalSize / 1024 / 1024).toFixed(2)} MB total</span>
              </div>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0A0E17] border border-[#1E293B] text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-slate-200 truncate font-mono">{file.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="checkbox-overwrite"
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-[#0A0E17] border-[#1E293B]"
            />
            <label htmlFor="checkbox-overwrite" className="text-xs text-slate-300 cursor-pointer select-none">
              Overwrite existing files if names match
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-upload-submit"
              type="button"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
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
