export type NutritionInfo = {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  nutrition: NutritionInfo;
};

export type MealIngredient = {
  id: string;
  ingredientId?: string;
  name: string;
  unit: string;
  quantity: number;
  nutrition: NutritionInfo;
};

export type Dish = {
  id: string;
  name: string;
  ingredients: MealIngredient[];
  totalCalories: number;
};

export type Meal = {
  id: string;
  name: string;
  date: string;
  ingredients: MealIngredient[];
  dishes?: Dish[];
  totalCalories: number;
  imageUri?: string;
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  activityLevel: 'sedentary' | 'lightly active' | 'moderately active' | 'very active' | 'extra active';
  goal: 'lose weight' | 'gain weight' | 'maintain' | 'build muscle';
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
}; 