'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  File,
  FileCode,
  FileText,
  FileJson,
  Archive,
  Lock,
  Plus,
  FolderPlus,
  UploadCloud,
  RefreshCw,
  Edit3,
  Trash2,
  ChevronRight,
  Home,
  Search,
  Loader2,
  AlertCircle,
  HardDrive,
  CornerLeftUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { BotFileItem } from '@/lib/types';
import { CodeEditorModal } from './CodeEditorModal';
import { CreateModal } from './CreateModal';
import { RenameModal } from './RenameModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { UploadModal } from './UploadModal';
import { ExtractModal } from './ExtractModal';

interface FileManagerProps {
  botId: string;
  botName: string;
  botPath: string;
}

export function FileManager({ botId, botName, botPath }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<BotFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [editorFile, setEditorFile] = useState<{ path: string; name: string } | null>(null);
  const [createType, setCreateType] = useState<'file' | 'folder' | null>(null);
  const [renameTarget, setRenameTarget] = useState<BotFileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BotFileItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [extractTarget, setExtractTarget] = useState<{ path: string; name: string } | null>(null);
  const [isDirectExtractOpen, setIsDirectExtractOpen] = useState(false);

  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listFiles(botId, path);
      setItems(data?.items || []);
      setCurrentPath(data?.currentPath || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load directory contents.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.listFiles(botId, currentPath);
        if (isMounted) {
          setItems(data?.items || []);
          setCurrentPath(data?.currentPath || '');
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load directory contents.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [currentPath, botId]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleGoUp = () => {
    const parts = (currentPath || '').split('/').filter(Boolean);
    if (parts.length <= 1) {
      setCurrentPath('');
    } else {
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
  };

  const handleItemClick = (item: BotFileItem) => {
    if (item.isDirectory) {
      handleNavigate(item.path);
    } else if (item.isSensitive) {
      setError(`Access denied: "${item.name}" is a protected security credential or configuration file.`);
    } else if (item.isArchive) {
      setExtractTarget({ path: item.path, name: item.name });
    } else {
      setEditorFile({ path: item.path, name: item.name });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getFileIcon = (item: BotFileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/10 shrink-0" />;
    }
    if (item.isSensitive) {
      return <Lock className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (item.isArchive) {
      return <Archive className="w-4 h-4 text-indigo-400 shrink-0" />;
    }

    const ext = (item.extension || '').toLowerCase();
    if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    if (['.json'].includes(ext)) {
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['.md', '.txt', '.log', '.yml', '.yaml'].includes(ext)) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const pathSegments = (currentPath || '').split('/').filter(Boolean);

  const filteredItems = (items || []).filter(i =>
    (i?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* File Manager Toolbar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121722] p-3 rounded-lg border border-[#1E273A]">
        {/* Breadcrumb Path & Up Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-slate-300 py-0.5">
          {currentPath && (
            <button
              onClick={handleGoUp}
              title="Go up one folder level"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-300 border border-[#232E44] transition-colors cursor-pointer mr-1"
            >
              <CornerLeftUp className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-mono">Up</span>
            </button>
          )}

          <button
            onClick={() => handleNavigate('')}
            className="flex items-center gap-1 hover:text-white px-2 py-1 rounded-md hover:bg-[#182030] transition-colors cursor-pointer"
            title="Root Directory"
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold font-mono">root</span>
          </button>

          {pathSegments.map((segment, idx) => {
            const segmentPath = pathSegments.slice(0, idx + 1).join('/');
            const isLast = idx === pathSegments.length - 1;

            return (
              <React.Fragment key={segmentPath}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => handleNavigate(segmentPath)}
                  className={`px-2 py-1 rounded-md transition-colors truncate max-w-[140px] font-mono cursor-pointer ${
                    isLast
                      ? 'text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-[#182030]'
                  }`}
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-file-new-file"
            onClick={() => setCreateType('file')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New File</span>
          </button>

          <button
            id="btn-file-new-folder"
            onClick={() => setCreateType('folder')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>

          <button
            id="btn-file-upload"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            id="btn-file-extract-direct"
            onClick={() => setIsDirectExtractOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Extract ZIP</span>
          </button>

          <button
            id="btn-file-refresh"
            onClick={() => fetchFiles(currentPath)}
            disabled={isLoading}
            className="p-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-slate-300 hover:text-white border border-[#232E44] transition-colors cursor-pointer"
            title="Refresh folder contents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs underline hover:text-rose-300 ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Location Bar */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter files in current folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#121722] border border-[#1E273A] text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span className="truncate max-w-sm">{botPath}/{currentPath}</span>
        </div>
      </div>

      {/* Files List Table */}
      <div className="flex-1 bg-[#121722] rounded-lg border border-[#1E273A] overflow-hidden flex flex-col min-h-[380px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2 text-slate-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">Reading directory...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3 text-slate-400">
            <div className="p-3.5 rounded-lg bg-[#182030] border border-[#232E44] text-slate-400">
              <Folder className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {searchQuery ? 'No matching files found' : 'This directory is empty'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              {searchQuery
                ? 'Try adjusting your search filter'
                : 'Upload source files or create a new file to get started.'}
            </p>
            {!searchQuery && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Upload Files
                </button>
                <button
                  onClick={() => setCreateType('file')}
                  className="px-3 py-1.5 rounded-md bg-[#182030] hover:bg-[#202B40] text-white text-xs font-medium border border-[#232E44] cursor-pointer"
                >
                  Create File
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E273A] bg-[#0E131E] text-slate-400 font-semibold font-mono select-none">
                  <th className="py-2.5 px-3.5">Name</th>
                  <th className="py-2.5 px-3.5 w-28">Size</th>
                  <th className="py-2.5 px-3.5 w-44 hidden md:table-cell">Last Modified</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`group hover:bg-[#161D2B] transition-colors cursor-pointer ${
                      item.isSensitive ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Name Column */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item)}
                        <span className="font-mono text-slate-200 group-hover:text-white truncate">
                          {item.name}
                        </span>

                        {/* Sensitive File Badge */}
                        {item.isSensitive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Lock className="w-2.5 h-2.5" />
                            Protected
                          </span>
                        )}

                        {/* Archive Badge */}
                        {item.isArchive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Archive
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Size Column */}
                    <td className="py-2.5 px-3.5 text-slate-400 font-mono text-[11px]">
                      {item.isDirectory ? `${item.itemsCount || 0} items` : formatFileSize(item.size)}
                    </td>

                    {/* Last Modified Column */}
                    <td className="py-2.5 px-3.5 text-slate-400 font-mono text-[11px] hidden md:table-cell">
                      {formatDate(item.modifiedAt)}
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {item.isArchive && (
                          <button
                            onClick={() => setExtractTarget({ path: item.path, name: item.name })}
                            title="Extract Archive"
                            className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!item.isDirectory && !item.isSensitive && (
                          <button
                            onClick={() => setEditorFile({ path: item.path, name: item.name })}
                            title="Edit file"
                            className="p-1 rounded hover:bg-[#1E273A] text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setRenameTarget(item)}
                          title="Rename"
                          className="p-1 rounded hover:bg-[#1E273A] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Item Count */}
        <div className="px-3.5 py-2 bg-[#0E131E] border-t border-[#1E273A] text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>{filteredItems.length} item(s)</span>
          <span className="text-slate-500 truncate max-w-sm">{botPath}</span>
        </div>
      </div>

      {/* Code Editor Modal */}
      <CodeEditorModal
        botId={botId}
        file={editorFile}
        isOpen={!!editorFile}
        onClose={() => setEditorFile(null)}
        onSaved={() => fetchFiles(currentPath)}
      />

      {/* Create Modal */}
      {createType && (
        <CreateModal
          botId={botId}
          parentPath={currentPath}
          type={createType}
          isOpen={!!createType}
          onClose={() => setCreateType(null)}
          onCreated={() => fetchFiles(currentPath)}
        />
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <RenameModal
          botId={botId}
          item={renameTarget}
          isOpen={!!renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={() => fetchFiles(currentPath)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          botId={botId}
          item={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => fetchFiles(currentPath)}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        botId={botId}
        destinationPath={currentPath}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => fetchFiles(currentPath)}
      />

      {/* Extract Modal */}
      <ExtractModal
        botId={botId}
        destinationPath={currentPath}
        existingArchive={extractTarget}
        isOpen={!!extractTarget || isDirectExtractOpen}
        onClose={() => {
          setExtractTarget(null);
          setIsDirectExtractOpen(false);
        }}
        onExtracted={() => fetchFiles(currentPath)}
      />
    </div>
  );
}
