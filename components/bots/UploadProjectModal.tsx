"use client";

import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileCode2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface UploadProjectModalProps {
  botId: string;
  botName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadProjectModal({
  botId,
  botName,
  isOpen,
  onClose,
  onSuccess,
}: UploadProjectModalProps) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [runInstall, setRunInstall] = useState(true);
  const [restart, setRestart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith(".zip")) {
        setFile(selected);
        setError(null);
      } else {
        setError("Please select a valid .zip archive file.");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".zip")) {
        setFile(dropped);
        setError(null);
      } else {
        setError("Please drop a valid .zip archive file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a .zip project archive to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.uploadBotProject(botId, file, runInstall, restart);
      toast.success(
        `Extracted ${res.extractedCount} file(s) into ${botName}.`,
        "Project Deployed",
      );
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload project.";
      setError(msg);
      toast.error(msg, "Upload Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg bg-[#0E121A] border border-[#1E273A] rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131926] border-b border-[#1E273A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Upload Project to {botName}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Deploy full project archive (.zip) directly into bot root
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
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
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-[#222D40] hover:border-indigo-500/50 bg-[#0B0E14]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-white">
              Click or drag & drop project .zip here
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Safe extraction with Zip-Slip defenses
            </p>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="p-3 rounded-lg bg-[#121724] border border-[#1E273A] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-white font-semibold truncate">
                  {file.name}
                </span>
                <span className="text-slate-400 text-[11px] shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Execution Options */}
          <div className="space-y-2 pt-1 font-mono">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={runInstall}
                onChange={(e) => setRunInstall(e.target.checked)}
                className="w-4 h-4 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
              />
              <span>
                Run <code className="text-indigo-300">npm install</code> /{" "}
                <code className="text-indigo-300">pip install</code> after
                extract
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={restart}
                onChange={(e) => setRestart(e.target.checked)}
                className="w-4 h-4 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
              />
              <span>Restart bot automatically once deployed</span>
            </label>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-deploy-project-submit"
              type="button"
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>
                {isLoading ? "Deploying Project..." : "Deploy Project"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
