import React from 'react';

interface ForgeLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function NexusLogo({ className = '', size = 28, showText = true }: ForgeLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Forge Golden Squircle Icon */}
      <div
        className="relative flex items-center justify-center rounded-lg bg-[#F5A623] text-black shrink-0 shadow-[0_0_15px_rgba(245,166,35,0.3)]"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-[65%] h-[65%] text-[#0D0E12]">
          <path
            d="M5 6H19M5 12H15M5 18H11"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <span className="font-extrabold text-white text-[17px] tracking-tight">
          Forge
        </span>
      )}
    </div>
  );
}

export function ForgeHexagon({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <div style={{ width: size, height: size }} className={`flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[#F5A623]">
        {/* Outer Hexagon */}
        <polygon
          points="32,4 58,18 58,46 32,60 6,46 6,18"
          stroke="#F5A623"
          strokeWidth="3.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Inner Hexagon */}
        <polygon
          points="32,15 48,24 48,40 32,49 16,40 16,24"
          stroke="#F5A623"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
