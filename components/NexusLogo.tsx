import React from 'react';

interface NexusLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function NexusLogo({ className = '', size = 32, showText = false }: NexusLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Nexus Infrastructure Mark with ambient glow */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#161C2C] to-[#0E131F] border border-indigo-500/30 text-white shrink-0 overflow-hidden shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[72%] h-[72%]"
        >
          <defs>
            <linearGradient id="nexusGrad" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="nexusInner" x1="16" y1="3" x2="16" y2="22.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A5B4FC" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
          </defs>

          {/* Outer diamond/hex connection bounds */}
          <path
            d="M16 3L28 9.5V22.5L16 29L4 22.5V9.5L16 3Z"
            stroke="url(#nexusGrad)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Cross interconnect topology paths */}
          <path
            d="M16 3V16M28 22.5L16 16M4 22.5L16 16"
            stroke="url(#nexusInner)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Node Hub Core Points */}
          <circle cx="16" cy="16" r="2.25" fill="#38BDF8" />
          <circle cx="16" cy="3" r="1.5" fill="#C7D2FE" />
          <circle cx="28" cy="9.5" r="1.5" fill="#C7D2FE" />
          <circle cx="28" cy="22.5" r="1.5" fill="#C7D2FE" />
          <circle cx="16" cy="29" r="1.5" fill="#C7D2FE" />
          <circle cx="4" cy="22.5" r="1.5" fill="#C7D2FE" />
          <circle cx="4" cy="9.5" r="1.5" fill="#C7D2FE" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-white text-[15px] tracking-tight">
              Nexus<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400 font-extrabold">Panel</span>
            </span>
          </div>
          <span className="text-[9px] uppercase font-mono font-medium tracking-widest text-slate-400 mt-1">
            Bot Infrastructure
          </span>
        </div>
      )}
    </div>
  );
}
