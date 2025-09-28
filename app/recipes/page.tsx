"use client";

import { useState, useEffect } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { Recipe } from "@/lib/types/recipe";
import { Logo } from "@/components/Logo";
import { useUser } from "@clerk/nextjs";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetchFavorites();
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/bookmarks");
      
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setError("Failed to load your favorite recipes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = (recipeToRemove: Recipe) => {
    setFavorites(prev => prev.filter(recipe => 
      recipe.name !== recipeToRemove.name || recipe.url !== recipeToRemove.url
    ));
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen">
        <div className="w-full max-w-6xl mx-auto p-6">
          <div className="mt-8 mb-6 flex flex-col items-center gap-8">
            <div className="h-24 md:h-34 lg:h-40 w-auto">
              <Logo />
            </div>
          </div>
          
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-6 w-6 text-[color:var(--brand)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-lg text-zinc-600 dark:text-zinc-400">
                Loading your favorites...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="w-full max-w-6xl mx-auto p-6">
          <div className="mt-8 mb-6 flex flex-col items-center gap-8">
            <div className="h-24 md:h-34 lg:h-40 w-auto">
              <Logo />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Sign In Required
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-6">
              Please sign in to view your favorite recipes.
            </p>
            <a
              href="/sign-in"
              className="px-6 py-3 bg-[color:var(--brand)] text-[#2E2A1F] font-semibold rounded-full hover:bg-[color:var(--brand_dark)] transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-6xl mx-auto p-6">
        {/* Brand Header */}
        <div className="mt-8 mb-6 flex flex-col items-center gap-8">
          <div className="h-24 md:h-34 lg:h-40 w-auto">
            <Logo />
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Your Favorite Recipes
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300">
              All your saved recipes in one place
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">
              No Favorites Yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-6">
              Start exploring recipes and save your favorites by clicking the heart icon.
            </p>
            <a
              href="/"
              className="px-6 py-3 bg-[color:var(--brand)] text-[#2E2A1F] font-semibold rounded-full hover:bg-[color:var(--brand_dark)] transition-colors"
            >
              Find Recipes
            </a>
          </div>
        )}

        {/* Recipe Results */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                ❤️ Your Saved Recipes ({favorites.length})
              </h2>
              <button
                onClick={fetchFavorites}
                className="px-4 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {favorites.map((recipe, index) => (
                <RecipeCard
                  key={`${recipe.name}-${index}`}
                  recipe={recipe}
                  userIngredients={[]} // No highlighting needed on favorites page
                  onRemoveFavorite={() => handleRemoveFavorite(recipe)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}