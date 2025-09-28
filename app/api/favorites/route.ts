import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


// Get user's bookmarks
export async function GET() {
  const { data: {session} } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

    // Convert back to Recipe format
  const recipes = data.map(bookmark => ({
    name: bookmark.recipe_name,
    url: bookmark.recipe_url,
    image: bookmark.recipe_image,
    description: bookmark.recipe_description,
    ingredients: bookmark.ingredients,
    instructions: bookmark.instructions,
    prepTime: bookmark.prep_time,
    cookTime: bookmark.cook_time,
    totalTime: bookmark.total_time,
    servings: bookmark.servings,
    nutrition: bookmark.nutrition,
    author: bookmark.author,
    datePublished: bookmark.date_published,
  }));

  return Response.json(recipes);
}

export async function POST(request: NextRequest) {
    const { data: {session} } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipe = await request.json();

    const { data, error } = await supabase
        .from('bookmarks')
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
            return Response.json({ error: 'Bookmark already exists' }, { status: 409 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Bookmark added successfully' }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { data: {session} } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeName, recipeUrl } = await request.json();

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_name', recipeName)
        .eq('recipe_url', recipeUrl)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Bookmark deleted successfully' }, { status: 200 });
}