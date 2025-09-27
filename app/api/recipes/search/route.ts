import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {stepCountIs, streamText} from 'ai';

import {recipeExtractionTool, recipeSearchTool} from '@/lib/tools/recipe-tools';

export const maxDuration = 60;

// Initialize Google Generative AI with Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
    3. Continue searching until you have AT LEAST 3 recipes
    
    Search strategy:
    - First search with all ingredients together
    - If you get less than 5 results, search again with variations (e.g., "chicken rice casserole", "chicken fried rice", etc.)
    - Extract recipes from different sources for variety
    - If extraction fails for a URL, try the next one
    
    Output format:
    - Provide brief status updates as you work, ONE PER LINE
    - Examples:
      "🔍 Searching for chicken rice recipes..."
      "📖 Extracting recipe from AllRecipes..."
      "⚠️ Extraction failed, trying next..."
      "✅ Found 3 matching recipes"
    - Keep status updates short and action-focused
    - After gathering all recipes, output: [RECIPES_START] followed by a JSON array of the extracted recipe objects
    - The JSON should contain the actual recipe objects returned from the extractRecipe tool
    - Make sure each status update is on its own line
    
    Important:
    - MUST find at least 3 recipes (keep searching if needed)
    - Maximum 5 recipes
    - Try different search queries if the first doesn't yield enough results
    - If extraction fails, note it and try another URL
    - No conversational text or explanations
    - Just status updates, then [RECIPES_START] marker, then JSON array`;

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
    return result.toTextStreamResponse();
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
