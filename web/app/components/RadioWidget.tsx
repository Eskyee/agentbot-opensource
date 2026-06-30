'use client';

import { useState } from 'react';

interface RadioWidgetProps {
  className?: string;
}

export default function RadioWidget({ className = '' }: RadioWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            baseFM Radio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-green-500 border border-green-500/30 px-2 py-0.5 rounded">
            LIVE
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-600 hover:text-white transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isExpanded ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'h-[600px]' : 'h-[320px]'}`}>
        <iframe
          src="https://radio-basefm-9963.gitlawb.app"
          title="baseFM Radio"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-900 bg-zinc-950">
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
          Built in Playground
        </span>
        <a
          href="https://radio-basefm-9963.gitlawb.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-orange-500 hover:text-orange-400 uppercase tracking-widest flex items-center gap-1"
        >
          Open Full
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      </div>
    </div>
  );
}
