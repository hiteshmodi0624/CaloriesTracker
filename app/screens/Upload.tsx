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
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import { fetchImageCalories, DishWithIngredients, IngredientData } from '../services/openai';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { v4 as uuidv4 } from 'uuid';
import { Dish, NutritionInfo, MealIngredient } from '../../types';

// Local interface for dish info with quantity
interface DishInfo {
  name: string;
  macros: {
    protein: number | undefined;
    carbs: number | undefined;
    fat: number | undefined;
  };
  calories: number;
  quantity: number;
  ingredients?: IngredientData[];
}

const Upload: React.FC = () => {
  const { addPhotoMeal } = useContext(AppContext);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [isScrolled, setIsScrolled] = useState(false);
  const [calories, setCalories] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [dishesInfo, setDishesInfo] = useState<DishInfo[]>([]);
  const [editingDishIndex, setEditingDishIndex] = useState<number | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [newQuantity, setNewQuantity] = useState('1');

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Lower quality for initial selection
    });

    if (!result.canceled) {
      setOriginalImageUri(result.assets[0].uri);
      const optimizedUri = await optimizeImage(result.assets[0].uri);
      setImageUri(optimizedUri);
      setCalories(null); // Reset calories when new image is selected
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Lower quality for initial capture
    });

    if (!result.canceled) {
      setOriginalImageUri(result.assets[0].uri);
      const optimizedUri = await optimizeImage(result.assets[0].uri);
      setImageUri(optimizedUri);
      setCalories(null); // Reset calories when new image is taken
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select or take a photo first');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await fetchImageCalories(imageUri, description);
      
      // Calculate total calories from all identified dishes
      const totalCalories = result.reduce((sum, dish) => sum + dish.calories, 0);
      
      setCalories(totalCalories);
      
      // Process dishes with their ingredients
      setDishesInfo(result.map(dish => ({
        name: dish.name || 'Unknown Dish',
        calories: dish.calories || 0,
        macros: {
          protein: dish.protein || 0,
          carbs: dish.carbs || 0,
          fat: dish.fat || 0,
        },
        quantity: 1,
        ingredients: dish.ingredients || []
      })));
      
    } catch (error) {
      console.error('Image analysis error:', error);
      Alert.alert('Error', 'Failed to analyze image. The image might be too large or the service is temporarily unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const openQuantityModal = (index: number) => {
    setEditingDishIndex(index);
    setNewQuantity(dishesInfo[index].quantity.toString());
    setQuantityModalVisible(true);
  };

  const updateDishQuantity = () => {
    if (editingDishIndex === null) return;
    
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid number greater than 0');
      return;
    }

    setDishesInfo(current => {
      const updated = [...current];
      updated[editingDishIndex].quantity = quantity;
      return updated;
    });
    
    // Recalculate total calories
    const newTotalCalories = dishesInfo.reduce((sum, dish) => {
      return sum + (dish.calories * (dish.quantity || 1));
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
      // Create dishes and ingredients from the analysis, accounting for quantities
      const dishes: Dish[] = dishesInfo.map(dishInfo => {
        // Create ingredients array for this dish
        const ingredients: MealIngredient[] = dishInfo.ingredients?.map(ing => ({
          id: uuidv4(),
          name: ing.name,
          unit: ing.unit,
          quantity: ing.quantity * dishInfo.quantity, // Adjust quantity by dish quantity
          nutrition: {
            calories: ing.calories,
            protein: ing.protein,
            carbs: ing.carbs,
            fat: ing.fat
          }
        })) || [];
        
        // If no ingredients were detected, create a default ingredient
        if (ingredients.length === 0) {
          ingredients.push({
            id: uuidv4(),
            name: dishInfo.name,
            unit: 'serving',
            quantity: dishInfo.quantity,
            nutrition: {
              calories: dishInfo.calories,
              protein: dishInfo.macros.protein || 0,
              carbs: dishInfo.macros.carbs || 0,
              fat: dishInfo.macros.fat || 0
            }
          });
        }
        
        // Create the dish with this ingredient, multiply calories by quantity
        return {
          id: uuidv4(),
          name: dishInfo.name,
          ingredients: ingredients,
          totalCalories: dishInfo.calories * dishInfo.quantity
        };
      });
      
      // Create a flat list of all ingredients for the meal
      const allIngredients = dishes.flatMap(dish => dish.ingredients);

      // Create a meal name using the time of day as HH:MM
      const mealName = `Photo Meal: ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      // Recalculate total calories based on quantities
      const totalCaloriesWithQuantities = dishesInfo.reduce((sum, dish) => 
        sum + (dish.calories * dish.quantity), 0);

      // Save the meal with all dishes and ingredients
      await addPhotoMeal(
        originalImageUri, 
        date.toISOString().split('T')[0], 
        totalCaloriesWithQuantities, 
        dishes, 
        allIngredients,
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

  // Calculate total calories including quantities
  const totalCaloriesWithQuantity = calories ? 
    dishesInfo.reduce((sum, dish) => sum + (dish.calories * dish.quantity), 0) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
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
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#5E72E4" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Description Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Description (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your meal (e.g., Lunch at Joe's Cafe)"
            value={description}
            onChangeText={setDescription}
            multiline={false}
            maxLength={50}
          />
        </View>

        {/* Image Upload Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Photo</Text>

          <View style={styles.imageContainer}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={28} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={60} color="#8898AA" />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.uploadButton, styles.galleryButton]} 
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, styles.cameraButton]} 
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis Section */}
        {imageUri && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calorie Analysis</Text>
            
            {calories ? (
              <View style={styles.calorieResult}>
                <View style={styles.calorieCircle}>
                  <Text style={styles.calorieValue}>{totalCaloriesWithQuantity}</Text>
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
                              {dish.quantity}× 
                            </Text>
                            <Ionicons name="create-outline" size={14} color="#5D5FEF" />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.dishCalories}>
                          {Math.round(dish.calories * dish.quantity)} calories 
                          {dish.quantity !== 1 && ` (${Math.round(dish.calories)} × ${dish.quantity})`}
                        </Text>
                        
                        <View style={styles.macroInfo}>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.protein || 0) * dish.quantity)}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.carbs || 0) * dish.quantity)}g
                            </Text>
                          </View>
                          <View style={styles.macroItem}>
                            <Text style={styles.macroLabel}>Fat</Text>
                            <Text style={styles.macroValue}>
                              {Math.round((dish.macros.fat || 0) * dish.quantity)}g
                            </Text>
                          </View>
                        </View>
                        
                        {/* Ingredients List */}
                        {dish.ingredients && dish.ingredients.length > 0 && (
                          <View style={styles.ingredientsContainer}>
                            <Text style={styles.ingredientsTitle}>Ingredients:</Text>
                            {dish.ingredients.map((ingredient, ingIndex) => (
                              <View key={ingIndex} style={styles.ingredientItem}>
                                <Text style={styles.ingredientName}>
                                  • {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                                </Text>
                                <Text style={styles.ingredientCalories}>
                                  {Math.round(ingredient.calories * dish.quantity)} cal
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
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
              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.disabledButton]}
                onPress={analyzeImage}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.buttonText}>Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="nutrition-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Analyze Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <Text style={styles.infoText}>
              Our AI will analyze your food photo and estimate the calories and nutrients.
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
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Meal</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Quantity Edit Modal */}
        <Modal
          visible={quantityModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Quantity</Text>
              
              {editingDishIndex !== null && dishesInfo[editingDishIndex] && (
                <Text style={styles.modalIngredientName}>{dishesInfo[editingDishIndex].name}</Text>
              )}
              
              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={styles.quantityInput}
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={styles.unitText}>servings</Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setQuantityModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.updateButton]}
                  onPress={updateDishQuantity}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fe",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fe",
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
    color: "#32325d",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 16,
    color: "#525f7f",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32325d",
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#525f7f",
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f7fafc",
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
    color: "#8898AA",
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
    backgroundColor: "#11CDEF",
  },
  cameraButton: {
    backgroundColor: "#5E72E4",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  changeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    backgroundColor: "#5E72E4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  calorieLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  reanalyzeButton: {
    padding: 8,
  },
  reanalyzeText: {
    fontSize: 14,
    color: "#5E72E4",
    fontWeight: "600",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FB6340",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: "#8898AA",
    opacity: 0.7,
  },
  infoText: {
    fontSize: 14,
    color: "#8898AA",
    textAlign: "center",
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2DCE89",
    borderRadius: 10,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomPadding: {
    height: 80,
  },
  descriptionInput: {
    backgroundColor: "#f7fafc",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#525f7f",
  },
  dishesContainer: {
    width: '100%',
    marginTop: 20,
  },
  dishCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#32325d',
    marginBottom: 4,
  },
  dishCalories: {
    fontSize: 14,
    color: '#FB6340',
    fontWeight: '500',
    marginBottom: 10,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: '#8898AA',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5E72E4',
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 14,
    color: '#5D5FEF',
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalIngredientName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
  },
  quantityInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  unitText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  updateButton: {
    backgroundColor: '#5D5FEF',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  ingredientsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525F7F',
    marginBottom: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
    paddingLeft: 4,
  },
  ingredientName: {
    fontSize: 13,
    color: '#8898AA',
    flex: 1,
  },
  ingredientCalories: {
    fontSize: 13,
    color: '#525F7F',
    fontWeight: '500',
  },
});

export default Upload; 