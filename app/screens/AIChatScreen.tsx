import React, { useState, useRef, useEffect, useContext, ReactNode } from 'react';
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
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
  Dimensions,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchChatResponse, fetchNutritionForIngredient } from '../services/openai';
import { AppContext } from '../context/AppContext';
import Header from '../components/Header';
import { NutritionGoals } from '../../types';
import { COLORS } from '../constants';
import { createNutritionGoals, ActivityLevel, GoalType } from '../utils/calculators';

interface Message {
  text: string;
  isUser: boolean;
}

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = width * 0.75;

export default function AIChatScreen() {
  const { addMeal, addCustomIngredient, setGoals, goals } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // Move animation state and logic to component level
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Add initial greeting message
    setMessages([
      {
        text: "Hi! I'm your nutrition assistant. I can help you with:\n\n1. Setting nutrition goals\n2. Adding meals and ingredients\n3. Providing nutrition advice\n\nWhat would you like to do?",
        isUser: false,
      },
    ]);
  }, []);
  
  // Add animation effect that only runs when isLoading changes to true
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    
    const animateDots = () => {
      // Reset values
      dot1Opacity.setValue(0.4);
      dot2Opacity.setValue(0.4);
      dot3Opacity.setValue(0.4);
      
      // Create animation sequence
      Animated.sequence([
        // Dot 1 animation
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Dot 2 animation
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Dot 3 animation
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Loop the animation
        animationTimeout = setTimeout(animateDots, 300);
      });
    };
    
    if (isLoading) {
      animateDots();
    }
    
    // Clean up animation when component unmounts or isLoading changes
    return () => {
      clearTimeout(animationTimeout);
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, [isLoading, dot1Opacity, dot2Opacity, dot3Opacity]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      // Pass current user data from the goals context to OpenAI
      const userData = goals ? {
        weight: goals.weight,
        height: goals.height,
        age: goals.age,
        gender: goals.gender,
        activityLevel: goals.activityLevel,
        goal: goals.goal
      } : undefined;

      const response = await fetchChatResponse(userMessage, messages, userData);
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
      // Check if the AI response has nutrition goals JSON format
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData.type === 'nutrition_goals') {
            const goals = await extractGoalsFromResponse(response);
            if (goals) {
              await setGoals(goals);
              Alert.alert('Success', 'Your nutrition goals have been updated!');
            } else {
              Alert.alert('Error', 'Failed to parse nutrition goals from AI response');
            }
          }
        } catch (error) {
          console.error('Error parsing JSON from response:', error);
        }
      }

      // Fallback to old format
      else if (response.includes('Setting your nutrition goals')) {
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
    // Extract JSON from the response using a regex for triple backtick code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        
        // Check if this is a nutrition goals response
        if (jsonData.type === 'nutrition_goals' && jsonData.userDetails) {
          console.log('Found user details in JSON format!', jsonData.userDetails);
          
          // Extract user details
          const userDetails = jsonData.userDetails || {};
          
          // Validate user details
          const weight = Number(userDetails.weight) || 70;
          const height = Number(userDetails.height) || 170;
          const age = Number(userDetails.age) || 30;
          const gender = (userDetails.gender === 'male' || userDetails.gender === 'female') 
            ? userDetails.gender 
            : 'male';
          const activityLevel = ['sedentary', 'lightly active', 'moderately active', 'very active', 'extra active']
            .includes(userDetails.activityLevel) 
              ? userDetails.activityLevel as ActivityLevel
              : 'moderately active';
          const goal = ['lose weight', 'gain weight', 'maintain', 'build muscle']
            .includes(userDetails.goal)
              ? userDetails.goal as GoalType
              : 'maintain';
          
          // Use the app's calculator to ensure consistency
          const nutritionGoals = createNutritionGoals({
            weight,
            height,
            age,
            gender,
            activityLevel,
            goal
          });
          
          console.log('Calculated nutrition goals using app calculator:', nutritionGoals);
          return nutritionGoals;
        }
      } catch (error) {
        console.error('Error parsing goals JSON:', error);
      }
    }
    
    // Fallback to the old format if JSON parsing fails
    const goalsMatch = response.match(/Setting your nutrition goals:\s*Calories:\s*(\d+)\s*Protein:\s*(\d+)g\s*Carbs:\s*(\d+)g\s*Fat:\s*(\d+)g/s);
    
    if (goalsMatch) {
      console.log('Found nutrition goals in old format!', goalsMatch);
      
      // Instead of using the old format values directly, use default user details
      // with the app's calculator for consistency
      return createNutritionGoals({
        weight: 70,
        height: 170,
        age: 30,
        gender: 'male',
        activityLevel: 'moderately active',
        goal: 'maintain'
      });
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
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderAIMessageBubble = (text: string, index: number) => {
    return (
      <View key={index} style={styles.aiMessageContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.aiAvatar}>
            <Ionicons name="nutrition" size={16} color={COLORS.white} />
          </View>
        </View>
        <View style={styles.aiMessageBubble}>
          <Text style={styles.aiMessageText}>{text}</Text>
        </View>
      </View>
    );
  };

  const renderUserMessageBubble = (text: string, index: number) => {
    return (
      <View key={index} style={styles.userMessageContainer}>
        <View style={styles.userMessageBubble}>
          <Text style={styles.userMessageText}>{text}</Text>
        </View>
      </View>
    );
  };

  const renderLoadingIndicator = () => {
    return (
      <View style={styles.aiMessageContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.aiAvatar}>
            <Ionicons name="nutrition" size={16} color={COLORS.white} />
          </View>
        </View>
        <View style={styles.loadingBubble}>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.loadingDot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.loadingDot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.loadingDot, { opacity: dot3Opacity }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <Header title="AI Assistant" showHeaderBackground={isScrolled} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={60}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onScroll={(event) => {
            // Simple scroll detection without animation values
            const scrollOffset = event.nativeEvent.contentOffset.y;
            setIsScrolled(scrollOffset > 10);
          }}
          scrollEventThrottle={16}
        >
          {messages.map((message, index) =>
            message.isUser
              ? renderUserMessageBubble(message.text, index)
              : renderAIMessageBubble(message.text, index)
          )}
          {isLoading && renderLoadingIndicator()}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.grey4}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim()
                  ? styles.sendButtonDisabled
                  : styles.sendButtonActive,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  !inputText.trim() || isLoading ? COLORS.grey2 : COLORS.white
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 60, // Account for header + status bar on iOS
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 30,
  },
  // AI Message Styles
  aiMessageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  avatarContainer: {
    marginRight: 8,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
  },
  aiMessageBubble: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 12,
    paddingVertical: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: MAX_BUBBLE_WIDTH - 40,
  },
  aiMessageText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // User Message Styles
  userMessageContainer: {
    alignSelf: "flex-end",
    marginBottom: 16,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  userMessageBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 12,
    paddingVertical: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    backgroundColor: COLORS.secondary,
  },
  userMessageText: {
    fontSize: 16,
    color: COLORS.white,
    lineHeight: 22,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  // Loading Indicator Styles
  loadingBubble: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    height: 40,
    width: 64,
    justifyContent: "center",
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 2,
  },

  // Input Styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
    marginRight: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    maxHeight: 100,
    padding: 0,
    flex: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sendButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.background,
  },
}); 