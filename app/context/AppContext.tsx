import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Meal, MealIngredient, NutritionInfo, Ingredient } from '../../types';
import { fetchNutritionForIngredient, fetchImageCalories } from '../services/openai';

// Define NutritionGoals type locally if not available in types.ts
type NutritionGoals = {
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

interface AppContextData {
  meals: Meal[];
  ingredients: Ingredient[];
  goals: NutritionGoals | null;
  addMeal: (meal: Omit<Meal, 'id' | 'totalCalories'> & { ingredients: MealIngredient[] }) => Promise<void>;
  addPhotoMeal: (imageUri: string, date: string, calories: number) => Promise<void>;
  addCustomIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<boolean>;
  updateIngredientNutrition: (id: string, nutrition: NutritionInfo) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  setGoals: (goals: NutritionGoals) => Promise<void>;
  resetIngredientsStorage: () => Promise<boolean>;
  getPastMeals: (limit?: number) => Meal[];
  duplicateMeal: (mealId: string, newDate?: string) => Promise<boolean>;
}

export const AppContext = createContext<AppContextData>({
  meals: [],
  ingredients: [],
  goals: null,
  addMeal: async () => {},
  addPhotoMeal: async () => {},
  addCustomIngredient: async () => false,
  updateIngredientNutrition: async () => {},
  deleteIngredient: async () => {},
  setGoals: async () => {},
  resetIngredientsStorage: async () => false,
  getPastMeals: () => [],
  duplicateMeal: async () => false,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('========== INITIALIZING APP PROVIDER ==========');

  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [goals, setGoalsState] = useState<NutritionGoals | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('========== LOADING APP DATA ==========');
        console.log('Loading app data from AsyncStorage...');
        
        // Load meals
        const mealsJson = await AsyncStorage.getItem('meals');
        if (mealsJson) {
          const parsedMeals = JSON.parse(mealsJson);
          console.log(`Loaded ${parsedMeals.length} meals from storage`);
          setMeals(parsedMeals);
        } else {
          console.log('No meals found in storage');
          setMeals([]);
        }
        
        // Load ingredients
        const ingrJson = await AsyncStorage.getItem('ingredients');
        if (ingrJson) {
          try {
            const loadedIngredients = JSON.parse(ingrJson);
            
            if (Array.isArray(loadedIngredients)) {
              console.log(`Loaded ${loadedIngredients.length} ingredients from storage`);
              
              if (loadedIngredients.length > 0) {
                // Log some details about the first ingredient
                console.log('First ingredient:', JSON.stringify(loadedIngredients[0]));
              }
              
              // Validate the loaded ingredients
              const validIngredients = loadedIngredients.filter(ing => 
                ing && ing.id && ing.name && ing.unit && ing.nutrition
              );
              
              if (validIngredients.length !== loadedIngredients.length) {
                console.warn(`Filtered out ${loadedIngredients.length - validIngredients.length} invalid ingredients`);
              }
              
              setIngredients(validIngredients);
            } else {
              console.error('Loaded ingredients is not an array:', typeof loadedIngredients);
              setIngredients([]);
            }
          } catch (parseError) {
            console.error('Error parsing ingredients JSON:', parseError);
            // Reset the corrupted data
            await AsyncStorage.removeItem('ingredients');
            setIngredients([]);
          }
        } else {
          console.log('No ingredients found in storage, initializing empty array');
          setIngredients([]);
        }
        
        // Load goals
        const goalsJson = await AsyncStorage.getItem('goals');
        if (goalsJson) {
          console.log('Loaded goals from storage');
          setGoalsState(JSON.parse(goalsJson));
        } else {
          console.log('No goals found in storage');
          setGoalsState(null);
        }
        
        console.log('App data loading complete');
      } catch (e) {
        console.error('Failed to load data', e);
        // Set default values in case of error
        setMeals([]);
        setIngredients([]);
        setGoalsState(null);
      }
    })();
  }, []);

  const saveMeals = async (newMeals: Meal[]) => {
    setMeals(newMeals);
    await AsyncStorage.setItem('meals', JSON.stringify(newMeals));
  };

  const saveIngredients = async (newIngredients: Ingredient[]) => {
    try {
      console.log('========== SAVE INGREDIENTS ==========');
      console.log(`Saving ${newIngredients.length} ingredients to AsyncStorage`);
      
      if (newIngredients.length > 0) {
        console.log('First ingredient:', JSON.stringify(newIngredients[0]));
        console.log('Last ingredient:', JSON.stringify(newIngredients[newIngredients.length - 1]));
      }
      
      // Validate that each ingredient has required fields
      const validIngredients = newIngredients.map(ing => ({
        ...ing,
        id: ing.id || uuidv4(), // Ensure ID exists
        nutrition: {
          calories: ing.nutrition.calories || 0,
          protein: ing.nutrition.protein || 0,
          carbs: ing.nutrition.carbs || 0,
          fat: ing.nutrition.fat || 0
        }
      }));
      
      console.log(`Validated ${validIngredients.length} ingredients`);
      
      // Update state first to ensure UI reflects changes
      setIngredients(validIngredients);
      
      // Save to AsyncStorage
      const jsonValue = JSON.stringify(validIngredients);
      console.log('JSON string length:', jsonValue.length);
      
      // Check for AsyncStorage size limits
      if (jsonValue.length > 2000000) { // AsyncStorage has a size limit
        console.warn('Warning: Large data size when saving ingredients');
      }
      
      await AsyncStorage.setItem('ingredients', jsonValue);
      
      // Verify saving was successful by reading back the data
      const verifyData = await AsyncStorage.getItem('ingredients');
      if (verifyData) {
        const parsed = JSON.parse(verifyData);
        console.log(`Verification: read back ${parsed.length} ingredients from AsyncStorage`);
        console.log('Save operation successful!');
      } else {
        console.error('Verification failed: could not read back ingredients from AsyncStorage');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving ingredients:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  };

  const addMeal = async (mealData: Omit<Meal, 'id' | 'totalCalories'> & { ingredients: MealIngredient[] }) => {
    const totalCalories = mealData.ingredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
    const newMeal: Meal = { id: uuidv4(), ...mealData, totalCalories };
    await saveMeals([...meals, newMeal]);
  };

  const addPhotoMeal = async (imageUri: string, date: string, calories: number) => {
    const newMeal: Meal = { id: uuidv4(), name: 'Photo Meal', date, ingredients: [], totalCalories: calories, imageUri };
    await saveMeals([...meals, newMeal]);
  };

  const addCustomIngredient = async (ingredientData: Omit<Ingredient, 'id'>) => {
    try {
      console.log('========== ADDING CUSTOM INGREDIENT ==========');
      console.log('Adding custom ingredient:', JSON.stringify(ingredientData));
      
      // Ensure we have the most current ingredients state before adding
      const currentIngredientsJson = await AsyncStorage.getItem('ingredients');
      let currentIngredients = ingredients; // Default to state
      
      if (currentIngredientsJson) {
        try {
          const parsedIngredients = JSON.parse(currentIngredientsJson);
          if (Array.isArray(parsedIngredients)) {
            currentIngredients = parsedIngredients;
            console.log(`Using current ingredients from storage: ${currentIngredients.length} items`);
          }
        } catch (parseError) {
          console.error('Error parsing ingredients from storage:', parseError);
        }
      }
      
      // Sanitize nutrition data to prevent undefined values
      const sanitizedNutrition = {
        calories: ingredientData.nutrition.calories || 0,
        protein: ingredientData.nutrition.protein || 0,
        carbs: ingredientData.nutrition.carbs || 0,
        fat: ingredientData.nutrition.fat || 0
      };
      
      // Create the new ingredient with a unique ID
      const newIngredient: Ingredient = { 
        id: uuidv4(), 
        name: ingredientData.name,
        unit: ingredientData.unit,
        nutrition: sanitizedNutrition 
      };
      
      console.log('New ingredient with ID:', newIngredient.id);
      
      // Add to the list and save
      const updatedIngredients = [...currentIngredients, newIngredient];
      console.log(`Updated ingredients count: ${updatedIngredients.length}`);
      
      // Set state synchronously first, then save to AsyncStorage
      setIngredients(updatedIngredients);
      
      const saveResult = await saveIngredients(updatedIngredients);
      
      if (saveResult) {
        console.log('Ingredient saved successfully. Total count:', updatedIngredients.length);
      } else {
        console.error('Failed to save ingredients to storage.');
        // Try to revert state if save failed
        setIngredients(currentIngredients);
      }
      
      return saveResult;
    } catch (error) {
      console.error('Error in addCustomIngredient:', error);
      throw error;
    }
  };

  const updateIngredientNutrition = async (id: string, nutrition: NutritionInfo) => {
    const updated = ingredients.map(i => (i.id === id ? { ...i, nutrition } : i));
    await saveIngredients(updated);
  };

  const deleteIngredient = async (id: string) => {
    console.log('Deleting ingredient with ID:', id);
    const updatedIngredients = ingredients.filter(ingredient => ingredient.id !== id);
    console.log('Updated ingredients after deletion:', updatedIngredients);
    await saveIngredients(updatedIngredients);
  };

  const setGoals = async (newGoals: NutritionGoals) => {
    try {
      setGoalsState(newGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(newGoals));
    } catch (error) {
      console.error('Error setting goals:', error);
      throw error;
    }
  };

  const resetIngredientsStorage = async () => {
    try {
      console.log('Resetting ingredients storage');
      setIngredients([]);
      await AsyncStorage.removeItem('ingredients');
      return true;
    } catch (error) {
      console.error('Error resetting ingredients storage:', error);
      return false;
    }
  };

  const getPastMeals = (limit?: number): Meal[] => {
    // Sort meals by date in descending order (newest first)
    const sortedMeals = [...meals].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Return all meals if no limit is provided, otherwise return the specified number
    return limit ? sortedMeals.slice(0, limit) : sortedMeals;
  };

  const duplicateMeal = async (mealId: string, newDate?: string): Promise<boolean> => {
    try {
      // Find the meal to duplicate
      const mealToDuplicate = meals.find(meal => meal.id === mealId);
      
      if (!mealToDuplicate) {
        console.error(`Meal with ID ${mealId} not found`);
        return false;
      }
      
      // Create a new meal with the same properties but a new ID
      const today = new Date().toISOString().split('T')[0];
      const newMeal: Meal = {
        id: uuidv4(),
        name: `${mealToDuplicate.name} (copy)`,
        date: newDate || today,
        ingredients: mealToDuplicate.ingredients.map(ing => ({
          ...ing,
          id: uuidv4() // Generate new IDs for each ingredient
        })),
        totalCalories: mealToDuplicate.totalCalories,
        imageUri: mealToDuplicate.imageUri
      };
      
      // Add the new meal to the list
      await saveMeals([...meals, newMeal]);
      
      console.log(`Duplicated meal "${mealToDuplicate.name}" with ID ${mealId}`);
      return true;
    } catch (error) {
      console.error('Error duplicating meal:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        meals,
        ingredients,
        goals,
        addMeal,
        addPhotoMeal,
        addCustomIngredient,
        updateIngredientNutrition,
        deleteIngredient,
        setGoals,
        resetIngredientsStorage,
        getPastMeals,
        duplicateMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}; 