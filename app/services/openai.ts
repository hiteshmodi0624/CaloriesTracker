import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { NutritionInfo } from '../../types';
import { ENV, validateEnv } from '../config/env';
import Constants from 'expo-constants';
import 'react-native-get-random-values';

// Validate environment variables at startup
if (!validateEnv()) {
  console.warn('OpenAI API key not properly configured. AI features will not work.');
}

const openai = new OpenAI({
  apiKey: ENV.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Error tracking
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3; // Number of consecutive failures before suggesting update
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
export const OPENAI_SERVICE_VERSION = '1.0'; // Track service version for potential updates

// Function to check if app update might be needed
export const isUpdateRecommended = (): boolean => {
  return consecutiveFailures >= FAILURE_THRESHOLD;
};

// Function to reset the failure counter
export const resetFailureCounter = (): void => {
  consecutiveFailures = 0;
};

export const fetchNutritionForIngredient = async (
  name: string,
  unit: string,
  quantity: number
): Promise<NutritionInfo> => {
  try {
    const prompt = `What are the nutritional values for ${quantity} ${unit} of ${name}? Please provide calories, protein, carbs, and fat in JSON format.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system" as const,
          content: "You are a nutrition expert. Provide nutritional information in JSON format with calories, protein, carbs, and fat values. Return ONLY the JSON object with no markdown or explanation."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      consecutiveFailures++;
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from potential markdown code blocks
    let jsonString = content;
    
    // Handle markdown code blocks (```json { ... } ```)
    const codeBlockMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
    
    // Handle any extra text before or after JSON object
    const jsonObjectMatch = jsonString.match(/{[\s\S]*}/);
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0];
    }
    
    console.log('Extracted JSON string:', jsonString);
    
    try {
      const nutrition = JSON.parse(jsonString);
      // Success! Reset failure counter
      consecutiveFailures = 0;
      return {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Count as a failure
      consecutiveFailures++;
      // Fallback values if parsing fails
      return {
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
      };
    }
  } catch (error) {
    console.error('Error fetching nutrition:', error);
    // Count as a failure
    consecutiveFailures++;
    // Return default values instead of throwing
    return {
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
    };
  }
};

export const fetchChatResponse = async (
  userMessage: string,
  messageHistory: { text: string; isUser: boolean }[],
  userData?: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: 'male' | 'female';
    activityLevel?: 'sedentary' | 'lightly active' | 'moderately active' | 'very active' | 'extra active';
    goal?: 'lose weight' | 'gain weight' | 'maintain' | 'build muscle';
  }
): Promise<string> => {
  try {
    // Create a description of user data for the system prompt
    let userDataDescription = '';
    if (userData) {
      userDataDescription = `\nUSER DATA:`;
      if (userData.weight) userDataDescription += `\n- Weight: ${userData.weight}kg`;
      if (userData.height) userDataDescription += `\n- Height: ${userData.height}cm`;
      if (userData.age) userDataDescription += `\n- Age: ${userData.age} years`;
      if (userData.gender) userDataDescription += `\n- Gender: ${userData.gender}`;
      if (userData.activityLevel) userDataDescription += `\n- Activity Level: ${userData.activityLevel}`;
      if (userData.goal) userDataDescription += `\n- Goal: ${userData.goal}`;
    }

    const messages = [
      {
        role: "system" as const,
        content: `You are a nutrition assistant that can help users with:
1. Setting nutrition goals
2. Adding meals and ingredients
3. Providing nutrition advice

Use the following user data to personalize your responses:${userDataDescription}

When setting goals, you should:
1. Use any existing user data you have
2. Ask for any missing information needed (weight, height, age, gender, activity level, goal)
3. If the user provides any new data in their message, extract and use it

DO NOT calculate nutrition values yourself. ONLY collect user details to pass to the app's calculator.

FORMAT FOR GOAL SETTING:
When collecting user information for goals, use the following JSON template wrapped in triple backticks. The app will use its own calculator with this data:

\`\`\`json
{
  "type": "nutrition_goals",
  "userDetails": {
    "weight": [weight in kg],
    "height": [height in cm],
    "age": [age in years],
    "gender": "[male or female]",
    "activityLevel": "[sedentary/lightly active/moderately active/very active/extra active]",
    "goal": "[lose weight/gain weight/maintain/build muscle]"
  },
  "description": "Brief explanation of the user's goals and activity level"
}
\`\`\`

For example:

\`\`\`json
{
  "type": "nutrition_goals",
  "userDetails": {
    "weight": 70,
    "height": 175,
    "age": 30,
    "gender": "male",
    "activityLevel": "moderately active",
    "goal": "lose weight"
  },
  "description": "User wants to lose weight with moderate activity 3-5 times per week"
}
\`\`\`

When adding meals or ingredients, provide detailed nutrition information.

Format your responses clearly and include all necessary information for the app to process.`
      },
      ...messageHistory.map(msg => ({
        role: msg.isUser ? "user" as const : "assistant" as const,
        content: msg.text
      })),
      {
        role: "user" as const,
        content: userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      consecutiveFailures++;
      return "I'm sorry, I couldn't process that request.";
    }
    
    // Reset failure counter on success
    consecutiveFailures = 0;
    return content;
  } catch (error) {
    console.error('Error getting chat response:', error);
    consecutiveFailures++;
    return "I'm sorry, I encountered an error. Please try again later.";
  }
};

// Add interface definition for Ingredient type
export interface IngredientData {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishWithIngredients extends NutritionInfo {
  name: string;
  ingredients: IngredientData[];
}

// Add interface definition for simplified dish analysis
export interface SimpleDishData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  estimatedQuantity?: string; // e.g., "1 serving", "200g", etc.
}

export const fetchImageCalories = async (
  imageUri: string,
  description: string = ''
): Promise<SimpleDishData[]> => {
  try {
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Check the approximate size of the base64 string
    const approximateSize = base64.length;
    console.log(`Image base64 size: ~${Math.round(approximateSize / 1024)} KB`);
    
    // If the image is too large, reject early to avoid API errors
    if (approximateSize > 5000000) { // 5MB limit
      throw new Error('Image too large for API processing');
    }

    const promptText = description 
      ? `Analyze this food image and identify all dishes present. The user provided this description: "${description}". Use this description to help identify the complete meal and estimate quantities of each dish. For each dish, provide the TOTAL nutrition values for ALL items of that dish visible in the image (e.g., if you see 5 rotis, provide calories for all 5 rotis combined). Count the quantity carefully and include it in estimatedQuantity. Return in this exact JSON format: [{"name": "Dish Name", "calories": 000, "protein": 00, "carbs": 00, "fat": 00, "estimatedQuantity": "5 rotis" or "2 servings" etc}]. Return ONLY the valid JSON array with no other text.`
      : `Analyze this food image and identify all dishes present. For each dish, provide the TOTAL nutrition values for ALL items of that dish visible in the image (e.g., if you see 5 rotis, provide calories for all 5 rotis combined). Count the quantity carefully and include it in estimatedQuantity. Return in this exact JSON format: [{"name": "Dish Name", "calories": 000, "protein": 00, "carbs": 00, "fat": 00, "estimatedQuantity": "5 rotis" or "2 servings" etc}]. Return ONLY the valid JSON array with no other text.`;
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // Use the latest optimized model with vision capabilities
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: promptText
            },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              }
            }
          ]
        }
      ],
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    console.log('Raw OpenAI response:', content);

    // Try to extract JSON array from the content
    try {
      // First try to find a JSON array pattern
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        // Clean up the potential JSON string to make it valid
        let jsonString = jsonMatch[0];
        
        // Try to parse it directly first
        try {
          const dishesData = JSON.parse(jsonString);
          console.log('Parsed dishes data:', dishesData);
          
          if (Array.isArray(dishesData) && dishesData.length > 0) {
            // Return array of dishes with their nutrition data (no ingredients breakdown)
            return dishesData.map(dish => ({
              name: dish.name || 'Unknown Dish',
              calories: dish.calories || 0,
              protein: dish.protein || 0,
              carbs: dish.carbs || 0,
              fat: dish.fat || 0,
              estimatedQuantity: dish.estimatedQuantity || '1 serving'
            }));
          }
        } catch (initialParseError) {
          console.error('Initial JSON parse error:', initialParseError);
          
          // Try to fix common JSON syntax errors
          // Remove trailing commas before closing brackets
          jsonString = jsonString.replace(/,\s*\]/g, ']');
          jsonString = jsonString.replace(/,\s*\}/g, '}');
          
          // Add missing double quotes around property names
          jsonString = jsonString.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
          
          console.log('Cleaned JSON string:', jsonString);
          
          try {
            const dishesData = JSON.parse(jsonString);
            console.log('Parsed dishes data after cleanup:', dishesData);
            
            if (Array.isArray(dishesData) && dishesData.length > 0) {
              // Return array of dishes with their nutrition data (no ingredients breakdown)
              return dishesData.map(dish => ({
                name: dish.name || 'Unknown Dish',
                calories: dish.calories || 0,
                protein: dish.protein || 0,
                carbs: dish.carbs || 0,
                fat: dish.fat || 0,
                estimatedQuantity: dish.estimatedQuantity || '1 serving'
              }));
            }
          } catch (cleanupParseError) {
            console.error('Failed to parse JSON even after cleanup:', cleanupParseError);
          }
        }
      }
      
      // If we didn't get a valid array, try to extract a single dish object
      const singleDishMatch = content.match(/\{[\s\S]*\}/);
      if (singleDishMatch) {
        // Clean up the potential JSON string
        let jsonString = singleDishMatch[0];
        
        // Remove trailing commas
        jsonString = jsonString.replace(/,\s*\}/g, '}');
        
        // Add missing double quotes around property names
        jsonString = jsonString.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
        
        try {
          const dish = JSON.parse(jsonString);
          console.log('Parsed single dish data:', dish);
          
          return [{
            name: dish.name || 'Photo Meal',
            calories: dish.calories || 0,
            protein: dish.protein || 0,
            carbs: dish.carbs || 0,
            fat: dish.fat || 0,
            estimatedQuantity: dish.estimatedQuantity || '1 serving'
          }];
        } catch (singleDishParseError) {
          console.error('Failed to parse single dish JSON:', singleDishParseError);
        }
      }
    } catch (parseError) {
      console.error('Error parsing nutrition JSON:', parseError);
    }

    // Fallback to a basic structure if parsing fails
    console.log('Falling back to basic structure');
    return [];
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

export async function extractNutritionFromLabel(imageUri: string, unit: string): Promise<NutritionInfo> {
  try {
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Check the approximate size of the base64 string
    const approximateSize = base64.length;
    console.log(`Label image base64 size: ~${Math.round(approximateSize / 1024)} KB`);
    
    // If the image is too large, reject early to avoid API errors
    if (approximateSize > 5000000) { // 5MB limit
      throw new Error('Image too large for API processing');
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // Use the latest optimized model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: "text" as const,
              text: `Analyze this nutrition label image and extract the following nutritional information in JSON format: calories, protein, carbs, and fat. Only respond with the JSON object. 
              The nutrition values should be for per ${unit} of the ingredient.`
            },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "low" // Use low detail to reduce token usage
              }
            }
          ]
        }
      ],
    });
    
    const content = response.choices[0].message?.content || '';
    if (!content) {
      consecutiveFailures++;
      console.error('No content in OpenAI response');
      return { calories: 100, protein: 0, carbs: 0, fat: 0 };
    }
    
    console.log('OpenAI label response:', content.substring(0, 100) + '...');
    
    // Try to extract JSON from the response which might contain other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in label response');
      consecutiveFailures++;
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
    
    try {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON from label:', jsonStr);
      const data = JSON.parse(jsonStr);
      
      // Reset failure counter on success
      consecutiveFailures = 0;
      
      // Ensure all values are numbers, with fallbacks
      return {
        calories: typeof data.calories === 'number' ? data.calories : 0,
        protein: typeof data.protein === 'number' ? data.protein : 0,
        carbs: typeof data.carbs === 'number' ? data.carbs : 0,
        fat: typeof data.fat === 'number' ? data.fat : 0,
      };
    } catch (parseError) {
      console.error('Label JSON parse error:', parseError);
      consecutiveFailures++;
      return { calories: 100, protein: 0, carbs: 0, fat: 0 }; // Default fallback
    }
  } catch (error) {
    console.error('Error extracting nutrition from label:', error);
    // Count as a failure
    consecutiveFailures++;
    // Return default values instead of throwing
    return { calories: 100, protein: 0, carbs: 0, fat: 0 };
  }
}

export const fetchNutritionForDish = async (
  dishName: string,
  servingSize: number = 1
): Promise<SimpleDishData> => {
  try {
    const prompt = `For the dish "${dishName}" with ${servingSize} serving(s), provide the TOTAL nutrition values for the entire dish. Do not break it down into ingredients. Estimate the nutrition based on a typical serving of this dish.

Format your response as a single JSON object with this exact structure:
{
  "name": "${dishName}",
  "calories": 000,
  "protein": 00,
  "carbs": 00,
  "fat": 00,
  "estimatedQuantity": "${servingSize} serving(s)"
}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system" as const,
          content: "You are a nutrition expert. Provide accurate nutritional information for dishes as complete units. Always respond with valid JSON that exactly matches the requested structure. Return ONLY the JSON object with no markdown or explanatory text."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      consecutiveFailures++;
      throw new Error('No response from OpenAI');
    }

    console.log('Dish nutrition response:', content);
    
    try {
      // Parse the response
      const dishData = JSON.parse(content);
      
      // Reset failure counter on success
      consecutiveFailures = 0;
      
      // Build the final result object
      return {
        name: dishData.name || dishName,
        calories: dishData.calories || 0,
        protein: dishData.protein || 0,
        carbs: dishData.carbs || 0,
        fat: dishData.fat || 0,
        estimatedQuantity: dishData.estimatedQuantity || `${servingSize} serving(s)`
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Count as a failure
      consecutiveFailures++;
      
      // Fallback with generic values if parsing fails
      return {
        name: dishName,
        calories: 350,
        protein: 15,
        carbs: 30,
        fat: 15,
        estimatedQuantity: `${servingSize} serving(s)`
      };
    }
  } catch (error) {
    console.error('Error fetching nutrition for dish:', error);
    // Count as a failure
    consecutiveFailures++;
    
    // Return default values instead of throwing
    return {
      name: dishName,
      calories: 350,
      protein: 15,
      carbs: 30,
      fat: 15,
      estimatedQuantity: `${servingSize} serving(s)`
    };
  }
}; 