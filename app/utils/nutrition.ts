import { NutritionInfo } from '../../types';

/**
 * Rounds a number to 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

/**
 * Ensures nutrition values are properly rounded to 2 decimal places
 */
export const roundNutritionValues = (nutrition: NutritionInfo): NutritionInfo => {
  return {
    calories: roundToTwoDecimals(nutrition.calories),
    protein: roundToTwoDecimals(nutrition.protein || 0),
    carbs: roundToTwoDecimals(nutrition.carbs || 0),
    fat: roundToTwoDecimals(nutrition.fat || 0),
  };
};

/**
 * Multiplies nutrition values by a factor and rounds to 2 decimal places
 */
export const multiplyNutrition = (nutrition: NutritionInfo, factor: number): NutritionInfo => {
  return roundNutritionValues({
    calories: nutrition.calories * factor,
    protein: (nutrition.protein || 0) * factor,
    carbs: (nutrition.carbs || 0) * factor,
    fat: (nutrition.fat || 0) * factor,
  });
};

/**
 * Adds two nutrition objects and rounds the result to 2 decimal places
 */
export const addNutrition = (nutrition1: NutritionInfo, nutrition2: NutritionInfo): NutritionInfo => {
  return roundNutritionValues({
    calories: nutrition1.calories + nutrition2.calories,
    protein: (nutrition1.protein || 0) + (nutrition2.protein || 0),
    carbs: (nutrition1.carbs || 0) + (nutrition2.carbs || 0),
    fat: (nutrition1.fat || 0) + (nutrition2.fat || 0),
  });
};

/**
 * Formats a nutrition value for display with 2 decimal places
 */
export const formatNutritionValue = (value: number): string => {
  return value.toFixed(2);
}; 