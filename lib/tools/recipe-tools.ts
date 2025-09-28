import { tool } from 'ai';
import { z } from 'zod';
import { Recipe, RecipeSearchResult } from '@/lib/types/recipe';
import * as cheerio from 'cheerio';

// Function to search for recipes across the web
async function searchWebForRecipes(
  ingredients: string[], 
  query?: string, 
  limit: number = 10
): Promise<RecipeSearchResult[]> {
  // Build an open search query for any recipe site
  const searchQuery = `recipe ${ingredients.join(' ')} ${query || ''}`;
  
  // Use DuckDuckGo's HTML search (no API key required)
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: RecipeSearchResult[] = [];
    
    // Parse DuckDuckGo search results
    $('.result').each((i: number, elem: any) => {
      if (i >= limit) return false;
      
      const $elem = $(elem);
      const title = $elem.find('.result__title').text().trim();
      const url = $elem.find('.result__url').text().trim();
      const snippet = $elem.find('.result__snippet').text().trim();
      
      if (title && url) {
        // Extract source from URL
        let source = 'Unknown';
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
          source = urlObj.hostname.replace('www.', '').split('.')[0];
          source = source.charAt(0).toUpperCase() + source.slice(1);
        } catch {}
        
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://${url}`,
          snippet,
          source
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Enhanced Recipe Search Tool with real web search
export const recipeSearchTool = tool({
  description: 'Search the web for recipes based on ingredients',
  inputSchema: z.object({
    ingredients: z.array(z.string()).describe('List of available ingredients'),
    query: z.string().optional().describe('Additional search parameters like cuisine type or dietary restrictions'),
    limit: z.number().optional().default(10).describe('Number of results to return')
  }),
  execute: async ({ ingredients, query, limit = 10 }) => {
    try {
      const searchResults = await searchWebForRecipes(ingredients, query, limit * 2); // Get extra to filter
      
      // Try to extract recipes with schema.org data
      const validRecipes: RecipeSearchResult[] = [];
      
      for (const result of searchResults) {
        try {
          // Quick check if the URL might have recipe schema
          const response = await fetch(result.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            const html = await response.text();
            const hasRecipeSchema = html.includes('"@type":"Recipe"') || 
                                   html.includes('"@type":["Recipe"') ||
                                   html.includes('application/ld+json');
            
            if (hasRecipeSchema) {
              validRecipes.push(result);
              if (validRecipes.length >= limit) break;
            }
          }
        } catch (error) {
          // Skip this URL if we can't check it
          console.log(`Skipping ${result.url}: ${error}`);
        }
      }
      
      // If we didn't find enough with schema, include some without
      if (validRecipes.length < limit) {
        for (const result of searchResults) {
          if (!validRecipes.find(r => r.url === result.url)) {
            validRecipes.push(result);
            if (validRecipes.length >= limit) break;
          }
        }
      }
      
      const results = validRecipes.slice(0, limit);
      
      return {
        success: true,
        results,
        query: `recipe with ${ingredients.join(', ')} ${query || ''}`,
        count: results.length
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

// Helper function to parse schema.org JSON-LD
function extractJsonLdRecipe(html: string): any | null {
  const $ = cheerio.load(html);
  
  // Look for JSON-LD script tags
  const scripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < scripts.length; i++) {
    try {
      const jsonText = $(scripts[i]).html();
      if (!jsonText) continue;
      
      const data = JSON.parse(jsonText);
      
      // Handle both single objects and arrays
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        // Check if it's a Recipe type
        if (item['@type'] === 'Recipe' || 
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          return item;
        }
        
        // Check for @graph structure
        if (item['@graph']) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type'] === 'Recipe' || 
                (Array.isArray(graphItem['@type']) && graphItem['@type'].includes('Recipe'))) {
              return graphItem;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
    }
  }
  
  return null;
}

// Helper to parse recipe instructions
function parseInstructions(instructions: any): string[] {
  if (!instructions) return [];
  
  if (typeof instructions === 'string') {
    return instructions.split(/\n|\.|\d+\./).filter(s => s.trim().length > 0);
  }
  
  if (Array.isArray(instructions)) {
    return instructions.map(inst => {
      if (typeof inst === 'string') return inst;
      if (inst.text) return inst.text;
      if (inst.name) return inst.name;
      return String(inst);
    }).filter(s => s.trim().length > 0);
  }
  
  return [];
}

// Helper to parse ingredients
function parseIngredients(ingredients: any): { name: string; amount: string }[] {
  if (!ingredients) return [];
  
  if (!Array.isArray(ingredients)) {
    ingredients = [ingredients];
  }
  
  return ingredients.map((ing: any) => {
    if (typeof ing === 'string') {
      // More sophisticated regex to parse amount from string
      // Matches: numbers, fractions, decimals, and units
      const match = ing.match(/^((?:\d+(?:\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)(?:\s+\w+)?)\s+(.+)$/);
      if (match) {
        return {
          amount: match[1].trim(),
          name: match[2].trim()
        };
      }
      
      // If no amount found, return the whole thing as name
      return { name: ing.trim(), amount: '' };
    }
    return { name: String(ing), amount: '' };
  });
}

// Enhanced Recipe Extraction Tool with real schema.org parsing
export const recipeExtractionTool = tool({
  description: 'Extract structured recipe data from a URL using schema.org/Recipe format or AI extraction',
  inputSchema: z.object({
    url: z.string().url().describe('URL of the recipe page to extract'),
  }),
  execute: async ({ url }) => {
    try {
      console.log('Extracting recipe from:', url);

      // Fetch the page HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recipe: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Try to extract JSON-LD recipe data
      const jsonLdRecipe = extractJsonLdRecipe(html);
      
      if (jsonLdRecipe) {
        console.log('Found schema.org recipe data');
        
        // Parse the schema.org data into our Recipe format
        // Extract image URL from various possible formats
        let imageUrl = undefined;
        if (jsonLdRecipe.image) {
          if (typeof jsonLdRecipe.image === 'string') {
            imageUrl = jsonLdRecipe.image;
          } else if (jsonLdRecipe.image.url) {
            imageUrl = jsonLdRecipe.image.url;
          } else if (Array.isArray(jsonLdRecipe.image) && jsonLdRecipe.image.length > 0) {
            imageUrl = jsonLdRecipe.image[0];
          }
        }
        
        // Continue even if no image (don't skip recipes)
        if (!imageUrl) {
          console.log('Recipe has no image, continuing anyway');
        }
        
        const recipe: Recipe = {
          name: jsonLdRecipe.name || 'Untitled Recipe',
          url: url,
          image: imageUrl,
          description: jsonLdRecipe.description || '',
          ingredients: parseIngredients(jsonLdRecipe.recipeIngredient),
          instructions: parseInstructions(jsonLdRecipe.recipeInstructions),
          prepTime: jsonLdRecipe.prepTime || undefined,
          cookTime: jsonLdRecipe.cookTime || undefined,
          totalTime: jsonLdRecipe.totalTime || undefined,
          servings: jsonLdRecipe.recipeYield ? 
            (typeof jsonLdRecipe.recipeYield === 'number' ? 
              jsonLdRecipe.recipeYield : 
              parseInt(jsonLdRecipe.recipeYield)) : undefined,
          nutrition: jsonLdRecipe.nutrition ? {
            calories: jsonLdRecipe.nutrition.calories || undefined,
            protein: jsonLdRecipe.nutrition.proteinContent || undefined,
            carbohydrates: jsonLdRecipe.nutrition.carbohydrateContent || undefined,
            fat: jsonLdRecipe.nutrition.fatContent || undefined,
          } : undefined,
          author: jsonLdRecipe.author?.name || jsonLdRecipe.author || undefined,
          datePublished: jsonLdRecipe.datePublished || undefined,
        };
        
        return {
          success: true,
          recipe,
          extractionMethod: 'schema.org'
        };
      }
      
      // Fallback: Try to extract basic info from HTML
      console.log('No schema.org data found, attempting HTML extraction');
      const $ = cheerio.load(html);
      
      // Try to extract basic recipe info from common patterns
      const recipe: Recipe = {
        name: $('h1').first().text().trim() || 
              $('title').text().split('|')[0].trim() || 
              'Recipe',
        url: url,
        description: $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content') || 
                    '',
        ingredients: [],
        instructions: [],
        image: $('meta[property="og:image"]').attr('content')
      };
      
      // Try to find ingredients (common classes/IDs)
      $('.recipe-ingredient, .ingredient, [itemprop="recipeIngredient"]').each((_i: number, elem: any) => {
        const text = $(elem).text().trim();
        if (text) {
          recipe.ingredients.push({ name: text, amount: '' });
        }
      });
      
      // Try to find instructions
      $('.recipe-instruction, .instruction, .direction, [itemprop="recipeInstructions"]').each((_i: number, elem: any) => {
        const text = $(elem).text().trim();
        if (text) {
          recipe.instructions.push(text);
        }
      });
      
      // If we found some content, return it
      if (recipe.ingredients.length > 0 || recipe.instructions.length > 0) {
        return {
          success: true,
          recipe,
          extractionMethod: 'html-parsing'
        };
      }
      
      // No recipe data found
      return {
        success: false,
        error: 'No recipe data found on this page',
        recipe: null
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
