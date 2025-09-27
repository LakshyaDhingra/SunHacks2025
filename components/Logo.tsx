import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-1 select-none">
      <span className="text-[#FFD56D] font-semibold text-5xl tracking-wide">Spark</span>
      <svg
        aria-hidden
        className="w-8 h-8 -mb-1 text-[#FFD56D]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7 2a1 1 0 0 1 1 1v7h2V3a1 1 0 1 1 2 0v7h2V3a1 1 0 1 1 2 0v8a5 5 0 0 1-4 4.9V22a1 1 0 1 1-2 0v-6.1A5 5 0 0 1 7 11V3a1 1 0 0 1 1-1z" />
      </svg>
      <span className="text-[#FFD56D] font-semibold text-5xl tracking-wide">Bite</span>
    </div>
  );
}