import React from 'react';

interface NexusLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function NexusLogo({ className = '', size = 32, showText = false }: NexusLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-md shadow-purple-600/20 text-white shrink-0 overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Futuristic Hexagonal Nexus Node SVG */}
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[70%] h-[70%]"
        >
          {/* Hexagon Outer Frame */}
          <path
            d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Stylized 'N' Node Path */}
          <path
            d="M11 25V11L25 25V11"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Nexus Center Pulse Point */}
          <circle cx="18" cy="18" r="2" fill="#38BDF8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-white text-base tracking-tight leading-tight">
            Nexus<span className="text-purple-400">Panel</span>
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Control Center
          </span>
        </div>
      )}
    </div>
  );
}
