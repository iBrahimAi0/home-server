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
  HardDrive
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

  // Modals state
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
      setItems(data.items || []);
      setCurrentPath(data.currentPath || '');
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
          setItems(data.items || []);
          setCurrentPath(data.currentPath || '');
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

  const handleItemClick = (item: BotFileItem) => {
    if (item.isDirectory) {
      handleNavigate(item.path);
    } else if (item.isSensitive) {
      setError(`Access blocked: "${item.name}" is a protected credential/configuration file.`);
    } else if (item.isArchive) {
      setExtractTarget({ path: item.path, name: item.name });
    } else {
      // Open in code editor
      setEditorFile({ path: item.path, name: item.name });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getFileIcon = (item: BotFileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />;
    }
    if (item.isSensitive) {
      return <Lock className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (item.isArchive) {
      return <Archive className="w-4 h-4 text-purple-400 shrink-0" />;
    }

    const ext = item.extension.toLowerCase();
    if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />;
    }
    if (['.json'].includes(ext)) {
      return <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['.md', '.txt', '.log'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  // Build breadcrumbs
  const pathSegments = currentPath.split('/').filter(Boolean);

  // Filter items by search query
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* File Manager Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E1526] p-3.5 rounded-2xl border border-[#1E293B]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-slate-300 py-1 px-1">
          <button
            onClick={() => handleNavigate('')}
            className="flex items-center gap-1 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Root Directory"
          >
            <Home className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">root</span>
          </button>

          {pathSegments.map((segment, idx) => {
            const segmentPath = pathSegments.slice(0, idx + 1).join('/');
            const isLast = idx === pathSegments.length - 1;

            return (
              <React.Fragment key={segmentPath}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => handleNavigate(segmentPath)}
                  className={`px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors truncate max-w-[140px] ${
                    isLast ? 'text-purple-300 font-semibold bg-purple-500/10' : 'text-slate-300 hover:text-white'
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>New File</span>
          </button>

          <button
            id="btn-file-new-folder"
            onClick={() => setCreateType('folder')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>

          <button
            id="btn-file-upload"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-medium transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
            <span>Upload</span>
          </button>

          <button
            id="btn-file-extract-direct"
            onClick={() => setIsDirectExtractOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Extract Zip</span>
          </button>

          <button
            id="btn-file-refresh"
            onClick={() => fetchFiles(currentPath)}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Refresh folder contents"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs underline hover:text-rose-300 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Location Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter files in folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0E1526] border border-[#1E293B] text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <HardDrive className="w-3.5 h-3.5 text-purple-400" />
          <span className="truncate max-w-sm">{botPath}/{currentPath}</span>
        </div>
      </div>

      {/* Files List Table Container */}
      <div className="flex-1 bg-[#0E1526] rounded-2xl border border-[#1E293B] overflow-hidden flex flex-col min-h-[380px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="text-xs">Reading bot directory...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3 text-slate-400">
            <div className="p-4 rounded-full bg-[#131B2E] border border-[#1E293B] text-slate-400">
              <Folder className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {searchQuery ? 'No matching files found' : 'This folder is empty'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              {searchQuery
                ? 'Try a different search query'
                : 'Upload bot source files or create a new file to get started.'}
            </p>
            {!searchQuery && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm"
                >
                  Upload Files
                </button>
                <button
                  onClick={() => setCreateType('file')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
                >
                  Create index.js
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#111726] text-slate-400 font-semibold select-none">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 w-28">Size</th>
                  <th className="py-3 px-4 w-44 hidden md:table-cell">Last Modified</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172033]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`group hover:bg-[#131B2E]/90 transition-colors cursor-pointer ${
                      item.isSensitive ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Name column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(item)}
                        <span className="font-medium text-slate-200 group-hover:text-white truncate">
                          {item.name}
                        </span>

                        {/* Sensitive File Protection Badge */}
                        {item.isSensitive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Lock className="w-2.5 h-2.5" />
                            Protected
                          </span>
                        )}

                        {/* Archive Badge */}
                        {item.isArchive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Archive
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Size column */}
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {item.isDirectory ? `${item.itemsCount || 0} items` : formatFileSize(item.size)}
                    </td>

                    {/* Last Modified column */}
                    <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                      {formatDate(item.modifiedAt)}
                    </td>

                    {/* Actions column */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {item.isArchive && (
                          <button
                            onClick={() => setExtractTarget({ path: item.path, name: item.name })}
                            title="Extract Archive"
                            className="p-1 rounded-lg hover:bg-purple-600/20 text-slate-400 hover:text-purple-300 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!item.isDirectory && !item.isSensitive && (
                          <button
                            onClick={() => setEditorFile({ path: item.path, name: item.name })}
                            title="Edit file"
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setRenameTarget(item)}
                          title="Rename"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
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
        <div className="px-4 py-2 bg-[#111726] border-t border-[#1E293B] text-[11px] text-slate-400 flex items-center justify-between">
          <span>{filteredItems.length} item(s)</span>
          <span className="font-mono">{botPath}</span>
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
