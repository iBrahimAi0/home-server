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
      iconBg: 'bg-[#182133] border-[#243048] text-indigo-400',
      progressFill: 'bg-indigo-500',
      accent: 'text-indigo-400',
    },
    blue: {
      iconBg: 'bg-[#142236] border-[#1C3250] text-sky-400',
      progressFill: 'bg-sky-500',
      accent: 'text-sky-400',
    },
    emerald: {
      iconBg: 'bg-[#122620] border-[#183B30] text-emerald-400',
      progressFill: 'bg-emerald-500',
      accent: 'text-emerald-400',
    },
    amber: {
      iconBg: 'bg-[#272114] border-[#3E341C] text-amber-400',
      progressFill: 'bg-amber-500',
      accent: 'text-amber-400',
    },
  };

  const theme = colorMap[color];

  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-lg bg-[#121722] border border-[#1E273A] p-4.5 transition-all duration-150 hover:border-[#2A3750]"
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
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#182133] text-slate-300 border border-[#232E44]">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2 rounded-lg border ${theme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Subtitle / Ratio */}
      {subtitle && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono truncate">{subtitle}</span>
          {trend && <span className={`${theme.accent} font-mono shrink-0 ml-2`}>{trend}</span>}
        </div>
      )}

      {/* Visual Percentage Progress Bar */}
      {percentage !== undefined && (
        <div className="mt-2.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1A2232]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${theme.progressFill}`}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Utilization</span>
            <span className="font-semibold text-slate-300">{percentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
