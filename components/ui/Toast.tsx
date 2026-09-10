"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, title?: string) =>
      showToast({ type: "success", message, title }),
    [showToast],
  );

  const error = useCallback(
    (message: string, title?: string) =>
      showToast({ type: "error", message, title, duration: 6000 }),
    [showToast],
  );

  const info = useCallback(
    (message: string, title?: string) =>
      showToast({ type: "info", message, title }),
    [showToast],
  );

  const warning = useCallback(
    (message: string, title?: string) =>
      showToast({ type: "warning", message, title, duration: 5000 }),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        info,
        warning,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderClass = "border-slate-700 bg-[#121722]/95 text-slate-200";
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;

        if (toast.type === "success") {
          borderClass =
            "border-emerald-500/40 bg-[#0F1B19]/95 text-emerald-100 shadow-emerald-950/40";
          icon = (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          );
        } else if (toast.type === "error") {
          borderClass =
            "border-rose-500/40 bg-[#1D1217]/95 text-rose-100 shadow-rose-950/40";
          icon = (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          );
        } else if (toast.type === "warning") {
          borderClass =
            "border-amber-500/40 bg-[#1E1911]/95 text-amber-100 shadow-amber-950/40";
          icon = (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          );
        } else if (toast.type === "info") {
          borderClass =
            "border-indigo-500/40 bg-[#131726]/95 text-indigo-100 shadow-indigo-950/40";
          icon = <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0 font-sans">
              {toast.title && (
                <h4 className="text-xs font-bold tracking-tight mb-0.5 text-white">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs font-mono leading-relaxed break-words opacity-90">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
