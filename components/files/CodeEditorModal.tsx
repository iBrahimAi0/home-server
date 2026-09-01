'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, FileCode, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { BotFileContent } from '@/lib/types';

interface CodeEditorModalProps {
  botId: string;
  file: { path: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function CodeEditorModal({ botId, file, isOpen, onClose, onSaved }: CodeEditorModalProps) {
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filePath = file?.path;

  useEffect(() => {
    if (!isOpen || !filePath) return;

    let isMounted = true;
    const fetchFileContent = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
        const data: BotFileContent = await api.readFileContent(botId, filePath);
        if (isMounted) {
          setContent(data.content || '');
          setInitialContent(data.content || '');
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load file content.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFileContent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, filePath, botId]);

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.saveFileContent(botId, file.path, content);
      setInitialContent(content);
      setSuccessMsg('File saved successfully.');
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save file.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = content !== initialContent;

  // Keyboard shortcut Ctrl+S / Cmd+S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Handle tab key in code editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + '  ' + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      setContent(textarea.value);
    }
  };

  if (!isOpen || !file) return null;

  const lines = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-[#0E1526] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131B2E] border-b border-[#1E293B]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">{file.name}</span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Unsaved
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono truncate">{file.path}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                {successMsg}
              </span>
            )}

            <button
              id="btn-editor-save"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save (Ctrl+S)'}</span>
            </button>

            <button
              id="btn-editor-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Editor Body */}
        <div className="flex-1 relative flex overflow-hidden bg-[#0A0E17]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
              <span className="text-sm">Loading file content...</span>
            </div>
          ) : (
            <div className="flex w-full h-full">
              {/* Line Numbers column */}
              <div className="hidden sm:block select-none py-3 px-3 bg-[#0D121F] border-r border-[#1B2438] text-right font-mono text-xs text-slate-400 overflow-hidden min-w-[3.5rem]">
                {lines.map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Text Area Code Editor */}
              <textarea
                id="file-content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 w-full h-full p-3 bg-transparent text-slate-100 font-mono text-xs md:text-sm leading-6 resize-none focus:outline-none focus:ring-0 border-none select-text"
                placeholder="Write code or text here..."
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#131B2E] border-t border-[#1E293B] text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span>Lines: <strong className="text-slate-200">{lines.length}</strong></span>
            <span>Length: <strong className="text-slate-200">{content.length} chars</strong></span>
            <span className="hidden sm:inline">Encoding: <strong className="text-slate-200">UTF-8</strong></span>
          </div>
          <div className="text-slate-400 font-mono">
            Tab size: 2 spaces
          </div>
        </div>
      </div>
    </div>
  );
}
