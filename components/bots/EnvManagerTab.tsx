"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  RotateCw,
  FileText,
  Table,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface EnvManagerTabProps {
  botId: string;
  botName: string;
  botStatus: string;
  onRestartRequest?: () => void;
}

interface EnvItem {
  key: string;
  value: string;
}

export function EnvManagerTab({
  botId,
  botName,
  botStatus,
  onRestartRequest,
}: EnvManagerTabProps) {
  const toast = useToast();
  const [envItems, setEnvItems] = useState<EnvItem[]>([]);
  const [rawText, setRawText] = useState("");
  const [isRawMode, setIsRawMode] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [restartOnSave, setRestartOnSave] = useState(botStatus === "online");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEnv = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getBotEnv(botId);
        if (!isMounted) return;
        const items = Object.entries(data).map(([k, v]) => ({
          key: k,
          value: v,
        }));
        setEnvItems(items);
        setRawText(items.map((i) => `${i.key}=${i.value}`).join("\n"));
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load environment variables.";
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchEnv();
    return () => {
      isMounted = false;
    };
  }, [botId]);

  const handleToggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.info(`Copied ${key} to clipboard.`);
  };

  const handleRowChange = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    setEnvItems((prev) => {
      const next = prev.map((row, i) =>
        i === index ? { ...row, [field]: val } : row,
      );
      setRawText(next.map((i) => `${i.key}=${i.value}`).join("\n"));
      return next;
    });
  };

  const addRow = () => {
    setEnvItems((prev) => {
      const next = [...prev, { key: "", value: "" }];
      setRawText(next.map((i) => `${i.key}=${i.value}`).join("\n"));
      return next;
    });
  };

  const removeRow = (index: number) => {
    setEnvItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setRawText(next.map((i) => `${i.key}=${i.value}`).join("\n"));
      return next;
    });
  };

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    const parsed: EnvItem[] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        parsed.push({
          key: trimmed.substring(0, eqIdx).trim(),
          value: trimmed.substring(eqIdx + 1).trim(),
        });
      }
    }
    setEnvItems(parsed);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const envMap: Record<string, string> = {};
    for (const item of envItems) {
      if (item.key && item.key.trim()) {
        envMap[item.key.trim()] = item.value;
      }
    }

    try {
      await api.updateBotEnv(botId, envMap, restartOnSave);
      toast.success(
        "Environment variables updated and synchronized to .env.",
        "Secrets Saved",
      );
      if (restartOnSave && onRestartRequest) {
        onRestartRequest();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save environment variables.";
      setError(msg);
      toast.error(msg, "Save Failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Toggle */}
      <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Environment & Secrets Manager</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                .env Vault
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Securely inject tokens, API keys, and configuration into {botName}
              &apos;s process
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0B0E14] p-0.5 rounded-lg border border-[#1E273A] text-xs font-mono">
            <button
              onClick={() => setIsRawMode(false)}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                !isRawMode
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setIsRawMode(true)}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                isRawMode
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw .env</span>
            </button>
          </div>

          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202B40] text-slate-200 hover:text-white border border-[#232E44] text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Secret</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-mono gap-2 rounded-lg bg-[#121722] border border-[#1E273A]">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs">Reading bot environment & secrets...</span>
        </div>
      ) : isRawMode ? (
        <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-[#1E273A]">
            <span>Raw .env file format (KEY=VALUE per line)</span>
            <span>{envItems.length} entries parsed</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
            rows={12}
            className="w-full p-3 rounded-lg bg-[#0B0E14] border border-[#1E273A] text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
            placeholder="DISCORD_TOKEN=your_token&#10;CLIENT_ID=12345&#10;PREFIX=!"
          />
        </div>
      ) : envItems.length === 0 ? (
        <div className="p-10 rounded-lg bg-[#121722] border border-[#1E273A] text-center font-mono space-y-2">
          <Key className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
          <h4 className="text-xs font-bold text-white">
            No Environment Variables Configured
          </h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click &quot;Add Secret&quot; to configure tokens such as{" "}
            <code className="text-indigo-300">DISCORD_TOKEN</code>.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-[#121722] border border-[#1E273A] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#1E273A] bg-[#0E131E] text-slate-400 font-semibold select-none">
                  <th className="py-2.5 px-4 w-1/3">Variable Key</th>
                  <th className="py-2.5 px-4">Value / Token</th>
                  <th className="py-2.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030]">
                {envItems.map((item, index) => {
                  const isVisible = !!visibleKeys[item.key];
                  const isToken =
                    item.key.toLowerCase().includes("token") ||
                    item.key.toLowerCase().includes("secret") ||
                    item.key.toLowerCase().includes("pass") ||
                    item.key.toLowerCase().includes("key");

                  return (
                    <tr
                      key={index}
                      className="hover:bg-[#151C2A] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) =>
                            handleRowChange(index, "key", e.target.value)
                          }
                          placeholder="KEY_NAME"
                          className="w-full px-2.5 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="relative flex items-center">
                          <input
                            type={isToken && !isVisible ? "password" : "text"}
                            value={item.value}
                            onChange={(e) =>
                              handleRowChange(index, "value", e.target.value)
                            }
                            placeholder="value"
                            className="w-full pl-2.5 pr-8 py-1.5 rounded-md bg-[#0B0E14] border border-[#1E273A] text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                          {isToken && (
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(item.key)}
                              className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                              title={isVisible ? "Hide token" : "Show token"}
                            >
                              {isVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.key, item.value)}
                            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1E273A] transition-colors cursor-pointer"
                            title="Copy secret"
                          >
                            {copiedKey === item.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security note & Save actions */}
      <div className="rounded-lg bg-[#121722] border border-[#1E273A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm font-mono">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Syncs directly to <code className="text-indigo-300">.env</code> in{" "}
            {botName}&apos;s isolated directory
          </span>
        </div>

        <div className="flex items-center gap-3">
          {botStatus === "online" && (
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={restartOnSave}
                onChange={(e) => setRestartOnSave(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#232E44] bg-[#182030] accent-indigo-500 cursor-pointer"
              />
              <span className="text-[11px]">Restart bot to apply changes</span>
            </label>
          )}

          <button
            id="btn-save-env-secrets"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "Saving Secrets..." : "Save & Sync .env"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
