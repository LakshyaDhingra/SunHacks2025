'use client';

import React, { useState, useEffect } from 'react';

interface InlineTimerProps {
  duration: string;
  label: string;
  onComplete: () => void;
  isRunning: boolean;
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)?/i);
  if (!match) return 5 * 60;
  
  const value = parseInt(match[1]);
  const unit = match[3]?.toLowerCase() || 'minutes';
  
  if (unit.startsWith('hour') || unit.startsWith('hr')) {
    return value * 3600;
  } else if (unit.startsWith('sec')) {
    return value;
  } else {
    return value * 60;
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function InlineTimer({ duration, label, onComplete, isRunning }: InlineTimerProps) {
  const totalSeconds = parseDuration(duration);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isRunning) {
      setTimeLeft(totalSeconds);
      setIsPaused(false);
    }
  }, [isRunning, totalSeconds]);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Timer Complete!`, {
              body: `Your ${label} timer has finished.`,
              icon: '⏰',
            });
          }
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURE');
          audio.play().catch(() => {});
          alert(`⏰ Timer Complete!\n\nYour ${label} timer has finished.`);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, label, onComplete]);

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md text-sm font-medium">
      <span className="relative flex items-center justify-center w-4 h-4">
        <svg className="absolute transform -rotate-90 w-4 h-4">
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-green-300 dark:text-green-700"
          />
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 7}`}
            strokeDashoffset={`${2 * Math.PI * 7 * (1 - progress / 100)}`}
            className="text-green-600 dark:text-green-400"
          />
        </svg>
      </span>
      <span className="font-mono text-xs font-bold">{formatTime(timeLeft)}</span>
      <button
        onClick={handleTogglePause}
        className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4l10 6-10 6V4z" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
          </svg>
        )}
      </button>
      <button
        onClick={handleStop}
        className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
        title="Stop"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4h12v12H4z" />
        </svg>
      </button>
    </span>
  );
}