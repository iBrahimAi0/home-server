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
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      progressFill: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      glow: 'group-hover:border-purple-500/30',
      accent: 'text-purple-400',
    },
    blue: {
      iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      progressFill: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      glow: 'group-hover:border-sky-500/30',
      accent: 'text-sky-400',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      progressFill: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      glow: 'group-hover:border-emerald-500/30',
      accent: 'text-emerald-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      progressFill: 'bg-gradient-to-r from-amber-500 to-orange-500',
      glow: 'group-hover:border-amber-500/30',
      accent: 'text-amber-400',
    },
  };

  const theme = colorMap[color];

  return (
    <div
      id={id}
      className={`group relative overflow-hidden rounded-xl bg-[#111726]/90 border border-[#1E293B] p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:bg-[#151D30] ${theme.glow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {value}
            </span>
            {badgeText && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${theme.iconBg}`}>
                {badgeText}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Subtitle / Ratio */}
      {subtitle && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">{subtitle}</span>
          {trend && <span className={theme.accent}>{trend}</span>}
        </div>
      )}

      {/* Visual Percentage Progress Bar */}
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${theme.progressFill}`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Utilization</span>
            <span className="font-semibold text-slate-300">{percentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
