import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  SafeAreaView, 
  StatusBar,
  Animated,
  ActivityIndicator
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { AppContext } from '../context/AppContext';
import { fetchImageCalories } from '../services/openai';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import QuantityEditModal from '../components/QuantityEditModal';
import { v4 as uuidv4 } from 'uuid';
import { Dish, MealIngredient } from "../../types";
import { COLORS } from '../constants';
import { FynkoAIButton, FynkoDatePicker, FynkoImagePicker, FynkoTextInput } from '../components/common';

// Local interface for dish info with quantity
interface DishInfo {
  name: string;
  macros: {
    protein: number | undefined;
    carbs: number | undefined;
    fat: number | undefined;
  };
  baseCalories: number; // Base calories per unit (e.g., per 1 roti)
  quantity: number; // Always 1 (one serving)
  estimatedQuantity: string; // What AI detected (e.g., "5 rotis")
  detectedCount: number; // Numeric count detected by AI (e.g., 5)
  currentCount: number; // Current count set by user (e.g., 3)
}

// Helper function to extract numeric quantity from estimated quantity string
const parseEstimatedQuantity = (estimatedQuantity?: string): number => {
  if (!estimatedQuantity) return 1;
  
  // Extract number from strings like "5 rotis", "2 servings", "3 pieces", etc.
  const match = estimatedQuantity.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const quantity = parseFloat(match[1]);
    return quantity > 0 ? quantity : 1;
  }
  
  return 1;
};

const Upload: React.FC = () => {
  const { addPhotoMeal } = useContext(AppContext);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [isScrolled, setIsScrolled] = useState(false);
  const [calories, setCalories] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [dishesInfo, setDishesInfo] = useState<DishInfo[]>([]);
  const [editingDishIndex, setEditingDishIndex] = useState<number | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);

  // Function to optimize image for API processing
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      // Resize the image to a smaller resolution
      // 512x512 is usually more than enough for vision AI models
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      console.log(`Original image size: ${uri}`);
      console.log(`Optimized image size: ${manipResult.uri}`);
      
      return manipResult.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return uri; // Return original URI if optimization fails
    }
  };

  const analyzeImage = async () => {
    setLoading(true);
    setDishesInfo([]);
    setCalories(null);
    if (!imageUri) {
      Alert.alert('Error', 'Please select or take a photo first');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await fetchImageCalories(imageUri, description);
      
      // Process dishes with their ingredients
      const processedDishes = result.map(dish => {
        const detectedCount = parseEstimatedQuantity(dish.estimatedQuantity);
        const baseCalories = detectedCount > 0 ? (dish.calories || 0) / detectedCount : (dish.calories || 0);
        
        return {
          name: dish.name || 'Unknown Dish',
          baseCalories: baseCalories,
          macros: {
            protein: dish.protein || 0,
            carbs: dish.carbs || 0,
            fat: dish.fat || 0,
          },
          quantity: 1, // Always 1 serving
          estimatedQuantity: dish.estimatedQuantity || '1 serving',
          detectedCount: detectedCount,
          currentCount: detectedCount // Start with the detected count
        };
      });
      
      setDishesInfo(processedDishes);
      
      // Calculate total calories from all identified dishes with their current counts
      const totalCalories = processedDishes.reduce((sum, dish) => sum + (dish.baseCalories * dish.currentCount), 0);
      setCalories(totalCalories);
      
    } catch (error) {
      console.error('Image analysis error:', error);
      Alert.alert('Error', 'Failed to analyze image. The image might be too large or the service is temporarily unavailable.');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const openQuantityModal = (index: number) => {
    setEditingDishIndex(index);
    setQuantityModalVisible(true);
  };

  const updateDishQuantity = (newCount: number) => {
    if (editingDishIndex === null) return;

    setDishesInfo(current => {
      const updated = [...current];
      updated[editingDishIndex].currentCount = newCount;
      return updated;
    });
    
    // Recalculate total calories
    const newTotalCalories = dishesInfo.reduce((sum, dish, index) => {
      const currentCount = index === editingDishIndex ? newCount : dish.currentCount;
      return sum + (dish.baseCalories * currentCount);
    }, 0);
    
    setCalories(newTotalCalories);
    setQuantityModalVisible(false);
    setEditingDishIndex(null);
  };

  const handleSave = async () => {
    if (!originalImageUri) {
      Alert.alert('Error', 'Please select or take a photo first');
      return;
    }

    if (!calories) {
      Alert.alert('Error', 'Please analyze the image first to get calorie estimate');
      return;
    }

    setLoading(true);
    try {
      // Create dishes from the analysis, accounting for multipliers
      const dishes: Dish[] = dishesInfo.map(dishInfo => {
        // Create a single ingredient representing the entire dish
        const dishIngredient: MealIngredient = {
          id: uuidv4(),
          name: dishInfo.name,
          unit: 'serving',
          quantity: dishInfo.currentCount,
          nutrition: {
            calories: dishInfo.baseCalories * dishInfo.currentCount,
            protein: dishInfo.macros.protein || 0,
            carbs: dishInfo.macros.carbs || 0,
            fat: dishInfo.macros.fat || 0
          }
        };
        
        // Create the dish with this single ingredient, multiply calories by multiplier
        return {
          id: uuidv4(),
          name: dishInfo.name,
          ingredients: [dishIngredient],
          totalCalories: dishInfo.baseCalories * dishInfo.currentCount
        };
      });

      // Create a meal name using the time of day as HH:MM
      const mealName = `Photo Meal: ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      // Recalculate total calories based on multipliers
      const totalCaloriesWithMultipliers = dishesInfo.reduce((sum, dish) => 
        sum + (dish.baseCalories * dish.currentCount), 0);

      // Save the meal with all dishes
      await addPhotoMeal(
        originalImageUri,
        date.toISOString().split("T")[0],
        totalCaloriesWithMultipliers,
        dishes,
        [],
        mealName
      );
      
      Alert.alert('Success', 'Meal saved successfully');
      setImageUri(null);
      setOriginalImageUri(null);
      setCalories(null);
      setDishesInfo([]);
      setDescription('');
      setDate(new Date());
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total calories including multipliers
  const totalCaloriesWithMultiplier = calories ? 
    dishesInfo.reduce((sum, dish) => sum + (dish.baseCalories * dish.currentCount), 0) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <Header title="Upload Meal" showHeaderBackground={isScrolled} />

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          // Update isScrolled state based on scroll position
          const scrollOffset = event.nativeEvent.contentOffset.y;
          setIsScrolled(scrollOffset > 10);
          
          // Update the scrollY animated value directly
          scrollY.setValue(scrollOffset);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Upload Meal Photo</Text>
          <Text style={styles.sectionDescription}>
            Take a photo of your meal or upload from gallery to track your calories
          </Text>
        </View>

        {/* Date Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Date</Text>
          
          <FynkoDatePicker
            date={date}
            onDateChange={(newDate) => setDate(newDate)}
          />
        </View>

        {/* Description Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Description (Optional)</Text>
          <FynkoTextInput
            placeholder="Describe your meal"
            value={description}
            onChangeText={setDescription}
            maxLength={50}
            showCharacterCount={true}
            helperText="Help AI better identify your meal"
            leftIcon="restaurant-outline"
          />
        </View>

        {/* Image Upload Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Photo</Text>

          <FynkoImagePicker
            selectedImage={imageUri}
            onImageSelected={async (uri) => {
              setOriginalImageUri(uri);
              const optimizedUri = await optimizeImage(uri);
              setImageUri(optimizedUri);
              setCalories(null); // Reset calories when new image is selected
            }}
            onImageRemoved={() => {
              setImageUri(null);
              setOriginalImageUri(null);
              setCalories(null);
            }}
            placeholder="Select meal photo"
          />
        </View>

        {/* Analysis Section */}
        {imageUri && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calorie Analysis</Text>
            
            {calories ? (
              <View style={styles.calorieResult}>
                <View style={styles.calorieCircle}>
                  <Text style={styles.calorieValue}>{totalCaloriesWithMultiplier}</Text>
                  <Text style={styles.calorieLabel}>calories</Text>
                </View>
                
                {dishesInfo.length > 0 && (
                  <View style={styles.dishesContainer}>
                    {dishesInfo.map((dish, index) => (
                      <View key={index} style={styles.dishCard}>
                        <View style={styles.dishHeader}>
                          <Text style={styles.dishName}>{dish.name}</Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => openQuantityModal(index)}
                          >
                            <Text style={styles.quantityText}>
                              {dish.currentCount} {dish.estimatedQuantity.replace(/^\d+(\.\d+)?\s*/, '') || 'items'}
                            </Text>
                            <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.estimatedQuantityText}>
                          AI detected: {dish.estimatedQuantity}
                        </Text>
                        
                        <Text style={styles.dishCalories}>
                          {Math.round(dish.baseCalories * dish.currentCount)} calories
                          {dish.currentCount !== dish.detectedCount && ` (${Math.round(dish.baseCalories)} per unit × ${dish.currentCount})`}
                        </Text>
                        
                        <View style={styles.macroInfo}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.protein || 0) * dish.currentCount)}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.carbs || 0) * dish.currentCount)}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Fat</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.fat || 0) * dish.currentCount)}g
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.reanalyzeButton}
                  onPress={analyzeImage}
                >
                  <Text style={styles.reanalyzeText}>Re-analyze</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FynkoAIButton
                title="Analyze Photo"
                onPress={analyzeImage}
                loading={analyzing}
                disabled={analyzing}
                icon="nutrition-outline"
              />
            )}
            
            <Text style={styles.infoText}>
              Our AI analyzes your food photo and estimates the quantity and calories. You can edit the quantity directly if the AI count is incorrect.
            </Text>
          </View>
        )}

        {/* Save Button */}
        {imageUri && calories && (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Save Meal</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Quantity Edit Modal */}
        <QuantityEditModal
          visible={quantityModalVisible}
          dishInfo={editingDishIndex !== null && dishesInfo[editingDishIndex] ? {
            name: dishesInfo[editingDishIndex].name,
            estimatedQuantity: dishesInfo[editingDishIndex].estimatedQuantity,
            currentCount: dishesInfo[editingDishIndex].currentCount
          } : null}
          onClose={() => setQuantityModalVisible(false)}
          onUpdate={updateDishQuantity}
        />

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

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
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.background,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  uploadPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    padding: 15,
    flex: 0.48,
  },
  galleryButton: {
    backgroundColor: COLORS.buttonColor,
  },
  cameraButton: {
    backgroundColor: COLORS.buttonColor2,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  changeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.opaqueBlack,
    borderRadius: 20,
    padding: 5,
  },
  calorieResult: {
    alignItems: "center",
    marginBottom: 20,
  },
  calorieCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.buttonColor2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  calorieLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reanalyzeButton: {
    padding: 8,
  },
  reanalyzeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.error3,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: COLORS.blueGrey,
    opacity: 0.7,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.buttonColor,
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomPadding: {
    height: 80,
  },
  descriptionInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  dishesContainer: {
    width: "100%",
    marginTop: 20,
  },
  dishCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  dishName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dishCalories: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 10,
  },
  macroInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 10,
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  dishHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  quantityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginRight: 4,
  },
  estimatedQuantityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
});

export default Upload; 