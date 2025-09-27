import { tool } from 'ai';
import { z } from 'zod';
import { Recipe, RecipeSearchResult } from '@/lib/types/recipe';

// Recipe Search Tool
export const recipeSearchTool = tool({
  description: 'Search the web for recipes based on ingredients',
  inputSchema: z.object({
    ingredients: z.array(z.string()).describe('List of available ingredients'),
    query: z.string().optional().describe('Additional search parameters like cuisine type or dietary restrictions'),
    limit: z.number().optional().default(5).describe('Number of results to return')
  }),
  execute: async ({ ingredients, query, limit = 5 }) => {
    try {
      // Build search query
      const searchQuery = `recipe with ${ingredients.join(' ')} ${query || ''}`;
      
      // Use Google Custom Search or web scraping service
      // For now, we'll simulate with a mock implementation
      // In production, you would use Google Custom Search API or similar
      
      console.log('Searching for recipes with:', searchQuery);
      
      // Mock results for demonstration
      const mockResults: RecipeSearchResult[] = [
        {
          title: "Classic Tomato Pasta",
          url: "https://www.example.com/tomato-pasta",
          snippet: "A simple and delicious pasta recipe using fresh tomatoes, garlic, and basil",
          source: "Example Recipes"
        },
        {
          title: "Creamy Chicken Alfredo",
          url: "https://www.example.com/chicken-alfredo",
          snippet: "Rich and creamy chicken pasta with homemade alfredo sauce",
          source: "Example Recipes"
        }
      ].slice(0, limit);
      
      return {
        success: true,
        results: mockResults,
        query: searchQuery,
        count: mockResults.length
      };
    } catch (error) {
      console.error('Error searching for recipes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search recipes',
        results: []
      };
    }
  }
});

// Recipe Extraction Tool
export const recipeExtractionTool = tool({
  description: 'Extract structured recipe data from a URL using schema.org/Recipe format',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the recipe page to extract'),
  }),
  execute: async ({ url }) => {
    try {
      console.log('Extracting recipe from:', url);
      
      // In a real implementation, you would:
      // 1. Fetch the HTML content from the URL
      // 2. Parse for schema.org/Recipe structured data
      // 3. If not found, use AI to extract recipe information from the HTML
      
      // For now, return mock data
      const mockRecipe: Recipe = {
        name: "Classic Tomato Pasta",
        url: url,
        image: "https://example.com/image.jpg",
        description: "A simple and delicious pasta recipe",
        ingredients: [
          { name: "Pasta", amount: "1 lb" },
          { name: "Tomatoes", amount: "4 large" },
          { name: "Garlic", amount: "3 cloves" },
          { name: "Olive oil", amount: "3 tbsp" },
          { name: "Fresh basil", amount: "1/4 cup" },
          { name: "Salt and pepper", amount: "to taste" }
        ],
        instructions: [
          "Bring a large pot of salted water to boil",
          "Cook pasta according to package directions",
          "Meanwhile, dice tomatoes and mince garlic",
          "Heat olive oil in a pan and sauté garlic",
          "Add tomatoes and cook until soft",
          "Drain pasta and add to the sauce",
          "Toss with fresh basil and serve"
        ],
        prepTime: "10 minutes",
        cookTime: "20 minutes",
        totalTime: "30 minutes",
        servings: 4,
        nutrition: {
          calories: "320",
          protein: "12g",
          carbohydrates: "58g",
          fat: "8g"
        }
      };
      
      return {
        success: true,
        recipe: mockRecipe
      };
    } catch (error) {
      console.error('Error extracting recipe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract recipe',
        recipe: null
      };
    }
  }
});

// Advanced Recipe Extraction with AI fallback
export const advancedRecipeExtractionTool = tool({
  description: 'Extract recipe data from HTML content using AI when structured data is not available',
  inputSchema: z.object({
    htmlContent: z.string().describe('HTML content of the recipe page'),
    url: z.string().url().describe('URL of the recipe page'),
  }),
  execute: async ({ htmlContent, url }) => {
    try {
      // First, try to find schema.org/Recipe structured data
      const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs;
      const matches = htmlContent.matchAll(schemaRegex);
      
      for (const match of matches) {
        try {
          const jsonLd = JSON.parse(match[1]);
          if (jsonLd['@type'] === 'Recipe' || 
              (Array.isArray(jsonLd['@type']) && jsonLd['@type'].includes('Recipe'))) {
            
            // Parse the structured data
            const recipe: Recipe = {
              name: jsonLd.name || '',
              url: url,
              image: jsonLd.image?.url || jsonLd.image || undefined,
              description: jsonLd.description || undefined,
              ingredients: parseIngredients(jsonLd.recipeIngredient || []),
              instructions: parseInstructions(jsonLd.recipeInstructions || []),
              prepTime: jsonLd.prepTime || undefined,
              cookTime: jsonLd.cookTime || undefined,
              totalTime: jsonLd.totalTime || undefined,
              servings: jsonLd.recipeYield || undefined,
              nutrition: jsonLd.nutrition ? {
                calories: jsonLd.nutrition.calories || undefined,
                protein: jsonLd.nutrition.proteinContent || undefined,
                carbohydrates: jsonLd.nutrition.carbohydrateContent || undefined,
                fat: jsonLd.nutrition.fatContent || undefined,
              } : undefined,
              author: jsonLd.author?.name || undefined,
              datePublished: jsonLd.datePublished || undefined,
            };
            
            return {
              success: true,
              recipe: recipe,
              extractionMethod: 'structured-data'
            };
          }
        } catch (e) {
          // Invalid JSON, continue to next match
          continue;
        }
      }
      
      // If no structured data found, return indication to use AI extraction
      return {
        success: false,
        error: 'No structured data found, AI extraction needed',
        extractionMethod: 'ai-required'
      };
      
    } catch (error) {
      console.error('Error in advanced extraction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract recipe',
        recipe: null
      };
    }
  }
});

// Helper functions
function parseIngredients(ingredients: any[]): Array<{ name: string; amount?: string }> {
  return ingredients.map(ing => {
    if (typeof ing === 'string') {
      // Try to split amount and ingredient
      const match = ing.match(/^([\d\s\w/]+?)\s+(.+)$/);
      if (match) {
        return { amount: match[1].trim(), name: match[2].trim() };
      }
      return { name: ing };
    }
    return { name: ing.name || ing.toString(), amount: ing.amount };
  });
}

function parseInstructions(instructions: any[]): string[] {
  return instructions.map(inst => {
    if (typeof inst === 'string') {
      return inst;
    }
    if (inst.text) {
      return inst.text;
    }
    if (inst.name) {
      return inst.name;
    }
    return inst.toString();
  });
}