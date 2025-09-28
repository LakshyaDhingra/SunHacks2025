'use client';

import React, { useState, useEffect } from 'react';

interface TimerConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (adjustedDuration: string) => void;
  duration: string;
  label: string;
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

export function TimerConfirm({ isOpen, onClose, onStart, duration, label }: TimerConfirmProps) {
  const { min, max, unit } = parseDurationRange(duration);
  const [selectedValue, setSelectedValue] = useState(min);
  const isRange = min !== max;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          Start Timer?
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          Timer for {label}
        </p>
        
        <div className="my-4">
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
        
        <div className="flex gap-2">
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
    </div>
  );
}