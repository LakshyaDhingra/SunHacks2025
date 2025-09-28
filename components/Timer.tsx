'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  isOpen: boolean;
  onClose: () => void;
  duration: string;
  label: string;
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)?/i);
  if (!match) return 5 * 60;
  
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  const avg = Math.floor((min + max) / 2);
  
  const unit = match[3]?.toLowerCase() || 'minutes';
  
  if (unit.startsWith('hour') || unit.startsWith('hr')) {
    return avg * 3600;
  } else if (unit.startsWith('sec')) {
    return avg;
  } else {
    return avg * 60;
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

export function Timer({ isOpen, onClose, duration, label }: TimerProps) {
  const totalSeconds = parseDuration(duration);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(totalSeconds);
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [isOpen, totalSeconds]);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Timer Complete!`, {
              body: `Your ${label} timer has finished.`,
              icon: '⏰',
            });
          }
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURE');
          audio.play().catch(() => {});
          alert(`⏰ Timer Complete!\n\nYour ${label} timer has finished.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, label]);

  const handleStart = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setIsPaused(false);
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {label} Timer
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative w-48 h-48 mx-auto">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-zinc-200 dark:text-zinc-700"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="text-green-500 transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Timer set for {duration}
          </p>
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
            >
              Start Timer
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all font-medium"
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-6 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all font-medium"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}