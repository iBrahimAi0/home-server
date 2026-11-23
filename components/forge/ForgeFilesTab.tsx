'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BotData, BotFileItem } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { CodeEditorModal } from '@/components/files/CodeEditorModal';
import { CreateModal } from '@/components/files/CreateModal';
import { UploadModal } from '@/components/files/UploadModal';
import { Loader2, Folder, FileText, Search } from 'lucide-react';

interface ForgeFilesTabProps {
  bot: BotData;
}

export function ForgeFilesTab({ bot }: ForgeFilesTabProps) {
  const toast = useToast();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<BotFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getFiles(bot.id, currentPath);
      setFiles(res.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load files';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [bot.id, currentPath, toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleOpenFolder = (folderName: string) => {
    setCurrentPath((prev) => (prev ? `${prev}/${folderName}` : folderName));
  };

  const handleNavigateBreadcrumb = (index: number, parts: string[]) => {
    if (index === -1) {
      setCurrentPath('');
    } else {
      setCurrentPath(parts.slice(0, index + 1).join('/'));
    }
  };

  const pathParts = currentPath ? currentPath.split('/') : [];

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Top Toolbar & Breadcrumbs */}
      <div className="forge-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 overflow-x-auto">
          <span className="text-slate-500">/</span>
          <button
            onClick={() => handleNavigateBreadcrumb(-1, [])}
            className="hover:text-white transition-colors cursor-pointer"
          >
            home
          </button>
          <span className="text-slate-500">/</span>
          <button
            onClick={() => handleNavigateBreadcrumb(-1, [])}
            className="hover:text-white transition-colors cursor-pointer"
          >
            container
          </button>
          <span className="text-slate-500">/</span>

          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <button
                onClick={() => handleNavigateBreadcrumb(idx, pathParts)}
                className="hover:text-white transition-colors cursor-pointer text-slate-200"
              >
                {part}
              </button>
              <span className="text-slate-500">/</span>
            </React.Fragment>
          ))}
        </div>

        {/* Action Buttons & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="bg-[#0D0E12] text-white text-xs font-mono pl-8 pr-3 py-1.5 rounded-lg border border-[#1E2027] focus:outline-none focus:border-[#F5A623] w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => {
              setCreateType('folder');
              setIsCreateOpen(true);
            }}
            className="forge-btn-dark text-xs py-1.5 px-3"
          >
            <span>New folder</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="forge-btn-dark text-xs py-1.5 px-3"
          >
            <span>Upload</span>
          </button>

          <button
            onClick={() => {
              toast.info('Syncing from GitHub...');
              api.pullGit(bot.id).then(() => {
                toast.success('Synced repository files');
                fetchFiles();
              }).catch(() => toast.error('Sync failed'));
            }}
            className="forge-btn-dark text-xs py-1.5 px-3"
          >
            <span>Sync from GitHub</span>
          </button>

          <button
            onClick={() => {
              setCreateType('file');
              setIsCreateOpen(true);
            }}
            className="forge-btn-primary text-xs py-1.5 px-3.5"
          >
            <span>New file</span>
          </button>
        </div>
      </div>

      {/* Files Table Card */}
      <div className="forge-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight">Files</h3>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
            <span>Reading container directory...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-500">
            Empty directory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2027] text-slate-500 font-mono">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold">Modified</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1E24] font-mono">
                {filteredFiles.map((file) => {
                  const isDir = file.isDirectory;

                  return (
                    <tr key={file.path} className="hover:bg-[#181A20] transition-colors">
                      {/* Name */}
                      <td className="py-3 flex items-center gap-2.5 text-slate-200">
                        {isDir ? (
                          <Folder className="w-4 h-4 text-[#F5A623] fill-current" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                        <span
                          onClick={() => isDir ? handleOpenFolder(file.name) : setEditingFile({ path: file.path, name: file.name })}
                          className={`cursor-pointer hover:underline ${isDir ? 'font-semibold text-white' : 'text-slate-300'}`}
                        >
                          {file.name}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 text-slate-400">
                        {isDir ? '—' : file.sizeFormatted || (file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`)}
                      </td>

                      {/* Modified */}
                      <td className="py-3 text-slate-400">
                        {(file.modifiedAt || file.modified)
                          ? new Date(file.modifiedAt || file.modified!).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3 text-right">
                        {isDir ? (
                          <button
                            onClick={() => handleOpenFolder(file.name)}
                            className="text-[#F5A623] hover:underline font-medium cursor-pointer"
                          >
                            Open
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingFile({ path: file.path, name: file.name })}
                            className="text-[#F5A623] hover:underline font-medium cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Editor Modal */}
      <CodeEditorModal
        botId={bot.id}
        file={editingFile}
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        onSaved={() => {
          fetchFiles();
        }}
      />

      {/* Create File / Folder Modal */}
      <CreateModal
        botId={bot.id}
        parentPath={currentPath}
        type={createType}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          fetchFiles();
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        botId={bot.id}
        destinationPath={currentPath}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {
          fetchFiles();
        }}
      />
    </div>
  );
}
