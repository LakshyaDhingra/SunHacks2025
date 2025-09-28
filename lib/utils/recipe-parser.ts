import { Recipe } from '@/lib/types/recipe';

// Identify the first complete JSON array in the streamed text
function findCompleteJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start === -1) {
    return null;
  }

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseRecipesFromMarkdown(text: string): Recipe[] {
  const recipes: Recipe[] = [];

  // Split text by recipe sections (looking for numbered headers)
  const recipeSections = text.split(/###\s+\d+\.\s+/);

  for (let i = 1; i < recipeSections.length; i++) {
    const section = recipeSections[i];
    const recipe = parseRecipeSection(section);
    if (recipe) {
      recipes.push(recipe);
    }
  }

  return recipes;
}

function parseRecipeSection(section: string): Recipe | null {
  try {
    const lines = section.split('\n').map(l => l.trim());

    // Extract recipe name (first line)
    const name = lines[0].replace(/\*+/g, '').trim();
    if (!name) return null;

    const recipe: Recipe = {
      name,
      url: '#',
      description: '',
      ingredients: [],
      instructions: []
    };

    let currentSection = '';

    for (const line of lines) {
      // Skip empty lines
      if (!line) continue;

      // Detect sections
      if (line.toLowerCase().includes('description:')) {
        currentSection = 'description';
        const desc = line.split(':')[1]?.trim().replace(/\*+/g, '');
        if (desc) recipe.description = desc;
      } else if (line.toLowerCase().includes('prep time:')) {
        recipe.prepTime = line.split(':')[1]?.trim().replace(/\*+/g, '');
      } else if (line.toLowerCase().includes('cook time:')) {
        recipe.cookTime = line.split(':')[1]?.trim().replace(/\*+/g, '');
      } else if (line.toLowerCase().includes('total time:')) {
        recipe.totalTime = line.split(':')[1]?.trim().replace(/\*+/g, '');
      } else if (line.toLowerCase().includes('servings:') || line.toLowerCase().includes('serves:')) {
        const servingsStr = line.split(':')[1]?.trim().replace(/\D/g, '');
        if (servingsStr) recipe.servings = parseInt(servingsStr);
      } else if (line.toLowerCase().includes('ingredients:')) {
        currentSection = 'ingredients';
      } else if (line.toLowerCase().includes('instructions:')) {
        currentSection = 'instructions';
      } else if (line.toLowerCase().includes('nutrition')) {
        currentSection = 'nutrition';
        if (!recipe.nutrition) recipe.nutrition = {};
      } else if (currentSection === 'ingredients' && line.startsWith('*')) {
        // Parse ingredient line
        const ingText = line.replace(/^\*\s*/, '').trim();
        const match = ingText.match(/^([\d\/.]+\s*\w+)?\s*(.+)$/);
        if (match) {
          recipe.ingredients.push({
            amount: match[1]?.trim() || '',
            name: match[2]?.trim() || ingText
          });
        }
      } else if (currentSection === 'instructions' && /^\d+\./.test(line)) {
        // Parse instruction line
        const instruction = line.replace(/^\d+\.\s*/, '').trim();
        if (instruction) {
          recipe.instructions.push(instruction);
        }
      } else if (currentSection === 'nutrition') {
        // Parse nutrition info
        if (line.toLowerCase().includes('calories:')) {
          recipe.nutrition!.calories = line.split(':')[1]?.trim().replace(/[^\d]/g, '') || undefined;
        } else if (line.toLowerCase().includes('protein:')) {
          recipe.nutrition!.protein = line.split(':')[1]?.trim() || undefined;
        } else if (line.toLowerCase().includes('carbohydrates:')) {
          recipe.nutrition!.carbohydrates = line.split(':')[1]?.trim() || undefined;
        } else if (line.toLowerCase().includes('fat:')) {
          recipe.nutrition!.fat = line.split(':')[1]?.trim() || undefined;
        }
      }
    }

    // Only return if we have meaningful content
    if (recipe.ingredients.length > 0 || recipe.instructions.length > 0) {
      return recipe;
    }

    return null;
  } catch (error) {
    console.error('Error parsing recipe section:', error);
    return null;
  }
}

// Parse status updates and recipes from the new format
export function parseStreamedRecipeResponse(text: string): {
  status: string;
  recipes: Recipe[];
  hasCompleteJson: boolean;
} {
  // Find the marker that separates status from recipes
  const markerIndex = text.indexOf('[RECIPES_START]');
  
  if (markerIndex === -1) {
    // No recipes yet, extract status updates with [STATUS] prefix
    const statusPattern = /\[STATUS\]([^\n]+)/g;
    const statusMatches = Array.from(text.matchAll(statusPattern));
    
    // Get the last status message (remove the [STATUS] prefix and clean it)
    const lastStatus = statusMatches.length > 0 
      ? statusMatches[statusMatches.length - 1][1].trim()
      : '';
    
    return {
      status: lastStatus,
      recipes: [],
      hasCompleteJson: false
    };
  }
  
  // Split into status and recipe parts
  const statusText = text.substring(0, markerIndex).trim();
  const recipesText = text.substring(markerIndex + '[RECIPES_START]'.length).trim();
  
  let recipes: Recipe[] = [];
  let hasCompleteJson = false;
  
  const jsonCandidate = findCompleteJsonArray(recipesText);

  if (jsonCandidate) {
    try {
      const parsed = JSON.parse(jsonCandidate);

      if (Array.isArray(parsed)) {
        recipes = parsed
          .filter(item => {
            if (!item || typeof item !== 'object') return false;

            if (item.recipe && typeof item.recipe === 'object') {
              return true;
            }

            if (item.name || item.title) {
              return true;
            }

            return false;
          })
          .map(item => {
            if (item.recipe && typeof item.recipe === 'object') {
              return item.recipe;
            }
            return item;
          });

        hasCompleteJson = true;
      }
    } catch (error) {
      console.error('Error parsing recipe JSON:', error);
      console.log('JSON candidate snippet:', jsonCandidate.substring(0, 200));
    }
  }
  
  // Extract the last status message with [STATUS] prefix
  const statusPattern = /\[STATUS\]([^\n]+)/g;
  const statusMatches = Array.from(statusText.matchAll(statusPattern));
  const lastStatus = statusMatches.length > 0 
    ? statusMatches[statusMatches.length - 1][1].trim()
    : '';
  
  return {
    status: lastStatus,
    recipes,
    hasCompleteJson
  };
}

// Alternative parser for tool-generated JSON in the stream
export function extractToolCallResults(text: string): Recipe[] {
  const recipes: Recipe[] = [];

  // Look for tool call results in the text  
  const toolCallPattern = new RegExp('```json\\n(.*?)\\n```', 'gs');
  const matches = Array.from(text.matchAll(toolCallPattern));

  for (const match of matches) {
    try {
      const json = JSON.parse(match[1]);
      if (json.recipe && typeof json.recipe === 'object') {
        recipes.push(json.recipe);
      } else if (json.results && Array.isArray(json.results)) {
        // Handle search results
        for (const result of json.results) {
          if (result.recipe) {
            recipes.push(result.recipe);
          }
        }
      }
    } catch (e) {
      // Not valid JSON, skip
    }
  }

  return recipes;
}
