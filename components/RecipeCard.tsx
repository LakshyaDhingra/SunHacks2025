'use client';

import React, { useState } from 'react';
import { Recipe } from '@/lib/types/recipe';
import { formatDuration, formatAmount } from '@/lib/utils/format';
import { TimerConfirm } from './TimerConfirm';
import { InlineTimer } from './InlineTimer';

interface RecipeCardProps {
  recipe: Recipe;
}

interface ActiveTimer {
  key: string;
  duration: string;
  label: string;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTimer, setPendingTimer] = useState<{ duration: string; label: string; key: string } | null>(null);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  const handleTimerClick = (duration: string, label: string, key: string) => {
    const existingTimer = activeTimers.find(t => t.key === key);
    if (existingTimer) return;
    
    setPendingTimer({ duration, label, key });
    setConfirmOpen(true);
  };

  const handleStartTimer = (adjustedDuration: string) => {
    if (pendingTimer) {
      setActiveTimers(prev => [...prev, { ...pendingTimer, duration: adjustedDuration }]);
      setPendingTimer(null);
    }
  };

  const handleTimerComplete = (key: string) => {
    setActiveTimers(prev => prev.filter(t => t.key !== key));
  };

  const renderInstructionWithTimers = (instruction: string, stepIndex: number) => {
    const timePattern = /(\d+(?:\s*(?:to|-)\s*\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timePattern.exec(instruction)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${stepIndex}-${lastIndex}`}>
            {instruction.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      const fullMatch = match[0];
      const timerKey = `step-${stepIndex}-${match.index}`;
      const activeTimer = activeTimers.find(t => t.key === timerKey);
      
      if (activeTimer) {
        parts.push(
          <InlineTimer
            key={timerKey}
            duration={activeTimer.duration}
            label={activeTimer.label}
            isRunning={true}
            onComplete={() => handleTimerComplete(timerKey)}
          />
        );
      } else {
        parts.push(
          <button
            key={timerKey}
            onClick={() => handleTimerClick(fullMatch, `Step ${stepIndex + 1}`, timerKey)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 rounded-md text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors cursor-pointer"
          >
            ⏱️ {fullMatch}
          </button>
        );
      }
      
      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < instruction.length) {
      parts.push(
        <span key={`text-${stepIndex}-${lastIndex}`}>
          {instruction.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : instruction;
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
      {recipe.image && (
        <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
          {recipe.name}
        </h3>
        
        {recipe.description && (
          <p className="text-zinc-600 dark:text-zinc-400 mb-4 italic">
            {recipe.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-3 mb-4">
          {recipe.prepTime && (
            activeTimers.find(t => t.key === 'prep-time') ? (
              <InlineTimer
                duration={formatDuration(recipe.prepTime)}
                label="Prep"
                isRunning={true}
                onComplete={() => handleTimerComplete('prep-time')}
              />
            ) : (
              <button
                onClick={() => handleTimerClick(formatDuration(recipe.prepTime), 'Prep', 'prep-time')}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
              >
                ⏱️ Prep: {formatDuration(recipe.prepTime)}
              </button>
            )
          )}
          {recipe.cookTime && (
            activeTimers.find(t => t.key === 'cook-time') ? (
              <InlineTimer
                duration={formatDuration(recipe.cookTime)}
                label="Cook"
                isRunning={true}
                onComplete={() => handleTimerComplete('cook-time')}
              />
            ) : (
              <button
                onClick={() => handleTimerClick(formatDuration(recipe.cookTime), 'Cook', 'cook-time')}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors cursor-pointer"
              >
                🔥 Cook: {formatDuration(recipe.cookTime)}
              </button>
            )
          )}
          {recipe.servings && (
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full text-sm font-medium">
              👥 Serves: {recipe.servings}
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <h4 className="font-bold mb-2 text-zinc-900 dark:text-white flex items-center">
            🥘 Ingredients
          </h4>
          <ul className="space-y-1">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>
                  {ingredient.amount && <strong>{formatAmount(ingredient.amount)}</strong>} {ingredient.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="font-bold mb-2 text-zinc-900 dark:text-white flex items-center">
            📝 Instructions
          </h4>
          <ol className="space-y-2">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="text-sm text-zinc-600 dark:text-zinc-400 flex">
                <span className="font-bold text-green-600 dark:text-green-400 mr-2">{index + 1}.</span>
                <span>{renderInstructionWithTimers(step, index)}</span>
              </li>
            ))}
          </ol>
        </div>
        
        {recipe.url && recipe.url !== '#' && (
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium"
          >
            View Full Recipe
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
      
      {pendingTimer && (
        <TimerConfirm
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setPendingTimer(null);
          }}
          onStart={handleStartTimer}
          duration={pendingTimer.duration}
          label={pendingTimer.label}
          variant="panel"
        />
      )}
    </div>
  );
}