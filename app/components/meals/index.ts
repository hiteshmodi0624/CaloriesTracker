// Export created components
export { default as CreateMealScreen } from './CreateMealScreen';
export { default as SavedDishesModal } from './SavedDishesModal';
export { default as MealForm } from './MealForm';
export { default as DishManagement } from './DishManagement';
export { default as SaveMealButton } from './SaveMealButton';
export { default as CreateDishModal } from './CreateDishModal';
export { default as DishItem } from './DishItem';
export { default as NutritionSummary } from './NutritionSummary';
export { default as Snackbar } from './Snackbar';
export { default as QuantityModal } from './QuantityModal';
export { default as IngredientSelectionModal } from './IngredientSelectionModal';

// Helper functions
export const getBaseQuantityForUnit = (unit: string): number => {
  // Default base quantities for common units
  switch (unit) {
    case 'g':
    case 'gram':
    case 'grams':
      return 100; // 100 grams
    case 'ml':
    case 'milliliter':
    case 'milliliters':
      return 100; // 100 ml
    case 'cup':
    case 'cups':
      return 1; // 1 cup
    case 'oz':
    case 'ounce':
    case 'ounces':
      return 1; // 1 ounce
    case 'tbsp':
    case 'tablespoon':
    case 'tablespoons':
      return 1; // 1 tablespoon
    case 'tsp':
    case 'teaspoon':
    case 'teaspoons':
      return 1; // 1 teaspoon
    case 'slice':
    case 'slices':
      return 1; // 1 slice
    case 'piece':
    case 'pieces':
      return 1; // 1 piece
    case 'serving':
    case 'servings':
      return 1; // 1 serving
    default:
      return 1; // Default to 1 for unknown units
  }
};

// Function to generate estimated ingredients based on dish name and nutrition
export const generateEstimatedIngredients = async (
  dishName: string, 
  nutrition: { calories: number; protein: number; carbs: number; fat: number }
) => {
  // Example implementation that creates dummy ingredients
  // In a real app, this should call an AI service or use a more sophisticated algorithm
  
  const id = Date.now().toString();
  const dummyIngredient = {
    id,
    ingredientId: id,
    name: `${dishName} (estimated)`,
    unit: 'serving',
    quantity: 1,
    nutrition: {
      calories: nutrition.calories,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
    },
  };
  
  return [dummyIngredient];
}; 