'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TimerConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (adjustedDuration: string) => void;
  duration: string;
  label: string;
  // NEW: choose between full-screen modal or small corner popup
  variant?: 'modal' | 'panel';
}

function parseDurationRange(duration: string): { min: number; max: number; unit: string } {
  const match = duration.match(/(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)?/i);
  if (!match) return { min: 5, max: 5, unit: 'minutes' };
  
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  const unit = match[3]?.toLowerCase() || 'minutes';
  
  return { min, max, unit };
}

function formatDurationValue(value: number, unit: string): string {
  const shortUnit = unit.startsWith('hour') || unit.startsWith('hr') ? 'hr' : 
                   unit.startsWith('min') ? 'min' : 'sec';
  return `${value} ${value === 1 ? shortUnit : shortUnit + 's'}`;
}

export function TimerConfirm({
  isOpen,
  onClose,
  onStart,
  duration,
  label,
  variant = 'modal', // default keeps existing behavior
}: TimerConfirmProps) {
  const { min, max, unit } = parseDurationRange(duration);
  const [selectedValue, setSelectedValue] = useState(min);
  const isRange = min !== max;
  // Draggable state (panel variant)
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragMeta = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedValue(min);
    }
  }, [isOpen, min]);

  if (!isOpen) return null;

  const handleStart = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    onStart(formatDurationValue(selectedValue, unit));
    onClose();
  };

  const handleDecrease = () => {
    setSelectedValue(prev => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setSelectedValue(prev => prev + 1);
  };

  // Extract inner card so we can reuse it for modal and panel variants
  const card = (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-0 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-700 select-none">
      {/* Drag handle */}
      <div
        className={`flex items-start justify-between gap-2 px-4 pt-3 pb-2 ${
          variant === 'panel' ? 'cursor-move active:cursor-grabbing' : ''
        }`}
        onPointerDown={(e) => {
          if (variant !== 'panel') return;
          // Initialize drag
          try {
            (e.target as Element).setPointerCapture?.(e.pointerId);
          } catch {}
          const rect = panelRef.current?.getBoundingClientRect();
          const originX = position?.x ?? (rect ? rect.left : 0);
          const originY = position?.y ?? (rect ? rect.top : 0);
          dragMeta.current = { startX: e.clientX, startY: e.clientY, originX, originY };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!dragging || variant !== 'panel' || !dragMeta.current) return;
          const dx = e.clientX - dragMeta.current.startX;
          const dy = e.clientY - dragMeta.current.startY;
          const nextX = dragMeta.current.originX + dx;
          const nextY = dragMeta.current.originY + dy;
          const rect = panelRef.current?.getBoundingClientRect();
          const w = rect?.width ?? 320;
          const h = rect?.height ?? 200;
          const margin = 8;
          const maxX = (window.innerWidth || 0) - w - margin;
          const maxY = (window.innerHeight || 0) - h - margin;
          const clampedX = Math.max(margin, Math.min(nextX, maxX));
          const clampedY = Math.max(margin, Math.min(nextY, maxY));
          setPosition({ x: clampedX, y: clampedY });
        }}
        onPointerUp={(e) => {
          if (variant !== 'panel') return;
          try {
            (e.target as Element).releasePointerCapture?.(e.pointerId);
          } catch {}
          setDragging(false);
          dragMeta.current = null;
        }}
      >
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Start Timer?</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Timer for {label}</p>
        </div>
        {variant === 'panel' && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 text-center">
          {isRange ? `Recipe suggests: ${min} - ${max} ${unit}` : `Recipe suggests: ${min} ${unit}`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDecrease}
            disabled={selectedValue <= 1}
            className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {selectedValue}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {unit}
            </div>
          </div>
          <button
            onClick={handleIncrease}
            className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {selectedValue < min || selectedValue > max ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center font-medium">
            Custom time (outside suggested range)
          </p>
        ) : (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
            ✓ Within suggested time
          </p>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={handleStart}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium"
        >
          Start Timer
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Modal (existing) vs small corner popup (new)
  return variant === 'modal' ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {card}
    </div>
  ) : (
    <div
      ref={panelRef}
      className={`fixed z-50 ${position ? '' : 'bottom-4 right-4'} touch-none`}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerDown={() => {
        // Ensure initial position is set on first interaction so dragging works from bottom-right
        if (!position && panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const margin = 16; // matches bottom/right-4
          const x = window.innerWidth - rect.width - margin;
          const y = window.innerHeight - rect.height - margin;
          setPosition({ x, y });
        }
      }}
    >
      {card}
    </div>
  );
}