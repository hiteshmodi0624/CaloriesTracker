import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { NutritionInfo } from '../../types';
import { ENV, validateEnv } from '../config/env';

// Validate environment variables at startup
if (!validateEnv()) {
  console.warn('OpenAI API key not properly configured. AI features will not work.');
}
console.log(ENV.EXPO_PUBLIC_OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: ENV.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function fetchNutritionForIngredient(
  name: string,
  unit: string,
  quantity: number
): Promise<NutritionInfo> {
  try {
    const prompt = `Provide the nutritional information (calories, protein in grams, carbs in grams, fat in grams) for ${quantity} ${unit} of ${name} in JSON format as { "calories": number, "protein": number, "carbs": number, "fat": number }. Only output the JSON.`;
    
    console.log(`Requesting nutrition for: ${quantity} ${unit} of ${name}`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.choices[0].message?.content || '';
    console.log('OpenAI response:', content);
    
    // Try to extract JSON from the response which might contain other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
    
    try {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON:', jsonStr);
      const data = JSON.parse(jsonStr);
      
      // Ensure all values are numbers, with fallbacks
      return {
        calories: typeof data.calories === 'number' ? data.calories : 100,
        protein: typeof data.protein === 'number' ? data.protein : 0,
        carbs: typeof data.carbs === 'number' ? data.carbs : 0,
        fat: typeof data.fat === 'number' ? data.fat : 0,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
  } catch (error) {
    console.error('Error fetching nutrition:', error);
    // Return default values instead of throwing
    return { calories: 100, protein: 0, carbs: 0, fat: 0 };
  }
}

export async function extractNutritionFromLabel(imageUri: string): Promise<NutritionInfo> {
  try {
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
    
    console.log('Extracting nutrition from label image');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.choices[0].message?.content || '';
    console.log('OpenAI label response:', content.substring(0, 100) + '...');
    
    // Try to extract JSON from the response which might contain other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in label response');
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
    
    try {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON from label:', jsonStr);
      const data = JSON.parse(jsonStr);
      
      // Ensure all values are numbers, with fallbacks
      return {
        calories: typeof data.calories === 'number' ? data.calories : 0,
        protein: typeof data.protein === 'number' ? data.protein : 0,
        carbs: typeof data.carbs === 'number' ? data.carbs : 0,
        fat: typeof data.fat === 'number' ? data.fat : 0,
      };
    } catch (parseError) {
      console.error('Label JSON parse error:', parseError);
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
  } catch (error) {
    console.error('Error extracting nutrition from label:', error);
    // Return default values instead of throwing
    return { calories: 100, protein: 0, carbs: 0, fat: 0 };
  }
}

export async function fetchImageCalories(imageUri: string): Promise<number> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const prompt = `This is a meal image in base64: ${base64}. Estimate the total calorie content in this image. Only respond with a single number representing calories.`;
    
    console.log('Estimating calories from meal image');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.choices[0].message?.content || '';
    console.log('OpenAI calorie estimation response:', content);
    
    // Try to extract just the number from the response
    const numberMatch = content.match(/\d+/);
    if (numberMatch) {
      const calories = parseInt(numberMatch[0], 10);
      if (!isNaN(calories)) {
        return calories;
      }
    }
    
    console.warn('Could not extract calories number, using default value');
    return 500; // Default fallback
  } catch (error) {
    console.error('Error estimating calories from image:', error);
    return 500; // Default fallback
  }
} 