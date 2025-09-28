import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Recipe } from '@/lib/types/recipe';

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

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
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
      
      return NextResponse.json({
        success: true,
        recipe,
        extractionMethod: 'schema.org',
        debug: {
          foundJsonLd: true,
          rawData: jsonLdRecipe
        }
      });
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
    
    return NextResponse.json({
      success: recipe.ingredients.length > 0 || recipe.instructions.length > 0,
      recipe,
      extractionMethod: 'html-parsing',
      debug: {
        foundJsonLd: false,
        ingredientsFound: recipe.ingredients.length,
        instructionsFound: recipe.instructions.length
      }
    });
    
  } catch (error) {
    console.error('Error extracting recipe:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}