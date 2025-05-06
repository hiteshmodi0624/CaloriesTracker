export interface NutritionInfo {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  nutrition: NutritionInfo;
}

export interface MealIngredient {
  id: string;
  ingredientId?: string;
  name: string;
  unit: string;
  quantity: number;
  nutrition: NutritionInfo;
}

export interface Meal {
  id: string;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  ingredients: MealIngredient[];
  totalCalories: number;
  imageUri?: string;
} 