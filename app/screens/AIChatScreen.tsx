import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchChatResponse, fetchNutritionForIngredient } from '../services/openai';
import { AppContext } from '../context/AppContext';

interface Message {
  text: string;
  isUser: boolean;
}

export default function AIChatScreen() {
  const { addMeal, addCustomIngredient, setGoals } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add initial greeting message
    setMessages([
      {
        text: "Hi! I'm your nutrition assistant. I can help you with:\n\n1. Setting nutrition goals\n2. Adding meals and ingredients\n3. Providing nutrition advice\n\nWhat would you like to do?",
        isUser: false,
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const response = await fetchChatResponse(userMessage, messages);
      setMessages(prev => [...prev, { text: response, isUser: false }]);

      // Process any actions that the AI might have triggered
      await processAIResponse(response, userMessage);
    } catch (error) {
      console.error('Error getting chat response:', error);
      setMessages(prev => [
        ...prev,
        {
          text: "I'm sorry, I encountered an error. Please try again.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const processAIResponse = async (response: string, userInput: string) => {
    try {
      // Check if the AI response indicates a goal setting action
      if (response.includes('Setting your nutrition goals')) {
        const goals = await extractGoalsFromResponse(response);
        if (goals) {
          await setGoals(goals);
          Alert.alert('Success', 'Your nutrition goals have been updated!');
        } else {
          Alert.alert('Error', 'Failed to parse nutrition goals from AI response');
        }
      }

      // Check if the AI response indicates a meal addition
      if (response.includes('Adding your meal')) {
        const mealData = await extractMealDataFromResponse(response);
        if (mealData) {
          await addMeal(mealData);
          Alert.alert('Success', 'Your meal has been added!');
        }
      }

      // Check if the AI response indicates an ingredient addition
      if (response.includes('Adding your ingredient')) {
        const ingredientData = await extractIngredientDataFromResponse(response);
        if (ingredientData) {
          await addCustomIngredient(ingredientData);
          Alert.alert('Success', 'Your ingredient has been added!');
        }
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      Alert.alert('Error', 'Failed to process the action. Please try again.');
    }
  };

  const extractGoalsFromResponse = async (response: string) => {
    // Extract goals from AI response using a more precise regex
    const goalsMatch = response.match(/Setting your nutrition goals:\s*Calories:\s*(\d+)\s*Protein:\s*(\d+)g\s*Carbs:\s*(\d+)g\s*Fat:\s*(\d+)g/s);
    
    if (goalsMatch) {
      console.log('Found nutrition goals!', goalsMatch);
      return {
        calories: parseInt(goalsMatch[1]),
        protein: parseInt(goalsMatch[2]),
        carbs: parseInt(goalsMatch[3]),
        fat: parseInt(goalsMatch[4]),
        activityLevel: 'moderately active', // Default value
        goal: 'maintain', // Default value
        weight: 70, // Default value
        height: 170, // Default value
      };
    }
    
    console.log('Failed to extract goals from response:', response);
    return null;
  };

  const extractMealDataFromResponse = async (response: string) => {
    // Extract meal data from AI response
    const mealMatch = response.match(/Meal: "([^"]+)".*Ingredients: (.*)/s);
    if (mealMatch) {
      const mealName = mealMatch[1];
      const ingredientsText = mealMatch[2];
      const ingredients = ingredientsText.split(',').map(ing => ing.trim());
      const mealIngredients = [];

      for (const ingredient of ingredients) {
        const [quantity, unit, ...nameParts] = ingredient.split(' ');
        const name = nameParts.join(' ');

        try {
          const nutrition = await fetchNutritionForIngredient(name, unit, parseFloat(quantity));
          mealIngredients.push({
            id: Date.now().toString(),
            name,
            unit,
            quantity: parseFloat(quantity),
            nutrition,
          });
        } catch (error) {
          console.error('Error fetching nutrition for ingredient:', error);
        }
      }

      return {
        name: mealName,
        date: new Date().toISOString().split('T')[0],
        ingredients: mealIngredients,
      };
    }
    return null;
  };

  const extractIngredientDataFromResponse = async (response: string) => {
    // Extract ingredient data from AI response
    const ingredientMatch = response.match(/Ingredient: "([^"]+)".*Unit: ([^.]+)/s);
    if (ingredientMatch) {
      const name = ingredientMatch[1];
      const unit = ingredientMatch[2];

      try {
        const nutrition = await fetchNutritionForIngredient(name, unit, 100);
        return {
          name,
          unit,
          nutrition,
        };
      } catch (error) {
        console.error('Error fetching nutrition for ingredient:', error);
      }
    }
    return null;
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText,
            ]}>
              {message.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#4CAF50" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={24}
            color={!inputText.trim() || isLoading ? '#666' : '#4CAF50'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 