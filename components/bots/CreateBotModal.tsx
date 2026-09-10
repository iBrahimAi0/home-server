<<<<<<< HEAD
"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Bot,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  Layers,
  Code,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  FileCode2,
  Eye,
  EyeOff,
  FolderCode,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
=======
'use client';

import React, { useState } from 'react';
import { X, Bot, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface EnvRow {
  key: string;
  value: string;
<<<<<<< HEAD
  isSecret?: boolean;
=======
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
<<<<<<< HEAD
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SourceType = "template" | "upload" | "empty";

const STARTER_TEMPLATES = [
  {
    id: "discordjs",
    name: "Discord.js (v14)",
    tag: "Node.js",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description:
      "Modern Discord.js v14 client with slash commands, ping latency, and event handlers.",
    command: "node",
    args: "index.js",
    defaultEnv: [
      { key: "DISCORD_TOKEN", value: "", isSecret: true },
      { key: "CLIENT_ID", value: "", isSecret: false },
      { key: "PREFIX", value: "!", isSecret: false },
    ],
  },
  {
    id: "discordpy",
    name: "Discord.py (v2)",
    tag: "Python 3",
    tagColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    description:
      "Python 3 bot using discord.py with hybrid command tree and prefix commands.",
    command: "python3",
    args: "bot.py",
    defaultEnv: [
      { key: "DISCORD_TOKEN", value: "", isSecret: true },
      { key: "PREFIX", value: "!", isSecret: false },
    ],
  },
  {
    id: "typescript",
    name: "TypeScript Bot",
    tag: "TypeScript",
    tagColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    description:
      "Discord.js v14 configured with TypeScript compilation and ts-node dev server.",
    command: "npm",
    args: "start",
    defaultEnv: [
      { key: "DISCORD_TOKEN", value: "", isSecret: true },
      { key: "PREFIX", value: "!", isSecret: false },
    ],
  },
  {
    id: "minimal",
    name: "Minimal Daemon",
    tag: "JavaScript",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description:
      "Lightweight standalone Node.js heartbeat service for custom bot routines.",
    command: "node",
    args: "index.js",
    defaultEnv: [
      { key: "SERVICE_NAME", value: "NexusWorker", isSecret: false },
    ],
  },
];

export function CreateBotModal({
  isOpen,
  onClose,
  onCreated,
}: CreateBotModalProps) {
  const toast = useToast();

  // Wizard Step: 1 = Identity, 2 = Source, 3 = Runtime & Secrets
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identity
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [botPath, setBotPath] = useState("");
  const [autoStart, setAutoStart] = useState(false);

  // Step 2: Source
  const [sourceType, setSourceType] = useState<SourceType>("template");
  const [selectedTemplate, setSelectedTemplate] = useState("discordjs");
  const [uploadedZip, setUploadedZip] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Runtime & Environment
  const [command, setCommand] = useState("node");
  const [argsText, setArgsText] = useState("index.js");
  const [installDependencies, setInstallDependencies] = useState(true);
  const [envRows, setEnvRows] = useState<EnvRow[]>([
    { key: "DISCORD_TOKEN", value: "", isSecret: true },
    { key: "CLIENT_ID", value: "", isSecret: false },
    { key: "PREFIX", value: "!", isSecret: false },
  ]);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, boolean>>(
    {},
  );

=======
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CreateBotModal({ isOpen, onClose, onCreated }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [botPath, setBotPath] = useState('');
  const [command, setCommand] = useState('npm');
  const [argsText, setArgsText] = useState('start');
  const [autoStart, setAutoStart] = useState(false);
  const [envRows, setEnvRows] = useState<EnvRow[]>([{ key: '', value: '' }]);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

<<<<<<< HEAD
  const handleNameChange = (val: string) => {
    setName(val);
    if (!idTouched) {
      const generatedId = slugify(val);
      setId(generatedId);
      if (!botPath || botPath.startsWith("bots/")) {
        setBotPath(`bots/${generatedId}`);
      }
    }
  };

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplate(tplId);
    const tpl = STARTER_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setCommand(tpl.command);
      setArgsText(tpl.args);
      setEnvRows(tpl.defaultEnv);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedZip(file);
      // Auto-detect Python vs Node by archive filename
      if (file.name.toLowerCase().includes("py")) {
        setCommand("python3");
        setArgsText("bot.py");
      } else {
        setCommand("npm");
        setArgsText("start");
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".zip")) {
        setUploadedZip(file);
        if (file.name.toLowerCase().includes("py")) {
          setCommand("python3");
          setArgsText("bot.py");
        } else {
          setCommand("npm");
          setArgsText("start");
        }
      } else {
        setError("Please drop a valid .zip archive file.");
      }
    }
  };

  const handleEnvRowChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setEnvRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addEnvRow = () =>
    setEnvRows((prev) => [...prev, { key: "", value: "", isSecret: false }]);
  const removeEnvRow = (index: number) =>
    setEnvRows((prev) => prev.filter((_, i) => i !== index));
  const toggleSecretVisibility = (index: number) => {
    setVisibleSecrets((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const reset = () => {
    setStep(1);
    setName("");
    setId("");
    setIdTouched(false);
    setDescription("");
    setBotPath("");
    setAutoStart(false);
    setSourceType("template");
    setSelectedTemplate("discordjs");
    setUploadedZip(null);
    setCommand("node");
    setArgsText("index.js");
    setInstallDependencies(true);
    setEnvRows([
      { key: "DISCORD_TOKEN", value: "", isSecret: true },
      { key: "CLIENT_ID", value: "", isSecret: false },
      { key: "PREFIX", value: "!", isSecret: false },
    ]);
    setVisibleSecrets({});
=======
  const handleNameChange = (value: string) => {
    setName(value);
    if (!idTouched) {
      setId(slugify(value));
    }
  };

  const handleEnvRowChange = (index: number, field: 'key' | 'value', value: string) => {
    setEnvRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addEnvRow = () => setEnvRows((prev) => [...prev, { key: '', value: '' }]);
  const removeEnvRow = (index: number) => setEnvRows((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setName('');
    setId('');
    setIdTouched(false);
    setDescription('');
    setBotPath('');
    setCommand('npm');
    setArgsText('start');
    setAutoStart(false);
    setEnvRows([{ key: '', value: '' }]);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

<<<<<<< HEAD
  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      const cleanId = slugify(id);
      if (!cleanId) {
        setError(
          "A valid Bot ID is required (letters, numbers, dashes, underscores).",
        );
        return;
      }
      if (!name.trim()) {
        setError("Display name is required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (sourceType === "upload" && !uploadedZip) {
        setError("Please select a project .zip archive to upload.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = slugify(id);
    if (!cleanId || !name.trim()) {
      setError("Bot name and ID are required.");
=======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = slugify(id);
    if (!cleanId) {
      setError('A valid Bot ID is required (letters, numbers, dashes, underscores).');
      return;
    }
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!botPath.trim()) {
      setError('Server directory path is required.');
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
<<<<<<< HEAD
      const envObj: Record<string, string> = {};
      for (const row of envRows) {
        if (row.key.trim()) {
          envObj[row.key.trim()] = row.value;
=======
      const env: Record<string, string> = {};
      for (const row of envRows) {
        if (row.key.trim()) {
          env[row.key.trim()] = row.value;
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
        }
      }

      const args = argsText
        .split(/\s+/)
        .map((a) => a.trim())
        .filter(Boolean);

      await api.createBot({
        id: cleanId,
        name: name.trim(),
        description: description.trim() || undefined,
<<<<<<< HEAD
        path: botPath.trim() || undefined,
        command: command.trim() || "npm",
        args: args.length > 0 ? args : ["start"],
        autoStart,
        env: envObj,
        template: sourceType === "template" ? selectedTemplate : undefined,
        installDependencies: installDependencies,
        projectArchive:
          sourceType === "upload" && uploadedZip ? uploadedZip : undefined,
      });

      toast.success(
        `Bot "${name.trim()}" created successfully!`,
        "Bot Created",
      );
=======
        path: botPath.trim(),
        command: command.trim() || 'npm',
        args: args.length > 0 ? args : ['start'],
        autoStart,
        env
      });

>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      reset();
      onCreated();
      onClose();
    } catch (err: unknown) {
<<<<<<< HEAD
      const msg = err instanceof Error ? err.message : "Failed to create bot.";
      setError(msg);
      toast.error(msg, "Creation Failed");
=======
      const msg = err instanceof Error ? err.message : 'Failed to create bot.';
      setError(msg);
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
<<<<<<< HEAD
      <div className="flex flex-col w-full max-w-2xl max-h-[92vh] bg-[#0E121A] border border-[#1E273A] rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131926] border-b border-[#1E273A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Create New Discord Bot
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Step {step} of 3:{" "}
                {step === 1
                  ? "Bot Identity"
                  : step === 2
                    ? "Project Source"
                    : "Runtime & Secrets"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
=======
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-[#0E121A] border border-[#1E273A] rounded-lg shadow-2xl overflow-hidden font-sans">
        <div className="flex items-center justify-between px-4 py-3 bg-[#131926] border-b border-[#1E273A] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-xs">
              Create New Bot
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          >
            <X className="w-4 h-4" />
          </button>
        </div>

<<<<<<< HEAD
        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 bg-[#0B0E14] border-b border-[#1E273A] text-xs font-mono select-none">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              step === 1
                ? "text-indigo-400 font-bold bg-[#141A28] border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1C2538] text-[10px]">
              1
            </span>
            <span>Identity</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (name.trim() && id.trim()) setStep(2);
            }}
            disabled={!name.trim() || !id.trim()}
            className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 2
                ? "text-indigo-400 font-bold bg-[#141A28] border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1C2538] text-[10px]">
              2
            </span>
            <span>Source Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (name.trim() && id.trim()) setStep(3);
            }}
            disabled={!name.trim() || !id.trim()}
            className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              step === 3
                ? "text-indigo-400 font-bold bg-[#141A28] border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1C2538] text-[10px]">
              3
            </span>
            <span>Runtime & Secrets</span>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto flex-1"
        >
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
=======
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
              <span>{error}</span>
            </div>
          )}

<<<<<<< HEAD
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Bot Display Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Moderation Bot"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Bot ID (Slug) <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={(e) => {
                      setIdTouched(true);
                      setId(slugify(e.target.value));
                    }}
                    placeholder="e.g. mod-bot"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Primary role: Discord moderation, auto-warn, audit logs"
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Server Directory Path
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={botPath}
                    onChange={(e) => setBotPath(e.target.value)}
                    placeholder="bots/<bot-id> (default auto-placed)"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Defaults to{" "}
                  <code className="text-indigo-300">
                    bots/{id || "&lt;bot-id&gt;"}
                  </code>{" "}
                  on the server. Created automatically if it does not exist.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#121724] border border-[#1E273A]">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 font-mono cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                    className="w-4 h-4 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Auto-start on host boot
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Launch this bot automatically when systemd starts
                      NexusPanel.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: PROJECT SOURCE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Source Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0B0E14] border border-[#1E273A]">
                <button
                  type="button"
                  onClick={() => setSourceType("template")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    sourceType === "template"
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Starter Templates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType("upload")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    sourceType === "upload"
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Project (.ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType("empty")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    sourceType === "empty"
                      ? "bg-indigo-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FolderCode className="w-3.5 h-3.5" />
                  <span>Empty Folder</span>
                </button>
              </div>

              {/* Sub-view: Starter Templates */}
              {sourceType === "template" && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STARTER_TEMPLATES.map((tpl) => {
                      const isSelected = selectedTemplate === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleTemplateSelect(tpl.id)}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-indigo-500/10 border-indigo-500 shadow-md"
                              : "bg-[#0B0E14] border-[#1E273A] hover:border-slate-700 hover:bg-[#111622]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5 text-indigo-400" />
                                {tpl.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${tpl.tagColor}`}
                              >
                                {tpl.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                              {tpl.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#1E273A]/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>
                              Command:{" "}
                              <strong className="text-slate-300">
                                {tpl.command} {tpl.args}
                              </strong>
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <Check className="w-3 h-3" />
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-view: Upload Project (.ZIP) */}
              {sourceType === "upload" && (
                <div className="space-y-3">
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
                      onChange={handleZipChange}
                      className="hidden"
                    />
                    <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Click or drag & drop your bot project archive (.zip)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      ZIP contents will be safely unpacked into the bot
                      directory
                    </p>
                  </div>

                  {uploadedZip && (
                    <div className="p-3 rounded-lg bg-[#121724] border border-[#1E273A] flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-white font-semibold truncate">
                          {uploadedZip.name}
                        </span>
                        <span className="text-slate-400 text-[11px] shrink-0">
                          ({(uploadedZip.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedZip(null)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-view: Empty */}
              {sourceType === "empty" && (
                <div className="p-6 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-center space-y-2">
                  <FolderCode className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-xs font-bold text-white">
                    Clean Working Directory
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Creates an empty directory on the server. You can write
                    files in the File Manager, clone via Git, or upload code at
                    any time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RUNTIME & SECRETS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Command & Args */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Spawn Command
                  </label>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="node / python3 / npm"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                    Arguments
                  </label>
                  <input
                    type="text"
                    value={argsText}
                    onChange={(e) => setArgsText(e.target.value)}
                    placeholder="index.js / bot.py / start"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Auto Dependency Install Toggle */}
              <div className="p-3 rounded-lg bg-[#121724] border border-[#1E273A]">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 font-mono cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={installDependencies}
                    onChange={(e) => setInstallDependencies(e.target.checked)}
                    className="w-4 h-4 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Auto-install dependencies
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Run <code className="text-indigo-300">npm install</code>{" "}
                      or <code className="text-indigo-300">pip install</code>{" "}
                      immediately after project setup.
                    </span>
                  </div>
                </label>
              </div>

              {/* Environment Variables & Secrets Vault */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Environment Variables (.env)
                    </label>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Stored securely in the bot&apos;s runtime environment and
                      .env file
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addEnvRow}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Variable
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {envRows.map((row, index) => {
                    const isVisible = !!visibleSecrets[index];
                    return (
                      <div key={index} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) =>
                            handleEnvRowChange(index, "key", e.target.value)
                          }
                          placeholder="KEY_NAME"
                          className="w-1/3 px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 uppercase"
                        />
                        <div className="relative flex-1">
                          <input
                            type={
                              row.isSecret && !isVisible ? "password" : "text"
                            }
                            value={row.value}
                            onChange={(e) =>
                              handleEnvRowChange(index, "value", e.target.value)
                            }
                            placeholder={
                              row.key === "DISCORD_TOKEN"
                                ? "Paste Discord Bot Token"
                                : "Value"
                            }
                            className="w-full pl-2.5 pr-8 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                          {row.isSecret && (
                            <button
                              type="button"
                              onClick={() => toggleSecretVisibility(index)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                            >
                              {isVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEnvRow(index)}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1E273A] shrink-0 font-sans">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#141A28] border border-[#202A3C] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="btn-create-bot-submit"
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 shadow-md transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isLoading
                      ? "Creating Bot & Project..."
                      : "Finish & Create Bot"}
                  </span>
                </button>
              )}
            </div>
=======
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Display Name
              </label>
              <input
                id="input-bot-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Music Bot"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Bot ID
              </label>
              <input
                id="input-bot-id"
                type="text"
                required
                value={id}
                onChange={(e) => {
                  setIdTouched(true);
                  setId(e.target.value);
                }}
                placeholder="e.g. music-bot"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Description (Optional)
            </label>
            <input
              id="input-bot-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this bot do?"
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Server Directory Path
            </label>
            <input
              id="input-bot-path"
              type="text"
              required
              value={botPath}
              onChange={(e) => setBotPath(e.target.value)}
              placeholder="/home/ibra/home-server/bots/music-bot"
              className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Created automatically on the server if it doesn&apos;t exist yet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Command
              </label>
              <input
                id="input-bot-command"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npm"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Arguments
              </label>
              <input
                id="input-bot-args"
                type="text"
                value={argsText}
                onChange={(e) => setArgsText(e.target.value)}
                placeholder="start"
                className="w-full px-3 py-2 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 font-mono cursor-pointer select-none">
            <input
              id="checkbox-bot-autostart"
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
            />
            <span>Auto-start this bot when the server boots</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Environment Variables (Optional)
              </label>
              <button
                type="button"
                onClick={addEnvRow}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Variable
              </button>
            </div>
            <div className="space-y-1.5">
              {envRows.map((row, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleEnvRowChange(index, 'key', e.target.value)}
                    placeholder="DISCORD_TOKEN"
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleEnvRowChange(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvRow(index)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E273A]">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A2232] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-create-bot-submit"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Bot</span>
            </button>
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
          </div>
        </form>
      </div>
    </div>
  );
}
