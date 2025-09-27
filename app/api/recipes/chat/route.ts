import { streamRecipeSearch } from '@/lib/agents/recipe-agent';
import { UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, ingredients, preferences } = await req.json();
    
    // If we have ingredients directly (from a form), use them
    if (ingredients && Array.isArray(ingredients)) {
      const result = await streamRecipeSearch(ingredients, preferences);
      return result.toUIMessageStreamResponse();
    }
    
    // Otherwise, use the chat messages approach
    if (messages && Array.isArray(messages)) {
      // Extract ingredients from the last user message if not provided directly
      const lastUserMessage = messages.filter((m: UIMessage) => m.role === 'user').pop();
      
      if (lastUserMessage) {
        // Parse ingredients from the message content
        const messageText = typeof lastUserMessage.content === 'string' 
          ? lastUserMessage.content 
          : lastUserMessage.content.find((p: any) => p.type === 'text')?.text || '';
        
        // Simple ingredient extraction (could be improved with NLP)
        const ingredientList = messageText
          .toLowerCase()
          .replace(/i have|i've got|ingredients:|the following|these/gi, '')
          .split(/[,;]/)
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 0);
        
        if (ingredientList.length > 0) {
          const result = await streamRecipeSearch(ingredientList, preferences);
          return result.toUIMessageStreamResponse();
        }
      }
      
      // Fallback to agent response if no ingredients could be extracted
      return new Response('Please provide ingredients to search for recipes', {
        status: 400,
      });
    }
    
    return new Response('Invalid request format', { status: 400 });
  } catch (error) {
    console.error('Error in recipe chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process recipe request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}