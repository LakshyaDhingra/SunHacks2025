import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);


// Get user's favorite recipes
export async function GET() {
  const { userId } = await auth(); // Use Clerk's auth instead
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('favorite_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

    // Convert back to Recipe format
  const recipes = data.map(favorite_recipes => ({
    name: favorite_recipes.recipe_name,
    url: favorite_recipes.recipe_url,
    image: favorite_recipes.recipe_image,
    description: favorite_recipes.recipe_description,
    ingredients: favorite_recipes.ingredients,
    instructions: favorite_recipes.instructions,
    prepTime: favorite_recipes.prep_time,
    cookTime: favorite_recipes.cook_time,
    totalTime: favorite_recipes.total_time,
    servings: favorite_recipes.servings,
    nutrition: favorite_recipes.nutrition,
    author: favorite_recipes.author,
    datePublished: favorite_recipes.date_published,
  }));

  return Response.json(recipes);
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();  // Use Clerk's auth instead

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`${userId} is adding a favorite recipe`);

    const recipe = await request.json();
    console.log(`${JSON.stringify(recipe)}`);

    const { data, error } = await supabase
        .from('favorite_recipes')
        .insert([{
            user_id: userId,
            recipe_name: recipe.name,
            recipe_url: recipe.url,
            recipe_image: recipe.image,
            recipe_description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            prep_time: recipe.prepTime,
            cook_time: recipe.cookTime,
            total_time: recipe.totalTime,
            servings: recipe.servings,
            nutrition: recipe.nutrition,
            author: recipe.author,
            date_published: recipe.datePublished,
        }])

    if (error) {
        if (error.code === '23505') { // Unique violation
            return Response.json({ error: 'Favorite recipe already exists' }, { status: 409 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Favorite recipe added successfully' }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { userId } = await auth();  // Use Clerk's auth instead

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeName, recipeUrl } = await request.json();

    const { error } = await supabase
        .from('favorite_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_name', recipeName)
        .eq('recipe_url', recipeUrl)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Favorite recipe deleted successfully' }, { status: 200 });
}