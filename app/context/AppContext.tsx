import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; // This needs to be imported before uuid
import { v4 as uuidv4 } from 'uuid';
import { Meal, MealIngredient, NutritionInfo, Ingredient, Dish } from '../../types';
import { fetchNutritionForIngredient, fetchImageCalories, isUpdateRecommended, resetFailureCounter } from '../services/openai';

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
  savedDishes: Dish[];
  goals: NutritionGoals | null;
  updateAvailable: boolean;
  showUpdateModal: boolean;
  isFirstTimeUser: boolean;
  hasCompletedProfile: boolean;
  hasSetGoals: boolean;
  checkOnboardingStatus: () => Promise<{ profileCompleted: boolean; goalsCompleted: boolean }>;
  markProfileCompleted: () => Promise<void>;
  markGoalsCompleted: () => Promise<void>;
  setShowUpdateModal: (show: boolean) => void;
  checkForUpdates: () => void;
  dismissUpdateRecommendation: () => void;
  addMeal: (meal: Omit<Meal, 'id' | 'totalCalories'> & { ingredients: MealIngredient[], dishes?: Dish[] }) => Promise<void>;
  addPhotoMeal: (imageUri: string, date: string, calories: number, dishes?: Dish[] | Dish, ingredients?: MealIngredient[] | MealIngredient, mealName?: string) => Promise<void>;
  addCustomIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<boolean>;
  updateIngredientNutrition: (id: string, nutrition: NutritionInfo) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  saveDish: (dish: Omit<Dish, 'id'>) => Promise<boolean>;
  getSavedDishes: () => Dish[];
  deleteSavedDish: (dishId: string) => Promise<boolean>;
  setGoals: (goals: NutritionGoals) => Promise<void>;
  resetIngredientsStorage: () => Promise<boolean>;
  getPastMeals: (limit?: number) => Meal[];
  duplicateMeal: (mealId: string, newDate?: string) => Promise<boolean>;
  deleteMeal: (mealId: string) => Promise<boolean>;
  updateMeal: (mealId: string, updatedMeal: Partial<Omit<Meal, 'id'>>) => Promise<boolean>;
}

export const AppContext = createContext<AppContextData>({
  meals: [],
  ingredients: [],
  savedDishes: [],
  goals: null,
  updateAvailable: false,
  showUpdateModal: false,
  isFirstTimeUser: true,
  hasCompletedProfile: false,
  hasSetGoals: false,
  checkOnboardingStatus: async () => ({ profileCompleted: false, goalsCompleted: false }),
  markProfileCompleted: async () => {},
  markGoalsCompleted: async () => {},
  setShowUpdateModal: () => {},
  checkForUpdates: () => {},
  dismissUpdateRecommendation: () => {},
  addMeal: async () => {},
  addPhotoMeal: async () => {},
  addCustomIngredient: async () => false,
  updateIngredientNutrition: async () => {},
  deleteIngredient: async () => {},
  saveDish: async () => false,
  getSavedDishes: () => [],
  deleteSavedDish: async () => false,
  setGoals: async () => {},
  resetIngredientsStorage: async () => false,
  getPastMeals: () => [],
  duplicateMeal: async () => false,
  deleteMeal: async () => false,
  updateMeal: async () => false,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('========== INITIALIZING APP PROVIDER ==========');

  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [savedDishes, setSavedDishes] = useState<Dish[]>([]);
  const [goals, setGoalsState] = useState<NutritionGoals | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean>(false);
  const [hasSetGoals, setHasSetGoals] = useState<boolean>(false);

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
        
        // Load saved dishes
        const dishesJson = await AsyncStorage.getItem('savedDishes');
        if (dishesJson) {
          try {
            const loadedDishes = JSON.parse(dishesJson);
            if (Array.isArray(loadedDishes)) {
              console.log(`Loaded ${loadedDishes.length} saved dishes from storage`);
              setSavedDishes(loadedDishes);
            } else {
              console.error('Loaded dishes is not an array:', typeof loadedDishes);
              setSavedDishes([]);
            }
          } catch (parseError) {
            console.error('Error parsing dishes JSON:', parseError);
            await AsyncStorage.removeItem('savedDishes');
            setSavedDishes([]);
          }
        } else {
          console.log('No saved dishes found in storage');
          setSavedDishes([]);
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
        
        // Load onboarding status
        const onboardingStatus = await AsyncStorage.getItem('onboarding_status');
        if (onboardingStatus) {
          const { isFirstTime, profileCompleted, goalsCompleted } = JSON.parse(onboardingStatus);
          setIsFirstTimeUser(isFirstTime);
          setHasCompletedProfile(profileCompleted);
          setHasSetGoals(goalsCompleted);
        } else {
          setIsFirstTimeUser(true);
          setHasCompletedProfile(false);
          setHasSetGoals(false);
        }
        
        console.log('App data loading complete');
      } catch (e) {
        console.error('Failed to load data', e);
        // Set default values in case of error
        setMeals([]);
        setIngredients([]);
        setSavedDishes([]);
        setGoalsState(null);
        setIsFirstTimeUser(true);
        setHasCompletedProfile(false);
        setHasSetGoals(false);
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

  const addMeal = async (mealData: Omit<Meal, 'id' | 'totalCalories'> & { ingredients: MealIngredient[], dishes?: Dish[] }) => {
    // Calculate total calories from ingredients
    const ingredientsCalories = mealData.ingredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
    
    // Calculate total calories from dishes
    const dishesCalories = mealData.dishes 
      ? mealData.dishes.reduce((sum, dish) => sum + dish.totalCalories, 0)
      : 0;
      
    const totalCalories = ingredientsCalories + dishesCalories;
    
    const newMeal: Meal = { 
      id: uuidv4(), 
      ...mealData, 
      totalCalories,
      dishes: mealData.dishes || []
    };
    
    await saveMeals([...meals, newMeal]);
  };

  const addPhotoMeal = async (
    imageUri: string, 
    date: string, 
    calories: number, 
    dishes?: Dish[] | Dish, 
    ingredients?: MealIngredient[] | MealIngredient, 
    mealName?: string
  ) => {
    let mealDishes: Dish[] = [];
    let mealIngredients: MealIngredient[] = [];
    
    // Add dishes if provided
    if (dishes) {
      if (Array.isArray(dishes)) {
        mealDishes = dishes;
      } else {
        mealDishes = [dishes];
      }
    }
    
    // Add ingredients if provided
    if (ingredients) {
      if (Array.isArray(ingredients)) {
        mealIngredients = ingredients;
      } else {
        mealIngredients = [ingredients];
      }
    }
    
    const newMeal: Meal = { 
      id: uuidv4(), 
      name: mealName || 'Photo Meal', 
      date, 
      ingredients: mealIngredients,
      dishes: mealDishes,
      totalCalories: calories, 
      imageUri 
    };
    
    console.log(`Saving photo meal with ${mealDishes.length} dishes and ${mealIngredients.length} ingredients`);
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
      
      // Create new IDs for ingredients to avoid conflicts
      const newIngredients = mealToDuplicate.ingredients.map(ing => ({
        ...ing,
        id: uuidv4() // Generate new IDs for each ingredient
      }));
      
      // Create new IDs for dishes and their ingredients
      const newDishes = mealToDuplicate.dishes ? mealToDuplicate.dishes.map(dish => ({
        ...dish,
        id: uuidv4(),
        ingredients: dish.ingredients.map(ing => ({
          ...ing,
          id: uuidv4()
        }))
      })) : [];
      
      const newMeal: Meal = {
        id: uuidv4(),
        name: `${mealToDuplicate.name} (copy)`,
        date: newDate || today,
        ingredients: newIngredients,
        dishes: newDishes,
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

  const deleteMeal = async (mealId: string): Promise<boolean> => {
    try {
      console.log(`Attempting to delete meal with ID: ${mealId}`);
      
      // Check if the meal exists
      const mealToDelete = meals.find(meal => meal.id === mealId);
      if (!mealToDelete) {
        console.error(`Cannot delete: Meal with ID ${mealId} not found`);
        return false;
      }
      
      // Filter out the meal to delete
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      
      // Save the updated meals list
      await saveMeals(updatedMeals);
      
      console.log(`Successfully deleted meal "${mealToDelete.name}" with ID ${mealId}`);
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  };

  const updateMeal = async (mealId: string, updatedMealData: Partial<Omit<Meal, 'id'>>): Promise<boolean> => {
    try {
      console.log(`Attempting to update meal with ID: ${mealId}`);
      
      // Find the meal to update
      const mealIndex = meals.findIndex(meal => meal.id === mealId);
      if (mealIndex === -1) {
        console.error(`Cannot update: Meal with ID ${mealId} not found`);
        return false;
      }
      
      // Get the existing meal
      const existingMeal = meals[mealIndex];
      
      // Create the updated meal
      const updatedMeal: Meal = {
        ...existingMeal,
        ...updatedMealData,
      };
      
      // Recalculate total calories if ingredients or dishes were updated
      if (updatedMealData.ingredients || updatedMealData.dishes) {
        const ingredientsCalories = (updatedMealData.ingredients || existingMeal.ingredients).reduce(
          (sum, ing) => sum + ing.nutrition.calories, 
          0
        );
        
        const dishesCalories = (updatedMealData.dishes || existingMeal.dishes || []).reduce(
          (sum, dish) => sum + dish.totalCalories,
          0
        );
        
        updatedMeal.totalCalories = ingredientsCalories + dishesCalories;
      }
      
      // Create a new array with the updated meal
      const updatedMeals = [...meals];
      updatedMeals[mealIndex] = updatedMeal;
      
      // Save the updated meals list
      await saveMeals(updatedMeals);
      
      console.log(`Successfully updated meal with ID ${mealId}`);
      return true;
    } catch (error) {
      console.error('Error updating meal:', error);
      return false;
    }
  };

  // Add function to save dishes
  const saveDishes = async (newDishes: Dish[]) => {
    try {
      console.log(`Saving ${newDishes.length} dishes to AsyncStorage`);
      setSavedDishes(newDishes);
      await AsyncStorage.setItem('savedDishes', JSON.stringify(newDishes));
      return true;
    } catch (error) {
      console.error('Error saving dishes:', error);
      return false;
    }
  };

  // Add function to save a single dish
  const saveDish = async (dishData: Omit<Dish, 'id'>) => {
    try {
      // Create a new dish with ID
      const newDish: Dish = {
        id: uuidv4(),
        ...dishData
      };
      
      // Add to saved dishes and save to storage
      const updatedDishes = [...savedDishes, newDish];
      const result = await saveDishes(updatedDishes);
      
      return result;
    } catch (error) {
      console.error('Error saving dish:', error);
      return false;
    }
  };

  // Add function to get saved dishes
  const getSavedDishes = (): Dish[] => {
    return savedDishes;
  };

  // Add function to delete a saved dish
  const deleteSavedDish = async (dishId: string): Promise<boolean> => {
    try {
      const updatedDishes = savedDishes.filter(dish => dish.id !== dishId);
      return await saveDishes(updatedDishes);
    } catch (error) {
      console.error('Error deleting saved dish:', error);
      return false;
    }
  };

  // Add function to check for updates
  const checkForUpdates = () => {
    const needsUpdate = isUpdateRecommended();
    console.log('Checking for update recommendations:', needsUpdate);
    setUpdateAvailable(needsUpdate);
    if (needsUpdate) {
      setShowUpdateModal(true);
    }
  };

  // Add function to dismiss update recommendation
  const dismissUpdateRecommendation = () => {
    setShowUpdateModal(false);
    resetFailureCounter();
  };

  // Set up periodic update checks
  useEffect(() => {
    // Check for updates when app starts
    checkForUpdates();
    
    // Also set up a periodic check every 10 minutes while app is running
    const updateCheckInterval = setInterval(() => {
      checkForUpdates();
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(updateCheckInterval);
  }, []);

  // Check if user has completed onboarding
  const checkOnboardingStatus = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name');
      const goalsJson = await AsyncStorage.getItem('goals');
      
      const profileCompleted = !!storedName;
      const goalsCompleted = !!goalsJson;
      
      setHasCompletedProfile(profileCompleted);
      setHasSetGoals(goalsCompleted);
      
      // Save onboarding status
      await AsyncStorage.setItem('onboarding_status', JSON.stringify({
        isFirstTime: isFirstTimeUser && (!profileCompleted || !goalsCompleted),
        profileCompleted,
        goalsCompleted
      }));
      
      return { profileCompleted, goalsCompleted };
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { profileCompleted: false, goalsCompleted: false };
    }
  };
  
  // Mark profile setup as completed
  const markProfileCompleted = async () => {
    try {
      setHasCompletedProfile(true);
      await AsyncStorage.setItem('onboarding_status', JSON.stringify({
        isFirstTime: isFirstTimeUser && !hasSetGoals,
        profileCompleted: true,
        goalsCompleted: hasSetGoals
      }));
    } catch (error) {
      console.error('Error marking profile as completed:', error);
    }
  };
  
  // Mark goals setup as completed
  const markGoalsCompleted = async () => {
    try {
      setHasSetGoals(true);
      setIsFirstTimeUser(false);
      await AsyncStorage.setItem('onboarding_status', JSON.stringify({
        isFirstTime: false,
        profileCompleted: hasCompletedProfile,
        goalsCompleted: true
      }));
    } catch (error) {
      console.error('Error marking goals as completed:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        meals,
        ingredients,
        savedDishes,
        goals,
        updateAvailable,
        showUpdateModal,
        isFirstTimeUser,
        hasCompletedProfile,
        hasSetGoals,
        checkOnboardingStatus,
        markProfileCompleted,
        markGoalsCompleted,
        setShowUpdateModal,
        checkForUpdates,
        dismissUpdateRecommendation,
        addMeal,
        addPhotoMeal,
        addCustomIngredient,
        updateIngredientNutrition,
        deleteIngredient,
        saveDish,
        getSavedDishes,
        deleteSavedDish,
        setGoals,
        resetIngredientsStorage,
        getPastMeals,
        duplicateMeal,
        deleteMeal,
        updateMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}; 