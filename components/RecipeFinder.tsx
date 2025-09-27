'use client';

import { useState } from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/lib/types/recipe';
import { parseRecipesFromMarkdown, extractToolCallResults } from '@/lib/utils/recipe-parser';

export function RecipeFinder() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'chat'>('cards');

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

          // Try to extract recipes from the streamed content
          extractRecipesFromText(fullText);
        }
      }
    } catch (error) {
      console.error('Error finding recipes:', error);
      setStreamedContent('Sorry, there was an error finding recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractRecipesFromText = (text: string) => {
    // First try to extract tool call results
    let extractedRecipes = extractToolCallResults(text);
    
    // If no tool results, try markdown parsing
    if (extractedRecipes.length === 0) {
      extractedRecipes = parseRecipesFromMarkdown(text);
    }
    
    // Update recipes if we found any
    if (extractedRecipes.length > 0) {
      setRecipes(extractedRecipes);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2 text-center text-zinc-900 dark:text-white">
          🍳 Recipe Finder
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
          Enter your ingredients and discover delicious recipes powered by AI
        </p>

        {/* Ingredient Input Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
            What&apos;s in your kitchen?
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="Type an ingredient and press Enter"
              className="flex-1 px-4 py-3 border-2 border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={addIngredient}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              + Add
            </button>
          </div>

          {/* Ingredient Chips */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200 rounded-full shadow-sm"
                >
                  <span className="font-medium">{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(index)}
                    className="w-5 h-5 flex items-center justify-center bg-green-600 dark:bg-green-500 text-white rounded-full hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={findRecipes}
            disabled={ingredients.length === 0 || isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
          >
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

        {/* Results Section */}
        {(streamedContent || recipes.length > 0) && (
          <>
            {/* View Toggle */}
            {recipes.length > 0 && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    📖 Recipe Cards
                  </button>
                  <button
                    onClick={() => setViewMode('chat')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      viewMode === 'chat'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    💬 AI Response
                  </button>
                </div>
              </div>
            )}

            {/* Recipe Cards View */}
            {viewMode === 'cards' && recipes.length > 0 && (
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

            {/* AI Chat View */}
            {(viewMode === 'chat' || recipes.length === 0) && streamedContent && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                  🤖 AI Chef Assistant
                </h2>
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {streamedContent}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
