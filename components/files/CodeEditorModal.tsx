'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileCode, Check, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
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
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const filePath = file?.path;

  useEffect(() => {
    if (!isOpen || !filePath) return;

    let isMounted = true;
    const fetchFileContent = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      setShowUnsavedWarning(false);

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
      setSuccessMsg('File saved to server.');
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

  const handleCloseRequest = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseRequest();
    }
    // Handle tab key
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

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (!isOpen || !file) return null;

  const lines = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A] font-sans">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs font-mono truncate">{file.name}</span>
                {hasUnsavedChanges && (
                  <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate">/{file.path}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {successMsg && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-400 font-mono">
                <Check className="w-3.5 h-3.5" />
                {successMsg}
              </span>
            )}

            <button
              id="btn-editor-save"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs disabled:opacity-50 transition-all cursor-pointer"
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
              onClick={handleCloseRequest}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
              title="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unsaved Warning Confirmation Dialog */}
        {showUnsavedWarning && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-sans">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You have unsaved changes in <strong className="font-mono text-white">{file.name}</strong>. Close without saving?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-2.5 py-1 rounded bg-[#182030] text-slate-300 hover:text-white text-xs border border-[#232E44] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
              >
                Discard & Close
              </button>
            </div>
          </div>
        )}

        {/* Editor Body */}
        <div className="flex-1 relative flex overflow-hidden bg-[#0A0D14]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-slate-400 font-mono">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading file from host...</span>
            </div>
          ) : (
            <div className="flex w-full h-full overflow-hidden">
              {/* Line Numbers Column */}
              <div
                ref={lineNumbersRef}
                className="hidden sm:block select-none py-3 px-3 bg-[#0C0F18] border-r border-[#1B2230] text-right font-mono text-xs text-slate-400 overflow-hidden min-w-[3.5rem] leading-6"
              >
                {lines.map((_, i) => (
                  <div key={i}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code TextArea */}
              <textarea
                ref={textareaRef}
                id="file-content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellCheck={false}
                className="flex-1 w-full h-full p-3 bg-transparent text-slate-100 font-mono text-xs md:text-sm leading-6 resize-none focus:outline-none border-none select-text overflow-y-auto"
                placeholder="Write file content here..."
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#131926] border-t border-[#1E273A] text-[11px] text-slate-400 font-mono select-none">
          <div className="flex items-center gap-4">
            <span>Lines: <strong className="text-slate-200">{lines.length}</strong></span>
            <span>Size: <strong className="text-slate-200">{content.length} bytes</strong></span>
            <span className="hidden sm:inline">Encoding: UTF-8</span>
          </div>
          <div>
            Tab size: 2 spaces
          </div>
        </div>
      </div>
    </div>
  );
}
