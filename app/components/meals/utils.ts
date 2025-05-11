import { MealIngredient, NutritionInfo } from '../../../types';

/**
 * Determines the appropriate base quantity for a given unit of measurement
 * Weight-based units use 100 as standard, volume and count-based units use 1
 */
export const getBaseQuantityForUnit = (unit: string): number => {
  // Weight-based units use 100 as standard
  if (['grams', 'g', 'oz', 'ml'].includes(unit.toLowerCase())) {
    return 100;
  }
  // Volume and count-based units use 1 as standard
  return 1;
};

/**
 * Calculates total nutrition values from an array of meal ingredients
 */
export const calculateTotalNutrition = (items: MealIngredient[]): NutritionInfo => {
  return items.reduce((sum, item) => {
    return {
      calories: sum.calories + item.nutrition.calories,
      protein: (sum.protein || 0) + (item.nutrition.protein || 0),
      carbs: (sum.carbs || 0) + (item.nutrition.carbs || 0),
      fat: (sum.fat || 0) + (item.nutrition.fat || 0),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

/**
 * Generates estimated ingredients for a dish with given nutrition information
 */
export const generateEstimatedIngredients = async (
  dishName: string, 
  totalNutrition: NutritionInfo
): Promise<MealIngredient[]> => {
  try {
    // Validate input nutrition values
    if (!totalNutrition || typeof totalNutrition.calories !== 'number' || totalNutrition.calories <= 0) {
      console.warn('Invalid input nutrition for estimated ingredients, using defaults', totalNutrition);
      totalNutrition = {
        calories: 250, 
        protein: 10,
        carbs: 30,
        fat: 10
      };
    }
    
    console.log('Generating estimated ingredients for:', dishName, 'with calories:', totalNutrition.calories);
  
    // Create 2-4 estimated ingredients for the dish
    const ingredientCount = Math.floor(Math.random() * 3) + 2; // 2-4 ingredients
    const estimatedIngredients: MealIngredient[] = [];
    
    // Calculate distribution of calories and macros
    const caloriesPerIngredient = totalNutrition.calories / ingredientCount;
    const proteinPerIngredient = (totalNutrition.protein || 0) / ingredientCount;
    const carbsPerIngredient = (totalNutrition.carbs || 0) / ingredientCount;
    const fatPerIngredient = (totalNutrition.fat || 0) / ingredientCount;
    
    // Example ingredients based on the dish name
    const possibleIngredients = [
      { name: `${dishName} main component`, unit: 'g', basePortion: 100 },
      { name: 'Mixed vegetables', unit: 'g', basePortion: 50 },
      { name: 'Sauce', unit: 'ml', basePortion: 30 },
      { name: 'Protein source', unit: 'g', basePortion: 80 },
      { name: 'Carb source', unit: 'g', basePortion: 60 },
      { name: 'Garnish', unit: 'g', basePortion: 10 },
    ];
    
    // Shuffle and pick ingredients
    const shuffled = [...possibleIngredients].sort(() => 0.5 - Math.random());
    const selectedIngredients = shuffled.slice(0, ingredientCount);
    
    // Create ingredient objects with distributed nutrition
    selectedIngredients.forEach((ingredient, index) => {
      // Adjust nutrition slightly for each ingredient to seem more realistic
      const calorieAdjustment = 0.8 + Math.random() * 0.4; // 0.8-1.2 multiplier
      const calories = caloriesPerIngredient * calorieAdjustment;
      
      // Ensure calories are never zero or negative
      const safeCalories = Math.max(1, calories);
      
      // Adjust macros proportionally
      const macroAdjustment = safeCalories / caloriesPerIngredient;
      
      const newIngredient: MealIngredient = {
        id: Date.now().toString() + index,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: ingredient.basePortion,
        nutrition: {
          calories: safeCalories,
          protein: Math.max(0, proteinPerIngredient * macroAdjustment),
          carbs: Math.max(0, carbsPerIngredient * macroAdjustment),
          fat: Math.max(0, fatPerIngredient * macroAdjustment)
        }
      };
      
      console.log(`Ingredient ${index+1}: ${newIngredient.name} - ${safeCalories.toFixed(1)} calories`);
      estimatedIngredients.push(newIngredient);
    });
    
    // Verify total calories
    const totalCals = estimatedIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
    console.log(`Total calories in generated ingredients: ${totalCals.toFixed(1)}`);
    
    return estimatedIngredients;
    
  } catch (error) {
    console.error('Error generating estimated ingredients:', error);
    
    // Fallback to a single generic ingredient with default calories
    console.log('Using fallback single ingredient with default calories');
    return [{
      id: Date.now().toString(),
      name: `${dishName} (estimated)`,
      unit: 'serving',
      quantity: 1,
      nutrition: {
        calories: 250,
        protein: 10,
        carbs: 30,
        fat: 5
      }
    }];
  }
}; 