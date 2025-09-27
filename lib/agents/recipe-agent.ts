import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { recipeSearchTool, recipeExtractionTool } from '@/lib/tools/recipe-tools-enhanced';

// Initialize Google Generative AI with Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Create the Recipe Finding Agent
export const recipeAgent = new Agent({
  model: google('gemini-2.5-flash'), // Using flash for faster responses
  system: `You are a helpful recipe assistant that helps users find recipes based on their available ingredients.
    
    Your workflow:
    1. When users provide ingredients, search for relevant recipes using the search tool
    2. For each promising recipe URL found, extract the full recipe details using the extraction tool
    3. Present the recipes in a clear, organized format
    
    Always:
    - Be friendly and encouraging
    - Consider dietary restrictions if mentioned
    - Suggest recipes that use most of the provided ingredients
    - Provide brief descriptions of why each recipe might be a good choice
    - If extraction fails for a recipe, mention it but continue with others`,

  tools: {
    searchRecipes: recipeSearchTool,
    extractRecipe: recipeExtractionTool,
  },

  // Allow up to 10 steps for searching and extracting multiple recipes
  stopWhen: stepCountIs(10),
});

// Alternative function-based approach for more control
import { streamText, generateText } from 'ai';

export async function findRecipesWithIngredients(
  ingredients: string[],
  preferences?: {
    dietary?: string;
    cuisine?: string;
    maxTime?: number;
  }
) {
  const model = google('gemini-1.5-pro'); // Pro model for better reasoning

  const systemPrompt = `You are a recipe finding assistant. 
    Search for recipes using the provided ingredients, then extract detailed information for each recipe found.
    Consider any dietary preferences or constraints mentioned.`;

  const userPrompt = `Find recipes I can make with these ingredients: ${ingredients.join(', ')}.
    ${preferences?.dietary ? `Dietary preference: ${preferences.dietary}` : ''}
    ${preferences?.cuisine ? `Cuisine preference: ${preferences.cuisine}` : ''}
    ${preferences?.maxTime ? `Maximum cooking time: ${preferences.maxTime} minutes` : ''}`;

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      searchRecipes: recipeSearchTool,
      extractRecipe: recipeExtractionTool,
    },
    stopWhen: stepCountIs(8),
  });

  return result;
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
