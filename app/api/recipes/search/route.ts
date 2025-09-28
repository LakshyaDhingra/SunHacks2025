import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {stepCountIs, streamText} from 'ai';

import {recipeExtractionTool, recipeSearchTool} from '@/lib/tools/recipe-tools';
import {Recipe} from '@/lib/types/recipe';

export const maxDuration = 60;

// Initialize Google Generative AI with Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const encoder = new TextEncoder();

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeRecipe(raw: any): Recipe | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const name = sanitizeString(raw.name) || sanitizeString(raw.title);
  const url = sanitizeUrl(raw.url);

  let imageCandidate: unknown = raw.image;
  if (Array.isArray(imageCandidate) && imageCandidate.length > 0) {
    imageCandidate = imageCandidate[0];
  } else if (imageCandidate && typeof imageCandidate === 'object' && 'url' in imageCandidate) {
    imageCandidate = (imageCandidate as {url?: unknown}).url;
  }
  const image = sanitizeUrl(imageCandidate);

  if (!name || !url || !image) {
    return null;
  }

  const ingredientSource = Array.isArray(raw.ingredients)
    ? raw.ingredients
    : Array.isArray(raw.recipeIngredient)
      ? raw.recipeIngredient
      : [];

  const ingredients = ingredientSource
    .map((entry: any) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        const text = entry.trim();
        if (!text) return null;
        return { name: text, amount: '' };
      }

      const nameValue = sanitizeString(entry.name) || sanitizeString(entry.ingredient);
      if (!nameValue) return null;

      const amountValue = sanitizeString(entry.amount) || sanitizeString(entry.quantity);
      return {
        name: nameValue,
        amount: amountValue,
      };
    })
    .filter((item): item is Recipe['ingredients'][number] => !!item && !!item.name);

  const instructionSource = Array.isArray(raw.instructions)
    ? raw.instructions
    : Array.isArray(raw.recipeInstructions)
      ? raw.recipeInstructions
      : [];

  const instructions = instructionSource
    .map((entry: any) => {
      if (!entry) return undefined;
      if (typeof entry === 'string') return entry.trim();
      if (typeof entry === 'object') {
        return sanitizeString(entry.text) || sanitizeString(entry.name);
      }
      return undefined;
    })
    .filter((step): step is string => !!step && step.length > 0);

  if (ingredients.length === 0 || instructions.length === 0) {
    return null;
  }

  const servingsValue = typeof raw.servings === 'number'
    ? raw.servings
    : sanitizeString(raw.servings || raw.recipeYield);

  const servings = typeof servingsValue === 'number'
    ? servingsValue
    : servingsValue
      ? parseInt(servingsValue.replace(/[^\d]/g, ''), 10) || undefined
      : undefined;

  const nutritionSource = typeof raw.nutrition === 'object' && raw.nutrition
    ? raw.nutrition
    : undefined;

  const recipe: Recipe = {
    name,
    url,
    image,
    description: sanitizeString(raw.description),
    ingredients,
    instructions,
    prepTime: sanitizeString(raw.prepTime),
    cookTime: sanitizeString(raw.cookTime),
    totalTime: sanitizeString(raw.totalTime),
    servings,
    nutrition: nutritionSource
      ? {
          calories: sanitizeString(nutritionSource.calories),
          protein: sanitizeString(nutritionSource.protein || nutritionSource.proteinContent),
          carbohydrates: sanitizeString(nutritionSource.carbohydrates || nutritionSource.carbohydrateContent),
          fat: sanitizeString(nutritionSource.fat || nutritionSource.fatContent),
        }
      : undefined,
    author: sanitizeString(raw.author?.name ?? raw.author),
    datePublished: sanitizeString(raw.datePublished),
  };

  return recipe;
}

// Streaming version for real-time updates
export async function streamRecipeSearch(
    ingredients: string[],
    preferences?: {
      dietary?: string;
      cuisine?: string;
      maxTime?: number;
    }
) {
  const model = google('gemini-2.5-flash');

  const systemPrompt = `You are a recipe search assistant that provides status updates while working.
    
    Your task:
    1. Search for recipes using the ingredients provided
    2. Extract full recipe details from promising URLs
    3. Continue searching until you have AT LEAST 4 recipes
    
    Search strategy:
    - First search with all ingredients together
    - If you get less than 5 results, search again with variations (e.g., "chicken rice casserole", "chicken fried rice", etc.)
    - Extract recipes from different sources for variety
    - If extraction fails for a URL, try the next one
    
    Output format:
    - Each status update MUST be on its own line followed by TWO newlines
    - Prefix each status with [STATUS] for parsing
    - Examples:
      "[STATUS]🔍 Searching for chicken rice recipes...

"
      "[STATUS]📖 Extracting recipe from AllRecipes...

"
      "[STATUS]⚠️ Extraction failed, trying next...

"
      "[STATUS]✅ Found 4 matching recipes

"
    - Keep status updates short and action-focused
    - Provide status updates only. Do NOT output [RECIPES_START] or any JSON.
    - Once you have gathered 3-5 valid recipes with images, finish with a success status like "[STATUS]✅ Found 3 matching recipes".
    - The system will stream the final recipe JSON after you finish.
    
    Important:
    - MUST find at least 4 recipes (keep searching if needed)
    - Maximum 5 recipes
    - ONLY include recipes that have images (if extraction returns no image, skip it)
    - If a recipe has no image, show status "[STATUS]⚠️ No image found, skipping..." and try the next
    - Keep searching until you have 3-5 recipes WITH images
    - Try different search queries if the first doesn't yield enough results
    - If extraction fails, note it and try another URL
    - No conversational text or explanations
    - Only emit status updates prefixed with [STATUS]`;

  const userPrompt = `Ingredients: ${ingredients.join(', ')}
    ${preferences?.dietary ? `Dietary: ${preferences.dietary}` : ''}
    ${preferences?.cuisine ? `Cuisine: ${preferences.cuisine}` : ''}
    ${preferences?.maxTime ? `Max time: ${preferences.maxTime} minutes` : ''}
    
    Find and extract recipes.`;

  return streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      searchRecipes: recipeSearchTool,
      extractRecipe: recipeExtractionTool,
    },
    stopWhen: stepCountIs(20),
  });
}

export async function POST(req: Request) {
  try {
    const { ingredients, preferences } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response('Please provide ingredients', { status: 400 });
    }

    console.log("Received request with ingredients:", ingredients);
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    const result = await streamRecipeSearch(ingredients, preferences);

    console.log("Stream result created successfully");
    const recipes: Recipe[] = [];
    const seenUrls = new Set<string>();
    let finalEmitted = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              controller.enqueue(encoder.encode(part.text));
            } else if (part.type === 'tool-result' && part.toolName === 'extractRecipe' && !part.preliminary) {
              const output = part.output as { success?: boolean; recipe?: unknown } | undefined;
              if (!output?.success || !output.recipe) continue;
              const normalized = normalizeRecipe(output.recipe);
              if (!normalized) continue;
              if (seenUrls.has(normalized.url)) continue;
              if (recipes.length >= 5) {
                seenUrls.add(normalized.url);
                continue;
              }
              seenUrls.add(normalized.url);
              recipes.push(normalized);
            } else if (part.type === 'finish' && !finalEmitted) {
              const payload = `[RECIPES_START]${JSON.stringify(recipes)}`;
              controller.enqueue(encoder.encode(`\n${payload}`));
              finalEmitted = true;
            }
          }
        } catch (error) {
          console.error('Error while streaming recipe search:', error);
          if (!finalEmitted) {
            const status = '\n[STATUS]⚠️ Encountered an error, returning available recipes.\n\n';
            controller.enqueue(encoder.encode(status));
            const payload = `[RECIPES_START]${JSON.stringify(recipes)}`;
            controller.enqueue(encoder.encode(`\n${payload}`));
            finalEmitted = true;
          }
        } finally {
          if (!finalEmitted) {
            const payload = `[RECIPES_START]${JSON.stringify(recipes)}`;
            controller.enqueue(encoder.encode(`\n${payload}`));
            finalEmitted = true;
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Error in recipe search API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({
        error: 'Failed to search recipes',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
