import React from 'react';

interface NexusLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function NexusLogo({ className = '', size = 32, showText = false }: NexusLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Nexus Infrastructure Mark */}
      <div
        className="relative flex items-center justify-center rounded-lg bg-[#141A28] border border-[#2A344A] text-white shrink-0 overflow-hidden shadow-sm"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%]"
        >
          {/* Outer diamond/hex connection bounds */}
          <path
            d="M16 3L28 9.5V22.5L16 29L4 22.5V9.5L16 3Z"
            stroke="#6366F1"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Cross interconnect topology paths */}
          <path
            d="M16 3V16M28 22.5L16 16M4 22.5L16 16"
            stroke="#818CF8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />

          {/* Node Hub Core Points */}
          <circle cx="16" cy="16" r="2.25" fill="#38BDF8" />
          <circle cx="16" cy="3" r="1.5" fill="#A5B4FC" />
          <circle cx="28" cy="9.5" r="1.5" fill="#A5B4FC" />
          <circle cx="28" cy="22.5" r="1.5" fill="#A5B4FC" />
          <circle cx="16" cy="29" r="1.5" fill="#A5B4FC" />
          <circle cx="4" cy="22.5" r="1.5" fill="#A5B4FC" />
          <circle cx="4" cy="9.5" r="1.5" fill="#A5B4FC" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 leading-none">
            <span className="font-bold text-white text-sm tracking-tight">
              Nexus<span className="text-indigo-400">Panel</span>
            </span>
          </div>
          <span className="text-[9px] uppercase font-mono font-semibold tracking-widest text-slate-400 mt-0.5">
            Core Controller
          </span>
        </div>
      )}
    </div>
  );
}
