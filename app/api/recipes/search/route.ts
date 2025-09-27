import { streamRecipeSearch } from '@/lib/agents/recipe-agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { ingredients, preferences } = await req.json();
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response('Please provide ingredients', { status: 400 });
    }
    
    const result = await streamRecipeSearch(ingredients, preferences);
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in recipe search API:', error);
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