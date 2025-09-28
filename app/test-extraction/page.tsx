"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { Recipe } from "@/lib/types/recipe";

export default function TestExtractionPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const extractRecipe = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");
    setRecipe(null);
    setDebugInfo(null);

    try {
      const response = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract recipe");
      }

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
        setDebugInfo(data.debug);
      } else {
        setError("No recipe data found on this page");
        setDebugInfo(data.debug);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to extract recipe"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sample URLs for testing
  const sampleUrls = [
    "https://www.allrecipes.com/recipe/23298/egg-fried-rice/",
    "https://www.allrecipes.com/recipe/223382/chicken-stir-fry/",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2 text-center text-zinc-900 dark:text-white">
          🧪 Recipe Extraction Tester
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
          Test recipe extraction from any URL
        </p>

        {/* URL Input Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
            Enter Recipe URL
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && extractRecipe()}
              placeholder="https://www.example.com/recipe"
              className="flex-1 px-4 py-3 border-2 border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={extractRecipe}
              disabled={!url.trim() || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400"
            >
              {isLoading ? "Extracting..." : "Extract"}
            </button>
          </div>

          {/* Sample URLs */}
          <div className="mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Try these sample URLs:
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleUrls.map((sampleUrl, index) => (
                <button
                  key={index}
                  onClick={() => setUrl(sampleUrl)}
                  className="text-xs px-3 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  {new URL(sampleUrl).hostname}
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-green-600"
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
            </div>
          )}
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">
              Debug Info
            </h3>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                Extraction Method:{" "}
                {debugInfo.foundJsonLd ? "schema.org JSON-LD" : "HTML parsing"}
              </p>
              {debugInfo.ingredientsFound !== undefined && (
                <p>Ingredients Found: {debugInfo.ingredientsFound}</p>
              )}
              {debugInfo.instructionsFound !== undefined && (
                <p>Instructions Found: {debugInfo.instructionsFound}</p>
              )}
            </div>
            {debugInfo.rawData && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  View Raw JSON-LD Data
                </summary>
                <pre className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded overflow-auto text-xs">
                  {JSON.stringify(debugInfo.rawData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Recipe Display */}
        {recipe && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-white">
              📖 Extracted Recipe
            </h2>
            <div className="max-w-2xl mx-auto">
              <RecipeCard recipe={recipe} userIngredients={[]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
