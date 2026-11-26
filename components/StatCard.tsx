'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  percentage?: number;
  icon: LucideIcon;
  color?: 'purple' | 'blue' | 'emerald' | 'amber';
  badgeText?: string;
  trend?: string;
}

export function StatCard({
  id,
  title,
  value,
  subtitle,
  percentage,
  icon: Icon,
  color = 'purple',
  badgeText,
  trend,
}: StatCardProps) {
  const colorMap = {
    purple: {
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
      progressFill: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      accent: 'text-indigo-400',
      topGlow: 'before:via-indigo-500/50',
    },
    blue: {
      iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
      progressFill: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      accent: 'text-sky-400',
      topGlow: 'before:via-sky-500/50',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      progressFill: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      accent: 'text-emerald-400',
      topGlow: 'before:via-emerald-500/50',
    },
    amber: {
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      progressFill: 'bg-gradient-to-r from-amber-500 to-orange-500',
      accent: 'text-amber-400',
      topGlow: 'before:via-amber-500/50',
    },
  };

  const theme = colorMap[color];

  return (
    <div
      id={id}
      className={`group relative overflow-hidden rounded-xl bg-inset/90 border border-white/[0.07] p-4.5 transition-all duration-200 hover:border-white/[0.15] hover:bg-panel shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent ${theme.topGlow} before:to-transparent before:opacity-75 hover:before:opacity-100`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white font-mono">
              {value}
            </span>
            {badgeText && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${theme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Subtitle / Ratio */}
      {subtitle && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono truncate">{subtitle}</span>
          {trend && <span className={`${theme.accent} font-mono shrink-0 ml-2 font-medium`}>{trend}</span>}
        </div>
      )}

      {/* Visual Percentage Progress Bar */}
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${theme.progressFill}`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Utilization</span>
            <span className="font-semibold text-slate-200">{percentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
