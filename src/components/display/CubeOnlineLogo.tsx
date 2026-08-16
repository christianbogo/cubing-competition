import React from 'react';

interface CubeOnlineLogoProps {
  className?: string;
  accentColor?: string;
  size?: number | string;
}

export const CubeOnlineLogo: React.FC<CubeOnlineLogoProps> = ({
  className = 'w-7 h-7',
  accentColor,
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform hover:scale-105 duration-200 ${className}`}
    >
      {/* Top Row */}
      <rect
        x="15"
        y="15"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
      <rect
        x="76"
        y="15"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
      <rect
        x="137"
        y="15"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />

      {/* Middle Row */}
      <rect
        x="15"
        y="76"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
      <rect
        x="76"
        y="76"
        width="48"
        height="48"
        rx="10"
        style={accentColor ? { fill: accentColor } : undefined}
        className={
          accentColor
            ? 'transition-all duration-200'
            : 'fill-amber-500 dark:fill-amber-400 transition-colors duration-200'
        }
      />
      <rect
        x="137"
        y="76"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />

      {/* Bottom Row */}
      <rect
        x="15"
        y="137"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
      <rect
        x="76"
        y="137"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
      <rect
        x="137"
        y="137"
        width="48"
        height="48"
        rx="10"
        className="fill-slate-400 dark:fill-slate-600 transition-colors duration-200"
      />
    </svg>
  );
};
