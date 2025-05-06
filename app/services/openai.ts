import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { NutritionInfo } from '../../types';
import { ENV, validateEnv } from '../config/env';

// Validate environment variables at startup
if (!validateEnv()) {
  console.warn('OpenAI API key not properly configured. AI features will not work.');
}

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
});

export async function fetchNutritionForIngredient(
  name: string,
  unit: string,
  quantity: number
): Promise<NutritionInfo> {
  const prompt = `Provide the nutritional information (calories, protein in grams, carbs in grams, fat in grams) for ${quantity} ${unit} of ${name} in JSON format as { "calories": number, "protein": number, "carbs": number, "fat": number }. Only output the JSON.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message?.content;
  try {
    const data = JSON.parse(content ?? '{}');
    return {
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    };
  } catch {
    throw new Error('Failed to parse nutrition data');
  }
}

export async function extractNutritionFromLabel(imageUri: string): Promise<NutritionInfo> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  const prompt = `This is an image of a nutrition label in base64: ${base64}. Extract the following nutritional information in JSON format: 
  { 
    "calories": number, 
    "protein": number, 
    "carbs": number, 
    "fat": number 
  }. 
  Only respond with the JSON, nothing else.`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  
  const content = response.choices[0].message?.content;
  try {
    const data = JSON.parse(content ?? '{}');
    return {
      calories: data.calories || 0,
      protein: data.protein || 0,
      carbs: data.carbs || 0,
      fat: data.fat || 0,
    };
  } catch {
    throw new Error('Failed to extract nutrition information from label');
  }
}

export async function fetchImageCalories(imageUri: string): Promise<number> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const prompt = `This is a meal image in base64: ${base64}. Estimate the total calorie content in this image. Only respond with a single number representing calories.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message?.content;
  const calories = parseInt(content ?? '', 10);
  if (isNaN(calories)) {
    throw new Error('Failed to parse calories from image');
  }
  return calories;
} 