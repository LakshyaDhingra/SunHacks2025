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

  const systemPrompt = `You are a helpful recipe assistant. 
    Your task is to:
    1. Search for recipes based on available ingredients
    2. Extract detailed recipe information
    3. Present recipes clearly with all details
    
    Be conversational and helpful throughout the process.`;

  const userPrompt = `I have these ingredients: ${ingredients.join(', ')}.
    ${preferences?.dietary ? `I follow a ${preferences.dietary} diet.` : ''}
    ${preferences?.cuisine ? `I prefer ${preferences.cuisine} cuisine.` : ''}
    ${preferences?.maxTime ? `I have ${preferences.maxTime} minutes to cook.` : ''}
    
    Please find me some recipes I can make!`;

  return streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      searchRecipes: recipeSearchTool,
      extractRecipe: recipeExtractionTool,
    },
    stopWhen: stepCountIs(8),
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
