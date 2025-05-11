import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import { NutritionInfo } from '../../types';
import { ENV, validateEnv } from '../config/env';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';

// Validate environment variables at startup
if (!validateEnv()) {
  console.warn('OpenAI API key not properly configured. AI features will not work.');
}
console.log(ENV.EXPO_PUBLIC_OPENAI_API_KEY);

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
      model: "gpt-4o",
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
  messageHistory: { text: string; isUser: boolean }[]
): Promise<string> => {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are a nutrition assistant that can help users with:
1. Setting nutrition goals
2. Adding meals and ingredients
3. Providing nutrition advice

When setting goals, calculate and provide:
- Daily calorie target
- Protein, carbs, and fat requirements
- Activity level recommendations

FORMAT FOR GOAL SETTING:
When you calculate nutrition goals, use the following template to ensure the app can correctly extract the data:

Setting your nutrition goals:
Calories: [calories]
Protein: [protein]g
Carbs: [carbs]g
Fat: [fat]g

For example: "Setting your nutrition goals:
Calories: 2200
Protein: 150g
Carbs: 220g
Fat: 70g"

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
      model: "gpt-3.5-turbo",
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

export const fetchImageCalories = async (imageUri: string): Promise<number> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: "What is the estimated calorie content of this meal? Please provide only the number."
            },
            {
              type: "text" as const,
              text: `data:image/jpeg;base64,${base64}`
            }
          ]
        }
      ],
      max_tokens: 10
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return parseInt(content) || 0;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

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
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
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
): Promise<NutritionInfo> => {
  try {
    const prompt = `What are the nutritional values for ${servingSize} serving(s) of ${dishName}? Please provide calories, protein, carbs, and fat in JSON format.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system" as const,
          content: "You are a nutrition expert. Provide nutritional information for complete dishes in JSON format with calories, protein, carbs, and fat values. Make a reasonable estimate based on standard restaurant or homemade recipes. Return ONLY the JSON object with no markdown or explanation."
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
    
    console.log('Extracted JSON string for dish:', jsonString);
    
    try {
      const nutrition = JSON.parse(jsonString);
      // Reset failure counter on success
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
        calories: 350,
        protein: 15,
        carbs: 30,
        fat: 15,
      };
    }
  } catch (error) {
    console.error('Error fetching nutrition for dish:', error);
    // Count as a failure
    consecutiveFailures++;
    // Return default values instead of throwing
    return {
      calories: 350,
      protein: 15,
      carbs: 30,
      fat: 15,
    };
  }
}; 