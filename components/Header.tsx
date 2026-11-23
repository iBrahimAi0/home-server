'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export function Header({ title, badge, action }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pb-6 border-b border-[#1C1E24] mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {badge && (
          <span className="text-xs font-mono text-slate-400">
            {badge}
          </span>
        )}
        {action}
      </div>
    </header>
  );
}
