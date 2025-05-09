import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Ingredient, Meal, MealIngredient, NutritionInfo } from '../../types';
import { fetchNutritionForIngredient, fetchImageCalories } from '../services/openai';

interface AppContextData {
  meals: Meal[];
  ingredients: Ingredient[];
  addMeal: (meal: Omit<Meal, 'id' | 'totalCalories'> & { ingredients: MealIngredient[] }) => Promise<void>;
  addPhotoMeal: (imageUri: string, date: string, calories: number) => Promise<void>;
  addCustomIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredientNutrition: (id: string, nutrition: NutritionInfo) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
}

export const AppContext = createContext<AppContextData>({
  meals: [],
  ingredients: [],
  addMeal: async () => {},
  addPhotoMeal: async () => {},
  addCustomIngredient: async () => {},
  updateIngredientNutrition: async () => {},
  deleteIngredient: async () => {},
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const mealsJson = await AsyncStorage.getItem('meals');
        if (mealsJson) setMeals(JSON.parse(mealsJson));
        const ingrJson = await AsyncStorage.getItem('ingredients');
        if (ingrJson) setIngredients(JSON.parse(ingrJson));
      } catch (e) {
        console.error('Failed to load data', e);
      }
    })();
  }, []);

  const saveMeals = async (newMeals: Meal[]) => {
    setMeals(newMeals);
    await AsyncStorage.setItem('meals', JSON.stringify(newMeals));
  };

  const saveIngredients = async (newIngredients: Ingredient[]) => {
    console.log('Saving ingredients:', newIngredients);
    setIngredients(newIngredients);
    await AsyncStorage.setItem('ingredients', JSON.stringify(newIngredients));
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
    console.log('Adding custom ingredient:', ingredientData);
    const newIngredient: Ingredient = { id: uuidv4(), ...ingredientData };
    console.log('New ingredient with ID:', newIngredient);
    await saveIngredients([...ingredients, newIngredient]);
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

  return (
    <AppContext.Provider
      value={{
        meals,
        ingredients,
        addMeal,
        addPhotoMeal,
        addCustomIngredient,
        updateIngredientNutrition,
        deleteIngredient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}; 