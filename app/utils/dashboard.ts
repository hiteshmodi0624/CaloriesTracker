import { Meal } from '../../types';

export type DayDataSummary = {
  date: string;
  meals: Meal[];
  mealCount: number;
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  }
};

/**
 * Calculate total calories from a set of meals
 */
export const calculateTotalCalories = (meals: Meal[]): number => {
  return meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
};

/**
 * Calculate total macros from a set of meals
 */
export const calculateMacros = (meals: Meal[]) => {
  const protein = meals.reduce((sum, meal) => {
    // Get protein from individual ingredients
    const ingredientsProtein = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.protein || 0), 0
    );
    
    // Get protein from dishes
    const dishesProtein = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.protein || 0), 0
      );
    }, 0);
    
    return sum + ingredientsProtein + dishesProtein;
  }, 0);
  
  const carbs = meals.reduce((sum, meal) => {
    // Get carbs from individual ingredients
    const ingredientsCarbs = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.carbs || 0), 0
    );
    
    // Get carbs from dishes
    const dishesCarbs = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.carbs || 0), 0
      );
    }, 0);
    
    return sum + ingredientsCarbs + dishesCarbs;
  }, 0);
  
  const fat = meals.reduce((sum, meal) => {
    // Get fat from individual ingredients
    const ingredientsFat = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.fat || 0), 0
    );
    
    // Get fat from dishes
    const dishesFat = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.fat || 0), 0
      );
    }, 0);
    
    return sum + ingredientsFat + dishesFat;
  }, 0);

  return { protein, carbs, fat };
};

/**
 * Get data for today's meals
 */
export const getTodayMeals = (meals: Meal[]): Meal[] => {
  const today = new Date().toISOString().split('T')[0];
  return meals.filter(meal => meal.date === today);
};

/**
 * Get data for the last X days
 */
export const getLastDays = (meals: Meal[], days: number = 7): DayDataSummary[] => {
  const dates: string[] = [];
  const result: DayDataSummary[] = [];
  
  // Generate the last X dates
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);
  }
  
  // Get meals for each day
  dates.forEach(date => {
    const dayMeals = meals.filter(meal => meal.date === date);
    const totalCalories = calculateTotalCalories(dayMeals);
    const macros = calculateMacros(dayMeals);
    
    result.push({
      date,
      meals: dayMeals,
      mealCount: dayMeals.length,
      totalCalories,
      macros
    });
  });
  
  return result;
};

/**
 * Get all meal data grouped by day
 */
export const getAllMealDays = (meals: Meal[]): DayDataSummary[] => {
  // Get all unique dates
  const allDates = [...new Set(meals.map(meal => meal.date))].sort().reverse();
  
  // Create data for each date
  return allDates.map(date => {
    const dayMeals = meals.filter(meal => meal.date === date);
    const totalCalories = calculateTotalCalories(dayMeals);
    const macros = calculateMacros(dayMeals);
    
    return {
      date,
      meals: dayMeals,
      mealCount: dayMeals.length,
      totalCalories,
      macros
    };
  });
};

/**
 * Format a date string in a user-friendly way
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === new Date().toISOString().split('T')[0];
}; 