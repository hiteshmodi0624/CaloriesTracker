import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import { MealIngredient, Ingredient, NutritionInfo, Meal } from '../../types';
import { fetchNutritionForIngredient, extractNutritionFromLabel } from '../services/openai';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Create a Snackbar component at the top of the file

// Custom Snackbar component
interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onDismiss: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ visible, message, type = 'error', onDismiss }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, onDismiss]);

  const backgroundColor = type === 'error' ? '#FF3B30' 
                        : type === 'success' ? '#34C759' 
                        : type === 'warning' ? '#FF9500' 
                        : '#007AFF';

  return visible ? (
    <Animated.View 
      style={[
        styles.snackbar, 
        { 
          backgroundColor,
          transform: [{ translateY }],
          opacity
        }
      ]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
    </Animated.View>
  ) : null;
};

const CreateMeal: React.FC = () => {
  const { 
    addMeal, 
    ingredients, 
    addCustomIngredient, 
    deleteIngredient, 
    resetIngredientsStorage,
    getPastMeals,
    duplicateMeal 
  } = useContext(AppContext);
  
  // Meal state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  
  // Ingredient selection state
  const [showCustomIngredients, setShowCustomIngredients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  
  // New ingredient state
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionInfo>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  
  // Past meals state
  const [showPastMeals, setShowPastMeals] = useState(false);
  const [pastMeals, setPastMeals] = useState<Meal[]>([]);
  
  // Common food measurement units
  const unitOptions = [
    'grams',
    'ml',
    'cups',
    'tbsp',
    'tsp',
    'oz',
    'pieces',
    'servings',
    'slices'
  ];
  
  // Calculate total nutrition for the meal
  const mealNutrition = useMemo(() => {
    return mealIngredients.reduce((sum, ing) => {
      return {
        calories: sum.calories + ing.nutrition.calories,
        protein: sum.protein + (ing.nutrition.protein || 0),
        carbs: sum.carbs + (ing.nutrition.carbs || 0),
        fat: sum.fat + (ing.nutrition.fat || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealIngredients]);
  
  // For debugging
  useEffect(() => {
    console.log('Current meal ingredients:', mealIngredients);
    console.log('Available saved ingredients:', ingredients);
  }, [mealIngredients, ingredients]);

  // Add debug function for ingredient list
  const logIngredientStatus = () => {
    console.log(`Ingredients available: ${ingredients.length}`);
    if (ingredients.length > 0) {
      console.log('Sample ingredient:', JSON.stringify(ingredients[0]));
    } else {
      console.log('No ingredients available');
    }
  };

  // Add snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  // Helper function to show snackbar
  const showSnackbar = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Hide snackbar
  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  const handleAddNewIngredient = async () => {
    if (!ingredientName) {
      showSnackbar('Please enter an ingredient name');
      return;
    }
    
    if (!ingredientUnit) {
      showSnackbar('Please select a unit');
      return;
    }
    
    if (!ingredientQuantity) {
      showSnackbar('Please enter a quantity');
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity)) {
      showSnackbar('Please enter a valid quantity');
      return;
    }

    try {
      const nutrition = await fetchNutritionForIngredient(ingredientName, ingredientUnit, quantity);
      
      const newIngredient: MealIngredient = {
        id: Date.now().toString(),
        name: ingredientName,
        unit: ingredientUnit,
        quantity,
        nutrition,
      };
      
      // Add the new ingredient to the list
      const updatedIngredients = [...mealIngredients, newIngredient];
      setMealIngredients(updatedIngredients);
      
      // Clear the fields
      setIngredientName('');
      setIngredientUnit('');
      setIngredientQuantity('');
      
      // Show success message
      showSnackbar('Ingredient added successfully', 'success');
    } catch (error) {
      console.error('Error fetching nutrition:', error);
      showSnackbar('Failed to fetch nutrition information');
    }
  };

  const onSelectIngredient = (ingredient: Ingredient) => {
    try {
      console.log('Selecting ingredient:', JSON.stringify(ingredient));
      
      if (!ingredientQuantity) {
        showSnackbar('Please enter a quantity first');
        return;
      }

      const quantity = parseFloat(ingredientQuantity);
      if (isNaN(quantity)) {
        showSnackbar('Please enter a valid quantity');
        return;
      }

      // Scale nutrition based on quantity
      const scaleFactor = quantity / 100; // Assuming ingredients are stored per 100 units
      console.log(`Scaling factor: ${scaleFactor} (${quantity}/${100})`);
      
      const scaledNutrition = {
        calories: (ingredient.nutrition.calories || 0) * scaleFactor,
        protein: (ingredient.nutrition.protein || 0) * scaleFactor,
        carbs: (ingredient.nutrition.carbs || 0) * scaleFactor,
        fat: (ingredient.nutrition.fat || 0) * scaleFactor,
      };

      console.log('Scaled nutrition:', scaledNutrition);

      const newIngredient: MealIngredient = {
        id: Date.now().toString(),
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity,
        nutrition: scaledNutrition,
      };

      console.log('Adding ingredient to meal:', newIngredient);

      // Add the new ingredient
      const updatedIngredients = [...mealIngredients, newIngredient];
      setMealIngredients(updatedIngredients);
      
      // Clear the quantity field and close the modal
      setIngredientQuantity('');
      setShowCustomIngredients(false);
      
      // Show success message
      showSnackbar(`Added ${ingredient.name} to your meal`, 'success');
    } catch (error) {
      console.error('Error selecting ingredient:', error);
      showSnackbar('Failed to add ingredient to your meal');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSaveMeal = async () => {
    if (!name) {
      showSnackbar('Please enter a meal name');
      return;
    }

    if (mealIngredients.length === 0) {
      showSnackbar('Please add at least one ingredient');
      return;
    }

    try {
      await addMeal({
        name,
        date: date.toISOString().split('T')[0],
        ingredients: mealIngredients,
      });
      
      showSnackbar('Meal saved successfully', 'success');
      
      // Reset the form
      setName('');
      setDate(new Date());
      setMealIngredients([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      showSnackbar('Failed to save meal');
    }
  };

  const removeIngredient = (id: string) => {
    const updated = mealIngredients.filter(ingredient => ingredient.id !== id);
    setMealIngredients(updated);
  };

  const filteredIngredients = searchTerm
    ? ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.unit.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ingredients;

  // Functions for adding new ingredients to the database
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const processNutritionLabel = async () => {
    if (!imageUri) return;

    setLabelLoading(true);
    try {
      const extractedNutrition = await extractNutritionFromLabel(imageUri);
      setNutrition(extractedNutrition);
    } catch (error) {
      Alert.alert('Error', 'Failed to process nutrition label');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleFetchNutrition = async () => {
    if (!ingredientName || !ingredientUnit) {
      Alert.alert('Error', 'Please enter ingredient name and unit');
      return;
    }

    setLoading(true);
    try {
      const nutritionData = await fetchNutritionForIngredient(ingredientName, ingredientUnit, 100);
      setNutrition(nutritionData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nutrition information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIngredient = async () => {
    if (!ingredientName || !ingredientUnit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Clear debug info first
      console.log('---------- SAVING INGREDIENT ----------');
      console.log('Current ingredient count:', ingredients.length);
      console.log('Ingredient data to save:');
      console.log('Name:', ingredientName);
      console.log('Unit:', ingredientUnit);
      console.log('Nutrition:', nutrition);
      
      // Ensure nutrition values are not undefined
      const sanitizedNutrition = {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0
      };
      
      // The new ingredient object to be saved
      const newIngredientData = {
        name: ingredientName,
        unit: ingredientUnit,
        nutrition: sanitizedNutrition,
      };
      
      console.log('Sanitized data:', newIngredientData);
      
      // Call the context function to save the ingredient
      const success = await addCustomIngredient(newIngredientData);
      console.log('Ingredient save result:', success ? 'SUCCESS' : 'FAILED');
      
      if (success) {
        console.log('After saving, ingredients count:', ingredients.length + 1);
        
        Alert.alert('Success', 'Ingredient saved successfully', [
          { text: 'OK', onPress: () => {
            // Reset fields
            setIngredientName('');
            setIngredientUnit('');
            setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            setImageUri(null);
            setShowIngredientForm(false);
            
            // Verify saved ingredient
            console.log('Ingredients after saving:', 
              ingredients.map(i => `${i.name} (${i.id})`).join(', ')
            );
          }}
        ]);
      } else {
        Alert.alert('Error', 'Failed to save ingredient');
      }
    } catch (error) {
      console.error('Error saving ingredient:', error);
      Alert.alert('Error', 'Failed to save ingredient: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Render ingredient item
  const renderIngredientItem = ({ item }: { item: Ingredient }) => {
    console.log(`Rendering ingredient item: ${item.name}, ID: ${item.id}`);
    return (
      <TouchableOpacity 
        style={styles.selectableIngredient}
        onPress={() => {
          console.log(`Selected ingredient: ${item.name}`);
          onSelectIngredient(item);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientInfo}>
          <Text style={styles.ingredientName}>{item.name}</Text>
          <View style={styles.ingredientNutrition}>
            <Text style={styles.ingredientCalories}>
              {item.nutrition.calories} calories per {item.unit}
            </Text>
            <View style={styles.macroRow}>
              <Text style={styles.macroText}>P: {(item.nutrition.protein || 0).toFixed(1)}g</Text>
              <Text style={styles.macroText}>C: {(item.nutrition.carbs || 0).toFixed(1)}g</Text>
              <Text style={styles.macroText}>F: {(item.nutrition.fat || 0).toFixed(1)}g</Text>
            </View>
          </View>
        </View>
        <View style={styles.addButtonContainer}>
          <Ionicons name="add-circle" size={28} color="#34C759" />
        </View>
      </TouchableOpacity>
    );
  };

  // Load past meals when the component mounts
  useEffect(() => {
    const recentMeals = getPastMeals(10); // Get 10 most recent meals
    setPastMeals(recentMeals);
  }, [getPastMeals]);
  
  // Handle selecting a past meal to repeat
  const handleRepeatMeal = async (mealId: string) => {
    // Find the selected meal
    const selectedMeal = pastMeals.find(meal => meal.id === mealId);
    
    if (!selectedMeal) {
      showSnackbar('Could not find the selected meal');
      return;
    }
    
    // Pre-fill the form with the selected meal's data
    setName(`${selectedMeal.name} (copy)`);
    
    // Parse the date string to Date object
    try {
      const mealDate = new Date(selectedMeal.date);
      // If the date is valid, use it; otherwise, use today's date
      if (!isNaN(mealDate.getTime())) {
        setDate(mealDate);
      } else {
        setDate(new Date()); // Default to today
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      setDate(new Date()); // Default to today
    }
    
    // Pre-fill ingredients
    setMealIngredients(selectedMeal.ingredients.map(ing => ({
      ...ing,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate new unique IDs
    })));
    
    // Close the modal
    setShowPastMeals(false);
    
    // Show success message
    showSnackbar(`Loaded "${selectedMeal.name}" - make changes as needed and save`, 'info');
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Meal</Text>

        {/* Quick Actions */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Meal Name</Text>
            <Text style={styles.requiredBadge}>Required</Text>
          </View>
          <TextInput
            style={[styles.input, !name && styles.requiredInput]}
            placeholder="Enter meal name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text>{date.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          
          <TouchableOpacity
            style={styles.previousMealButton}
            onPress={() => setShowPastMeals(true)}
          >
            <Ionicons name="albums-outline" size={18} color="#fff" style={styles.previousMealIcon} />
            <Text style={styles.previousMealButtonText}>Browse Meal History</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Summary */}
        {mealIngredients.length > 0 && (
          <View style={styles.nutritionSummary}>
            <Text style={styles.sectionTitle}>Nutrition Summary</Text>
            <Text style={styles.sectionInstructions}>
              Total nutrition values for this meal:
            </Text>
            <View style={styles.summaryContainer}>
              <View style={styles.mainNutrient}>
                <Text style={styles.mainNutrientValue}>{mealNutrition.calories.toFixed(0)}</Text>
                <Text style={styles.mainNutrientLabel}>Calories</Text>
              </View>
              
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{mealNutrition.protein.toFixed(1)}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{mealNutrition.carbs.toFixed(1)}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{mealNutrition.fat.toFixed(1)}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Add Ingredients Section */}
        <View style={styles.ingredientForm}>
          <Text style={styles.sectionTitle}>Add Ingredients</Text>
          <Text style={styles.sectionInstructions}>
            Add ingredients to your meal from your saved list or create new ones
          </Text>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tabButton, 
                !showIngredientForm && styles.activeTabButton
              ]}
              onPress={() => setShowIngredientForm(false)}
            >
              <Text style={[
                styles.tabButtonText, 
                !showIngredientForm && styles.activeTabButtonText
              ]}>Saved Ingredients</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tabButton, 
                showIngredientForm && styles.activeTabButton
              ]}
              onPress={() => setShowIngredientForm(true)}
            >
              <Text style={[
                styles.tabButtonText, 
                showIngredientForm && styles.activeTabButtonText
              ]}>New Ingredient</Text>
            </TouchableOpacity>
          </View>
          
          {!showIngredientForm ? (
            // Saved Ingredients Tab
            <View style={styles.tabContent}>
              <View style={styles.quantityRow}>
                <View style={styles.quantityInputContainer}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.quantityInput}
                    placeholder="e.g. 100"
                    value={ingredientQuantity}
                    onChangeText={setIngredientQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.unitLabelContainer}>
                  <Text style={styles.unitLabel}>
                    {searchTerm && filteredIngredients.length > 0 ? 
                      filteredIngredients[0].unit : 'units'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => {
                  if (!ingredientQuantity) {
                    showSnackbar('Please enter a quantity first');
                    return;
                  }
                  
                  console.log('Opening saved ingredients selector');
                  console.log(`Available ingredients: ${ingredients.length}`);
                  
                  if (ingredients.length === 0) {
                    showSnackbar('No saved ingredients found. Please add ingredients first.', 'warning');
                    setTimeout(() => {
                      setShowIngredientForm(true);
                    }, 1500);
                    return;
                  }
                  
                  setSearchTerm('');
                  setShowCustomIngredients(true);
                }}
              >
                <Ionicons name="search" size={18} color="#fff" style={styles.searchIcon} />
                <Text style={styles.searchButtonText}>Find Ingredient</Text>
              </TouchableOpacity>
              
              {ingredients.length > 0 && (
                <View style={styles.quickIngredients}>
                  <Text style={styles.quickIngredientsTitle}>Recently Used</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ingredients.slice(0, 5).map(ing => (
                      <TouchableOpacity 
                        key={ing.id}
                        style={styles.quickIngredientItem}
                        onPress={() => {
                          if (!ingredientQuantity) {
                            showSnackbar('Please enter a quantity first');
                            return;
                          }
                          onSelectIngredient(ing);
                        }}
                      >
                        <Text style={styles.quickIngredientName}>{ing.name}</Text>
                        <Text style={styles.quickIngredientCal}>{ing.nutrition.calories} cal/{ing.unit}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            // New Ingredient Tab
            <View style={styles.tabContent}>
              <View style={styles.newIngredientRow}>
                <View style={styles.newIngredientCol}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Apple"
                    value={ingredientName}
                    onChangeText={setIngredientName}
                  />
                </View>
                <View style={styles.newIngredientCol}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TouchableOpacity 
                    style={styles.unitDropdown}
                    onPress={() => setShowUnitDropdown(true)}
                  >
                    <Text style={ingredientUnit ? styles.unitDropdownText : styles.unitDropdownPlaceholder}>
                      {ingredientUnit || 'e.g. grams'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.newIngredientRow}>
                <View style={styles.newIngredientCol}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 100"
                    value={ingredientQuantity}
                    onChangeText={setIngredientQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.newIngredientCol}>
                  <Text style={styles.inputLabel}>Options</Text>
                  <TouchableOpacity 
                    style={styles.nutritionButton}
                    onPress={handleFetchNutrition}
                  >
                    <Text style={styles.nutritionButtonText}>Fetch Nutrition</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.addOnlyButton,
                    (!ingredientName || !ingredientUnit || !ingredientQuantity) && styles.disabledButton
                  ]} 
                  onPress={handleAddNewIngredient}
                  disabled={!ingredientName || !ingredientUnit || !ingredientQuantity}
                >
                  <Text style={styles.actionButtonText}>Add to Meal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.saveButton,
                    (!ingredientName || !ingredientUnit) && styles.disabledButton
                  ]} 
                  onPress={handleSaveIngredient}
                  disabled={!ingredientName || !ingredientUnit}
                >
                  <Text style={styles.actionButtonText}>Save & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Added Ingredients List */}
        <View style={styles.ingredientsList}>
          <Text style={styles.sectionTitle}>Added Ingredients</Text>
          {mealIngredients.length === 0 ? (
            <View style={styles.emptyMealContainer}>
              <Text style={styles.emptyText}>No ingredients added yet</Text>
              <Text style={styles.emptySubtext}>
                Add ingredients using the form above
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionInstructions}>
                These ingredients will be included in your meal:
              </Text>
              {mealIngredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientListItem}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={() => removeIngredient(ingredient.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.ingredientDetails}>
                    <Text style={styles.ingredientAmount}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    
                    <View style={styles.nutritionDetails}>
                      <Text style={styles.calorieValue}>
                        {ingredient.nutrition.calories.toFixed(0)} cal
                      </Text>
                      <View style={styles.macroDetails}>
                        <Text style={styles.macroText}>
                          P: {(ingredient.nutrition.protein || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.macroText}>
                          C: {(ingredient.nutrition.carbs || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.macroText}>
                          F: {(ingredient.nutrition.fat || 0).toFixed(1)}g
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Save Meal Button */}
        <View style={styles.saveButtonContainer}>
          {(!name || mealIngredients.length === 0) && (
            <View style={styles.saveRequirementsContainer}>
              <Ionicons name="information-circle" size={20} color="#FF9500" style={styles.saveRequirementsIcon} />
              <View style={styles.saveRequirementsList}>
                <Text style={[styles.saveRequirementItem, name ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
                  {name ? '✓ Meal name provided' : '• Enter a meal name'}
                </Text>
                <Text style={[styles.saveRequirementItem, mealIngredients.length > 0 ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
                  {mealIngredients.length > 0 ? `✓ ${mealIngredients.length} ingredient(s) added` : '• Add at least one ingredient'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (!name || mealIngredients.length === 0) && styles.disabledButton
            ]} 
            onPress={handleSaveMeal}
            disabled={!name || mealIngredients.length === 0}
          >
            <View style={styles.saveButtonContent}>
              <Ionicons name="save-outline" size={20} color="white" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal for selecting custom ingredients */}
        <Modal
          visible={showCustomIngredients}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCustomIngredients(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Ingredient</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    console.log('Closing ingredient selector modal');
                    setShowCustomIngredients(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
              />

              {ingredients.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No saved ingredients found</Text>
                  <Text style={styles.emptySubtext}>Add ingredients using the "Add + Save Ingredient" button</Text>
                  <TouchableOpacity 
                    style={styles.addIngredientButton}
                    onPress={() => {
                      setShowCustomIngredients(false);
                      setTimeout(() => setShowIngredientForm(true), 300);
                    }}
                  >
                    <Text style={styles.addIngredientButtonText}>Add New Ingredient</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.ingredientCount}>
                    {filteredIngredients.length} ingredient{filteredIngredients.length !== 1 ? 's' : ''} available
                  </Text>
                  <FlatList
                    data={filteredIngredients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderIngredientItem}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No matching ingredients found</Text>
                    }
                  />
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal for adding new saved ingredients */}
        <Modal
          visible={showIngredientForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowIngredientForm(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Ingredient</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    console.log('Closing add ingredient form');
                    setShowIngredientForm(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Ingredient Name"
                  value={ingredientName}
                  onChangeText={setIngredientName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Unit (e.g., grams, cups)"
                  value={ingredientUnit}
                  onChangeText={setIngredientUnit}
                />

                <View style={styles.labelSection}>
                  <Text style={styles.sectionTitle}>Nutrition Label</Text>
                  <Text style={styles.sectionDescription}>
                    Upload a nutrition label image to automatically extract information
                  </Text>

                  <View style={styles.imageContainer}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                      <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                        <Text style={styles.imagePlaceholderText}>Tap to Upload Nutrition Label</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {imageUri && (
                    <TouchableOpacity
                      style={[styles.button, styles.labelButton]}
                      onPress={processNutritionLabel}
                      disabled={labelLoading}
                    >
                      {labelLoading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Extract from Label</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.fetchButton]}
                  onPress={handleFetchNutrition}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.nutritionContainer}>
                  <Text style={styles.nutritionTitle}>Nutrition Information</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <TextInput
                        style={styles.nutritionInput}
                        value={nutrition.calories.toString()}
                        onChangeText={(value) =>
                          setNutrition({ ...nutrition, calories: Number(value) || 0 })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Protein (g)</Text>
                      <TextInput
                        style={styles.nutritionInput}
                        value={nutrition.protein?.toString()}
                        onChangeText={(value) =>
                          setNutrition({ ...nutrition, protein: Number(value) || 0 })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                      <TextInput
                        style={styles.nutritionInput}
                        value={nutrition.carbs?.toString()}
                        onChangeText={(value) =>
                          setNutrition({ ...nutrition, carbs: Number(value) || 0 })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Fat (g)</Text>
                      <TextInput
                        style={styles.nutritionInput}
                        value={nutrition.fat?.toString()}
                        onChangeText={(value) =>
                          setNutrition({ ...nutrition, fat: Number(value) || 0 })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveIngredient}
                >
                  <Text style={styles.buttonText}>Save Ingredient</Text>
                </TouchableOpacity>
                
                {/* Debug section */}
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Developer Tools</Text>
                  <View style={styles.debugButtonsRow}>
                    <TouchableOpacity
                      style={styles.debugButton}
                      onPress={async () => {
                        const confirmed = await new Promise(resolve => {
                          Alert.alert(
                            "Reset Ingredients Storage",
                            "This will delete ALL saved ingredients. Continue?",
                            [
                              { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                              { text: "Reset", onPress: () => resolve(true), style: "destructive" }
                            ]
                          );
                        });
                        
                        if (confirmed) {
                          const result = await resetIngredientsStorage();
                          Alert.alert(
                            result ? "Success" : "Error", 
                            result ? "Ingredients storage has been reset" : "Failed to reset storage"
                          );
                          if (result) {
                            setShowIngredientForm(false);
                          }
                        }
                      }}
                    >
                      <Text style={styles.debugButtonText}>Reset Ingredients</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.debugButton}
                      onPress={() => {
                        console.log("Current ingredients:", ingredients.length);
                        ingredients.forEach((ing, i) => {
                          console.log(`Ingredient ${i}: ${ing.name}, ID: ${ing.id}`);
                        });
                        Alert.alert(
                          "Ingredients Status", 
                          `${ingredients.length} ingredients found. Check console for details.`
                        );
                      }}
                    >
                      <Text style={styles.debugButtonText}>Check Ingredients</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Goal modal styles */}
        <Modal
          visible={showPastMeals}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPastMeals(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Repeat a Past Meal</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowPastMeals(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {pastMeals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No past meals found</Text>
                  <Text style={styles.emptySubtext}>Create some meals first</Text>
                </View>
              ) : (
                <FlatList
                  data={pastMeals}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.pastMealItem}
                      onPress={() => handleRepeatMeal(item.id)}
                    >
                      <View style={styles.pastMealInfo}>
                        <Text style={styles.pastMealName}>{item.name}</Text>
                        <Text style={styles.pastMealDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <Text style={styles.pastMealCalories}>{item.totalCalories} calories</Text>
                      </View>
                      <Ionicons name="copy-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Unit Selection Modal */}
        <Modal
          visible={showUnitDropdown}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowUnitDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.unitModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Unit</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowUnitDropdown(false)}
                >
                  <Ionicons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={unitOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.unitOption}
                    onPress={() => {
                      setIngredientUnit(item);
                      setShowUnitDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.unitOptionText,
                      item === ingredientUnit && styles.selectedUnitOptionText
                    ]}>{item}</Text>
                    {item === ingredientUnit && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  <View style={styles.customUnitSection}>
                    <Text style={styles.customUnitTitle}>Custom Unit</Text>
                    <View style={styles.customUnitInputRow}>
                      <TextInput
                        style={styles.customUnitInput}
                        placeholder="Enter custom unit"
                        value={ingredientUnit.match(new RegExp(unitOptions.join('|'))) ? '' : ingredientUnit}
                        onChangeText={setIngredientUnit}
                      />
                      <TouchableOpacity 
                        style={styles.customUnitButton}
                        onPress={() => setShowUnitDropdown(false)}
                      >
                        <Text style={styles.customUnitButtonText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
      
      {/* Snackbar for showing errors and success messages */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={hideSnackbar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  formSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionSummary: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  mainNutrient: {
    alignItems: 'center',
    marginBottom: 15,
  },
  mainNutrientValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  mainNutrientLabel: {
    fontSize: 14,
    color: '#666',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 5,
  },
  orText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveIngredientButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  ingredientForm: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientsList: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  ingredientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#666',
  },
  nutritionDetails: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
  },
  macroDetails: {
    flexDirection: 'row',
    marginTop: 2,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  removeButton: {
    padding: 5,
  },
  saveButtonContainer: {
    marginVertical: 20,
    paddingHorizontal: 5,
  },
  saveRequirementsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  saveRequirementsIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  saveRequirementsList: {
    flex: 1,
  },
  saveRequirementItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  saveRequirementComplete: {
    color: '#34C759',
    fontWeight: '500',
  },
  saveRequirementIncomplete: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMealContainer: {
    padding: 20,
    alignItems: 'center',
  },
  selectableIngredient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 10,
  },
  ingredientInfo: {
    flex: 1,
    marginRight: 10,
  },
  ingredientNutrition: {
    marginTop: 5,
  },
  ingredientCalories: {
    fontSize: 14,
    color: '#FF9500',
  },
  ingredientUnit: {
    fontSize: 14,
    color: '#666',
  },
  addButtonContainer: {
    padding: 5,
  },
  ingredientCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 10,
  },
  addIngredientButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  addIngredientButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Styles for the ingredient form
  labelSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    color: '#666',
    textAlign: 'center',
    padding: 10,
  },
  labelButton: {
    backgroundColor: '#FF9500',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  fetchButton: {
    backgroundColor: '#5856D6',
  },
  nutritionContainer: {
    marginTop: 20,
    marginBottom: 15,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 15,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
  },
  debugContainer: {
    marginTop: 30,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    flex: 1,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  previousMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  previousMealIcon: {
    marginRight: 8,
  },
  previousMealButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  pastMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  pastMealInfo: {
    flex: 1,
  },
  pastMealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pastMealDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pastMealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
    marginTop: 4,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: 'white',
  },
  tabContent: {
    marginBottom: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  quantityInputContainer: {
    flex: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  unitLabelContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 10,
  },
  unitLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    padding: 15,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickIngredients: {
    marginTop: 10,
  },
  quickIngredientsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quickIngredientItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 5,
    minWidth: 100,
  },
  quickIngredientName: {
    fontWeight: '500',
    fontSize: 14,
  },
  quickIngredientCal: {
    fontSize: 12,
    color: '#FF9500',
  },
  newIngredientRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  newIngredientCol: {
    flex: 1,
    marginRight: 10,
  },
  nutritionButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nutritionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  addOnlyButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  unitDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
    height: 50,
  },
  unitDropdownText: {
    color: '#333',
  },
  unitDropdownPlaceholder: {
    color: '#999',
  },
  unitModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  unitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unitOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedUnitOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  customUnitSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  customUnitTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  customUnitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customUnitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  customUnitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  customUnitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  requiredLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredDot: {
    color: '#FF3B30',
    marginLeft: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredInput: {
    borderColor: 'rgba(255, 59, 48, 0.5)',
    backgroundColor: 'rgba(255, 59, 48, 0.03)',
  },
});

export default CreateMeal; 