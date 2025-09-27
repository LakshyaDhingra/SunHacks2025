import React from 'react';
import { Recipe } from '@/lib/types/recipe';
import { formatDuration, formatAmount } from '@/lib/utils/format';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
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
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium">
              ⏱️ Prep: {formatDuration(recipe.prepTime)}
            </span>
          )}
          {recipe.cookTime && (
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded-full text-sm font-medium">
              🔥 Cook: {formatDuration(recipe.cookTime)}
            </span>
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
                <span>{step}</span>
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
    </div>
  );
}