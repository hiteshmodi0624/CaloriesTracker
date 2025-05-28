import { fetchNutritionForDish } from '../../services/openai';
import { MealIngredient } from '../../../types';

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
export { default as MealIngredients } from './MealIngredients';

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
  // First, try to identify the dish type to generate more accurate ingredients
  const lowercaseDishName = dishName.toLowerCase();
  
  // Identify primary cuisine or dish type
  let dishType = "generic";
  
  if (lowercaseDishName.includes("pasta") || 
      lowercaseDishName.includes("spaghetti") || 
      lowercaseDishName.includes("lasagna") || 
      lowercaseDishName.includes("pizza") ||
      lowercaseDishName.includes("risotto") ||
      lowercaseDishName.includes("carbonara")) {
    dishType = "italian";
  } else if (lowercaseDishName.includes("taco") || 
             lowercaseDishName.includes("burrito") || 
             lowercaseDishName.includes("quesadilla") ||
             lowercaseDishName.includes("enchilada")) {
    dishType = "mexican";
  } else if (lowercaseDishName.includes("burger") || 
             lowercaseDishName.includes("sandwich") || 
             lowercaseDishName.includes("hotdog") ||
             lowercaseDishName.includes("fries")) {
    dishType = "american";
  } else if (lowercaseDishName.includes("stir fry") || 
             lowercaseDishName.includes("fried rice") || 
             lowercaseDishName.includes("curry") ||
             lowercaseDishName.includes("pad thai") ||
             lowercaseDishName.includes("sushi")) {
    dishType = "asian";
  } else if (lowercaseDishName.includes("salad")) {
    dishType = "salad";
  } else if (lowercaseDishName.includes("soup")) {
    dishType = "soup";
  } else if (lowercaseDishName.includes("breakfast") ||
             lowercaseDishName.includes("pancake") ||
             lowercaseDishName.includes("waffle") ||
             lowercaseDishName.includes("oatmeal") ||
             lowercaseDishName.includes("cereal")) {
    dishType = "breakfast";
  }
  
  // Now generate appropriate ingredients based on dish type
  let ingredients: any[] = [];
  
  switch (dishType) {
    case "italian":
      if (lowercaseDishName.includes("pasta") || lowercaseDishName.includes("spaghetti") || lowercaseDishName.includes("carbonara")) {
        ingredients = [
          { name: "Pasta", unit: "oz", quantity: 4, macroRatio: { protein: 0.15, carbs: 0.75, fat: 0.1 }, calorieShare: 0.4 },
          { name: "Sauce", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.1, carbs: 0.4, fat: 0.5 }, calorieShare: 0.3 },
          { name: lowercaseDishName.includes("carbonara") ? "Bacon/Pancetta" : "Ground Meat", unit: "oz", quantity: 3, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.25 },
          { name: "Parmesan Cheese", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.05 }
        ];
      } else if (lowercaseDishName.includes("pizza")) {
        ingredients = [
          { name: "Pizza Dough", unit: "oz", quantity: 6, macroRatio: { protein: 0.1, carbs: 0.8, fat: 0.1 }, calorieShare: 0.4 },
          { name: "Tomato Sauce", unit: "cup", quantity: 0.25, macroRatio: { protein: 0.1, carbs: 0.8, fat: 0.1 }, calorieShare: 0.1 },
          { name: "Cheese", unit: "oz", quantity: 3, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.3 },
          { name: "Toppings", unit: "oz", quantity: 3, macroRatio: { protein: 0.3, carbs: 0.2, fat: 0.5 }, calorieShare: 0.2 }
        ];
      } else if (lowercaseDishName.includes("risotto")) {
        ingredients = [
          { name: "Arborio Rice", unit: "cup", quantity: 0.75, macroRatio: { protein: 0.08, carbs: 0.9, fat: 0.02 }, calorieShare: 0.5 },
          { name: "Broth", unit: "cup", quantity: 1, macroRatio: { protein: 0.5, carbs: 0.4, fat: 0.1 }, calorieShare: 0.1 },
          { name: "Butter/Oil", unit: "tbsp", quantity: 1, macroRatio: { protein: 0, carbs: 0, fat: 1 }, calorieShare: 0.15 },
          { name: "Cheese", unit: "oz", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.15 },
          { name: "Vegetables", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.2, carbs: 0.7, fat: 0.1 }, calorieShare: 0.1 }
        ];
      }
      break;
      
    case "mexican":
      if (lowercaseDishName.includes("taco")) {
        ingredients = [
          { name: "Taco Shells/Tortillas", unit: "piece", quantity: 2, macroRatio: { protein: 0.08, carbs: 0.8, fat: 0.12 }, calorieShare: 0.25 },
          { name: "Ground Meat", unit: "oz", quantity: 4, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.4 },
          { name: "Cheese", unit: "oz", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.15 },
          { name: "Vegetables", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.2, carbs: 0.7, fat: 0.1 }, calorieShare: 0.1 },
          { name: "Salsa", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.05, carbs: 0.9, fat: 0.05 }, calorieShare: 0.1 }
        ];
      } else if (lowercaseDishName.includes("burrito")) {
        ingredients = [
          { name: "Tortilla", unit: "piece", quantity: 1, macroRatio: { protein: 0.1, carbs: 0.75, fat: 0.15 }, calorieShare: 0.25 },
          { name: "Rice", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.08, carbs: 0.9, fat: 0.02 }, calorieShare: 0.2 },
          { name: "Beans", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.3, carbs: 0.65, fat: 0.05 }, calorieShare: 0.2 },
          { name: "Meat", unit: "oz", quantity: 3, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.2 },
          { name: "Cheese", unit: "oz", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.1 },
          { name: "Salsa/Toppings", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.05, carbs: 0.9, fat: 0.05 }, calorieShare: 0.05 }
        ];
      }
      break;
      
    case "american":
      if (lowercaseDishName.includes("burger")) {
        ingredients = [
          { name: "Burger Bun", unit: "piece", quantity: 1, macroRatio: { protein: 0.1, carbs: 0.8, fat: 0.1 }, calorieShare: 0.25 },
          { name: "Beef Patty", unit: "oz", quantity: 6, macroRatio: { protein: 0.5, carbs: 0, fat: 0.5 }, calorieShare: 0.5 },
          { name: "Cheese", unit: "slice", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.1 },
          { name: "Condiments/Toppings", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.05, carbs: 0.5, fat: 0.45 }, calorieShare: 0.15 }
        ];
      } else if (lowercaseDishName.includes("sandwich")) {
        ingredients = [
          { name: "Bread", unit: "slice", quantity: 2, macroRatio: { protein: 0.15, carbs: 0.75, fat: 0.1 }, calorieShare: 0.3 },
          { name: "Meat", unit: "oz", quantity: 3, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.3 },
          { name: "Cheese", unit: "oz", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.05, fat: 0.65 }, calorieShare: 0.15 },
          { name: "Vegetables", unit: "oz", quantity: 2, macroRatio: { protein: 0.2, carbs: 0.7, fat: 0.1 }, calorieShare: 0.05 },
          { name: "Condiments", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.05, carbs: 0.4, fat: 0.55 }, calorieShare: 0.2 }
        ];
      }
      break;
      
    case "asian":
      if (lowercaseDishName.includes("stir fry")) {
        ingredients = [
          { name: "Rice", unit: "cup", quantity: 1, macroRatio: { protein: 0.08, carbs: 0.9, fat: 0.02 }, calorieShare: 0.3 },
          { name: "Meat/Tofu", unit: "oz", quantity: 4, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.3 },
          { name: "Vegetables", unit: "cup", quantity: 1, macroRatio: { protein: 0.2, carbs: 0.7, fat: 0.1 }, calorieShare: 0.2 },
          { name: "Oil", unit: "tbsp", quantity: 1, macroRatio: { protein: 0, carbs: 0, fat: 1 }, calorieShare: 0.1 },
          { name: "Sauce", unit: "tbsp", quantity: 2, macroRatio: { protein: 0.1, carbs: 0.7, fat: 0.2 }, calorieShare: 0.1 }
        ];
      } else if (lowercaseDishName.includes("curry")) {
        ingredients = [
          { name: "Rice", unit: "cup", quantity: 1, macroRatio: { protein: 0.08, carbs: 0.9, fat: 0.02 }, calorieShare: 0.3 },
          { name: "Meat", unit: "oz", quantity: 4, macroRatio: { protein: 0.6, carbs: 0.05, fat: 0.35 }, calorieShare: 0.3 },
          { name: "Curry Sauce", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.1, carbs: 0.4, fat: 0.5 }, calorieShare: 0.3 },
          { name: "Vegetables", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.2, carbs: 0.7, fat: 0.1 }, calorieShare: 0.1 }
        ];
      }
      break;
      
    case "salad":
      ingredients = [
        { name: "Greens", unit: "cup", quantity: 2, macroRatio: { protein: 0.3, carbs: 0.6, fat: 0.1 }, calorieShare: 0.1 },
        { name: "Protein Source", unit: "oz", quantity: 4, macroRatio: { protein: 0.7, carbs: 0.05, fat: 0.25 }, calorieShare: 0.4 },
        { name: "Dressing", unit: "tbsp", quantity: 2, macroRatio: { protein: 0, carbs: 0.2, fat: 0.8 }, calorieShare: 0.3 },
        { name: "Toppings", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.2, carbs: 0.5, fat: 0.3 }, calorieShare: 0.2 }
      ];
      break;
      
    case "breakfast":
      if (lowercaseDishName.includes("pancake") || lowercaseDishName.includes("waffle")) {
        ingredients = [
          { name: lowercaseDishName.includes("pancake") ? "Pancakes" : "Waffles", unit: "piece", quantity: 3, macroRatio: { protein: 0.1, carbs: 0.7, fat: 0.2 }, calorieShare: 0.6 },
          { name: "Syrup", unit: "tbsp", quantity: 2, macroRatio: { protein: 0, carbs: 0.99, fat: 0.01 }, calorieShare: 0.2 },
          { name: "Butter", unit: "tbsp", quantity: 1, macroRatio: { protein: 0, carbs: 0, fat: 1 }, calorieShare: 0.15 },
          { name: "Fruit", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.05, carbs: 0.9, fat: 0.05 }, calorieShare: 0.05 }
        ];
      } else if (lowercaseDishName.includes("oatmeal") || lowercaseDishName.includes("cereal")) {
        ingredients = [
          { name: lowercaseDishName.includes("oatmeal") ? "Oats" : "Cereal", unit: "cup", quantity: 1, macroRatio: { protein: 0.15, carbs: 0.8, fat: 0.05 }, calorieShare: 0.6 },
          { name: "Milk", unit: "cup", quantity: 1, macroRatio: { protein: 0.2, carbs: 0.3, fat: 0.5 }, calorieShare: 0.25 },
          { name: "Fruit/Toppings", unit: "cup", quantity: 0.5, macroRatio: { protein: 0.05, carbs: 0.9, fat: 0.05 }, calorieShare: 0.15 }
        ];
      }
      break;
      
    default:
      // Generic for unknown dish types
      ingredients = [
        { name: "Main Ingredient", unit: "serving", quantity: 1, macroRatio: { protein: 0.3, carbs: 0.4, fat: 0.3 }, calorieShare: 0.5 },
        { name: "Side", unit: "serving", quantity: 1, macroRatio: { protein: 0.2, carbs: 0.6, fat: 0.2 }, calorieShare: 0.3 },
        { name: "Sauce/Condiments", unit: "serving", quantity: 1, macroRatio: { protein: 0.1, carbs: 0.3, fat: 0.6 }, calorieShare: 0.2 }
      ];
      
      // Try to personalize the generic template
      if (dishName.length > 0) {
        ingredients[0].name = `${dishName} (main part)`;
      }
  }
  
  // If we couldn't identify specific ingredients, use the old generic approach
  if (ingredients.length === 0) {
    const id = Date.now().toString();
    return [{
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
    }];
  }
  
  // Convert the ingredients to MealIngredient format
  const result = ingredients.map((ingredient, index) => {
    const id = `${Date.now()}-${index}`;
    const calorieAmount = nutrition.calories * ingredient.calorieShare;
    
    // Calculate macros based on the distribution ratios and calorie share
    const proteinCals = calorieAmount * ingredient.macroRatio.protein;
    const carbsCals = calorieAmount * ingredient.macroRatio.carbs;
    const fatCals = calorieAmount * ingredient.macroRatio.fat;
    
    // Convert calories to grams (protein: 4cal/g, carbs: 4cal/g, fat: 9cal/g)
    const proteinGrams = proteinCals / 4;
    const carbsGrams = carbsCals / 4;
    const fatGrams = fatCals / 9;
    
    return {
      id,
      ingredientId: id,
      name: ingredient.name,
      unit: ingredient.unit,
      quantity: ingredient.quantity,
      nutrition: {
        calories: Math.round(calorieAmount),
        protein: Math.round(proteinGrams * 10) / 10,
        carbs: Math.round(carbsGrams * 10) / 10,
        fat: Math.round(fatGrams * 10) / 10,
      },
    };
  });
  
  return result;
};

// Function to quick-add a dish using AI-generated ingredients
export const addQuickDish = async (
  dishName: string,
  setIngredients: (ingredients: MealIngredient[]) => void,
  onDishNameChange: (name: string) => void,
  setIsAddingQuickDish: (isAdding: boolean) => void
) => {
  try {
    setIsAddingQuickDish(true);
    
    // Use the improved fetchNutritionForDish function that now returns ingredients
    const dishWithIngredients = await fetchNutritionForDish(dishName);
    
    // Set the dish name (in case it was refined by the API)
    onDishNameChange(dishWithIngredients.name);
    
    // Map the ingredients to the MealIngredient format
    const ingredients: MealIngredient[] = dishWithIngredients.ingredients.map(ing => ({
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      nutrition: {
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat
      }
    }));
    
    // Update the ingredients in the parent component
    setIngredients(ingredients);
    
  } catch (error) {
    console.error('Error adding quick dish:', error);
    alert('Failed to generate ingredients for this dish. Please try again or add ingredients manually.');
  } finally {
    setIsAddingQuickDish(false);
  }
};