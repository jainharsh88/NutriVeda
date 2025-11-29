export enum CuisineType {
  North = 'North Indian',
  South = 'South Indian',
  East = 'East Indian',
  West = 'West Indian',
  Fusion = 'Fusion'
}

export enum DietType {
  Veg = 'Vegetarian',
  NonVeg = 'Non-Vegetarian',
  Vegan = 'Vegan',
  Jain = 'Jain'
}

export interface Ingredient {
  name: string;
  quantity?: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  cuisine: CuisineType;
  prepTime: string; // e.g., "30 mins"
  calories: number;
  ingredients: Ingredient[];
  steps: string[];
  healthTags: string[];
  isFavorite: boolean;
  description?: string;
}

export interface UserPreferences {
  name: string;
  allergies: string[];
  dietaryPreference: DietType;
  deficiencies: string[];
}

export interface ShoppingItem extends Ingredient {
  id: string;
  checked: boolean;
  recipeName?: string;
}

export type ViewState = 'dashboard' | 'kitchen' | 'shopping' | 'recommend' | 'profile';
