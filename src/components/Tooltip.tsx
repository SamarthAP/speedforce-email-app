import React, { useState } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <div
        className={clsx(
          "absolute bg-slate-600 text-white text-xs px-2 py-1 mt-1 rounded-md whitespace-nowrap",
          showTooltip ? "opacity-100" : "opacity-0",
          "top-full left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ease-in-out pointer-events-none z-50"
        )}
      >
        {text}
      </div>
    </div>
  );
}


