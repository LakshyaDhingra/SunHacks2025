export interface Recipe {
  name: string;
  url: string;
  image?: string;
  description?: string;
  ingredients: Array<{
    name: string;
    amount?: string;
  }>;
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: number;
  nutrition?: {
    calories?: string;
    protein?: string;
    carbohydrates?: string;
    fat?: string;
  };
  author?: string;
  datePublished?: string;
}

export interface RecipeSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}