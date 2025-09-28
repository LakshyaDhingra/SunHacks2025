'use client';

import { useState } from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/lib/types/recipe';
import { parseStreamedRecipeResponse } from '@/lib/utils/recipe-parser';
import { Logo } from './Logo';

export function RecipeFinder() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const findRecipes = async () => {
    if (ingredients.length === 0) return;

    setIsLoading(true);
    setStreamedContent('');
    setRecipes([]);
    setStatusMessage('');

    try {
      const response = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          preferences: {}
        }),
      });

      if (!response.ok) {
        console.log('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to search recipes: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullText += chunk;
          setStreamedContent(fullText);

          // Parse status and recipes from the streamed content
          const parsed = parseStreamedRecipeResponse(fullText);
          setStatusMessage(parsed.status);
          if (parsed.recipes.length > 0) {
            setRecipes(parsed.recipes);
          }
        }
      }
    } catch (error) {
      console.error('Error finding recipes:', error);
      setStreamedContent('Sorry, there was an error finding recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen">
      <div className="w-full max-w-6xl mx-auto p-6">
        {/* Brand + Search (Figma-style) */}
        <div className="mt-8 mb-6 flex flex-col items-center gap-8">
          <div className="h-24 md:h-34 lg:h-40 w-auto">
            <Logo />
          </div>

          <div className="flex w-full gap-6">
            <div className="relative flex-3">
              {/* Ingredient Input */}
              <input
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Select your ingredients"
                className="w-full rounded-full bg-[color:var(--surface)] text-[#2E2A1F] placeholder-muted px-6 py-4 shadow-sm focus:outline-none focus:ring-4 focus:ring-[color:var(--brand)]/40"
              />
              {/* Add Ingredient Button */}
              <button
                onClick={addIngredient}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--brand)] text-[#2E2A1F] font-semibold px-5 py-2 shadow-sm hover:cursor-pointer transition hover:bg-[color:var(--brand_dark)]"
              >
                Add
              </button>
            </div>

            {/* Find Recipes Button */}
            <div className='relative w-full bg-[color:var(--surface)] flex-1 rounded-full'>
              <button onClick={findRecipes} className='absolute w-93/100 right-2 top-1/2 -translate-y-1/2 rounded-full bg-[color:var(--brand)] text-[#2E2A1F] font-semibold px-5 py-2 shadow-sm hover:cursor-pointer transition hover:bg-[color:var(--brand_dark)]'>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding Recipes...
                  </span>
                ) : (
                  '🔍 Find Recipes'
                )}
              </button>
            </div>
          </div>
        </div>

        
        {ingredients.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-6">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-[color:var(--brand)] dark:to-[color:var(--brand_dark)] text-[#2E2A1F] dark:text-[#2E2A1F] rounded-full shadow-sm"
              >
                <span className="font-medium">{ingredient}</span>
                <button
                  onClick={() => removeIngredient(index)}
                  className="w-5 h-5 flex items-center justify-center bg-green-600 dark:bg-[#2E2A1F] text-white rounded-full cursor-pointer hover:bg-[#1D1A14] dark:hover:bg-[#1D1A14] transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-300 mb-6 flex justify-center">Add ingredients using the search above, then find recipes.</p>
        )}

        {/* Status Bar */}
        {(statusMessage || isLoading) && (
          <div className="mb-4">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-3 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  {statusMessage || 'Starting recipe search...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Results */}
        {recipes.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
              🍽️ Recommended Recipes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map((recipe, index) => (
                <RecipeCard key={index} recipe={recipe} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
