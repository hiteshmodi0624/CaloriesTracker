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
import { MealIngredient, Ingredient, NutritionInfo, Meal, Dish } from '../../types';
import { fetchNutritionForIngredient, extractNutritionFromLabel, fetchNutritionForDish } from '../services/openai';
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
    duplicateMeal,
    savedDishes,
    saveDish,
    getSavedDishes,
    deleteSavedDish
  } = useContext(AppContext);
  
  // Meal state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  
  // Add dishes state
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDishName, setCurrentDishName] = useState('');
  const [currentDishIngredients, setCurrentDishIngredients] = useState<MealIngredient[]>([]);
  const [isCreatingDish, setIsCreatingDish] = useState(false);
  const [showDishCreateModal, setShowDishCreateModal] = useState(false);
  const [activeTabInDishModal, setActiveTabInDishModal] = useState<'ingredients' | 'quickDish'>('ingredients');
  
  // Quick dish entry state
  const [quickDishName, setQuickDishName] = useState('');
  const [quickDishServings, setQuickDishServings] = useState('1');
  const [isAddingQuickDish, setIsAddingQuickDish] = useState(false);
  
  // Ingredient selection state
  const [showCustomIngredients, setShowCustomIngredients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  
  // Add this state to track if we should return to dish modal after ingredient selection
  const [returnToDishModal, setReturnToDishModal] = useState(false);
  
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
  
  // Add a state to track which main input method is active
  const [activeInputMethod, setActiveInputMethod] = useState<'ingredients' | 'quickDish'>('ingredients');
  
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
  
  // Calculate total nutrition for the meal including all dishes
  const mealNutrition = useMemo(() => {
    const ingredientsNutrition = mealIngredients.reduce((sum, ing) => {
      return {
        calories: sum.calories + ing.nutrition.calories,
        protein: sum.protein + (ing.nutrition.protein || 0),
        carbs: sum.carbs + (ing.nutrition.carbs || 0),
        fat: sum.fat + (ing.nutrition.fat || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    const dishesNutrition = dishes.reduce((sum, dish) => {
      return {
        calories: sum.calories + dish.totalCalories,
        protein: sum.protein + dish.ingredients.reduce((p, i) => p + (i.nutrition.protein || 0), 0),
        carbs: sum.carbs + dish.ingredients.reduce((c, i) => c + (i.nutrition.carbs || 0), 0),
        fat: sum.fat + dish.ingredients.reduce((f, i) => f + (i.nutrition.fat || 0), 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    return {
      calories: ingredientsNutrition.calories + dishesNutrition.calories,
      protein: ingredientsNutrition.protein + dishesNutrition.protein,
      carbs: ingredientsNutrition.carbs + dishesNutrition.carbs,
      fat: ingredientsNutrition.fat + dishesNutrition.fat,
    };
  }, [mealIngredients, dishes]);
  
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

  // Add this helper function to determine appropriate base quantity
  const getBaseQuantityForUnit = (unit: string): number => {
    // Weight-based units use 100 as standard
    if (['grams', 'g', 'oz', 'ml'].includes(unit.toLowerCase())) {
      return 100;
    }
    // Volume and count-based units use 1 as standard
    return 1;
  };

  // Update handleFetchNutrition function
  const handleFetchNutrition = async () => {
    if (!ingredientName || !ingredientUnit) {
      Alert.alert('Error', 'Please enter ingredient name and unit');
      return;
    }

    setLoading(true);
    try {
      const baseQuantity = getBaseQuantityForUnit(ingredientUnit);
      const nutritionData = await fetchNutritionForIngredient(ingredientName, ingredientUnit, baseQuantity);
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

  // Add these state variables for the quantity prompt
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedIngredientForQuantity, setSelectedIngredientForQuantity] = useState<Ingredient | null>(null);
  const [tempQuantity, setTempQuantity] = useState('');

  // Update the onSelectIngredient function to show quantity prompt after selection
  const onSelectIngredient = (ingredient: Ingredient) => {
    try {
      console.log('Selecting ingredient:', JSON.stringify(ingredient));
      
      // Save the selected ingredient and show quantity prompt
      setSelectedIngredientForQuantity(ingredient);
      setTempQuantity('');
      setShowQuantityModal(true);
      
      // Close ingredient selection modal
      setShowCustomIngredients(false);
    } catch (error) {
      console.error('Error selecting ingredient:', error);
      showSnackbar('Failed to select ingredient');
    }
  };

  // Add a function to handle adding ingredient with quantity
  const addIngredientWithQuantity = () => {
    try {
      if (!selectedIngredientForQuantity) {
        showSnackbar('No ingredient selected');
        return;
      }
      
      if (!tempQuantity) {
        showSnackbar('Please enter a quantity');
        return;
      }

      const quantity = parseFloat(tempQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        showSnackbar('Please enter a valid quantity');
        return;
      }
      
      const ingredient = selectedIngredientForQuantity;

      // Scale nutrition based on quantity and unit type
      const baseQuantity = getBaseQuantityForUnit(ingredient.unit);
      const scaleFactor = quantity / baseQuantity; 
      console.log(`Scaling factor: ${scaleFactor} (${quantity}/${baseQuantity})`);
      
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

      // Check if we need to return to dish modal
      if (returnToDishModal) {
        // Add to current dish ingredients
        setCurrentDishIngredients(prevIngredients => [...prevIngredients, newIngredient]);
        showSnackbar(`Added ${quantity} ${ingredient.unit} of ${ingredient.name} to dish`, 'success');
      } else if (showDishCreateModal) {
        // Just in case, handle this scenario too
        setCurrentDishIngredients([...currentDishIngredients, newIngredient]);
        showSnackbar(`Added ${quantity} ${ingredient.unit} of ${ingredient.name} to dish`, 'success');
      } else if (isCreatingDish) {
        // Support the previous method too
        addIngredientToCurrentDish(newIngredient);
        showSnackbar(`Added ${quantity} ${ingredient.unit} of ${ingredient.name} to dish`, 'success');
      } else {
        // Add the new ingredient to the meal
        const updatedIngredients = [...mealIngredients, newIngredient];
        setMealIngredients(updatedIngredients);
        showSnackbar(`Added ${quantity} ${ingredient.unit} of ${ingredient.name} to meal`, 'success');
      }
      
      // Close modal and reset
      setShowQuantityModal(false);
      setSelectedIngredientForQuantity(null);
      setTempQuantity('');
      
      // No transition or timeout needed
      setReturnToDishModal(false);
    } catch (error) {
      console.error('Error adding ingredient with quantity:', error);
      showSnackbar('Failed to add ingredient');
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

    if (mealIngredients.length === 0 && dishes.length === 0) {
      showSnackbar('Please add at least one ingredient or dish');
      return;
    }

    try {
      await addMeal({
        name,
        date: date.toISOString().split('T')[0],
        ingredients: mealIngredients,
        dishes: dishes,
      });
      
      showSnackbar('Meal saved successfully', 'success');
      
      // Reset the form
      setName('');
      setDate(new Date());
      setMealIngredients([]);
      setDishes([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      showSnackbar('Failed to save meal');
    }
  };

  const removeIngredient = (id: string) => {
    // If we're currently creating a dish, add the ingredient to the dish
    if (isCreatingDish) {
      addIngredientToCurrentDish({
        ...mealIngredients.find(i => i.id === id)!,
        id: Date.now().toString() // Generate new ID to avoid conflicts
      });
    }
    
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

  // Render ingredient item
  const renderIngredientItem = ({ item }: { item: Ingredient }) => {
    console.log(`Rendering ingredient item: ${item.name}, ID: ${item.id}`);
    const baseQuantity = getBaseQuantityForUnit(item.unit);
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
              {item.nutrition.calories} calories per {baseQuantity} {item.unit}
            </Text>
            <View style={styles.macroRow}>
              <Text style={styles.macroText}>P: {(item.nutrition.protein || 0).toFixed(1)}g</Text>
              <Text style={styles.macroText}>C: {(item.nutrition.carbs || 0).toFixed(1)}g</Text>
              <Text style={styles.macroText}>F: {(item.nutrition.fat || 0).toFixed(1)}g</Text>
            </View>
          </View>
        </View>
        <View style={styles.addButtonContainer}>
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeText}>{item.unit}</Text>
          </View>
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

  // Add a new function to handle quick dish addition
  const handleAddQuickDish = async () => {
    if (!quickDishName) {
      showSnackbar('Please enter a dish name');
      return;
    }
    
    const servings = parseFloat(quickDishServings);
    if (isNaN(servings) || servings <= 0) {
      showSnackbar('Please enter a valid number of servings');
      return;
    }
    
    setIsAddingQuickDish(true);
    
    try {
      // Fetch nutrition data for the complete dish
      const dishNutrition = await fetchNutritionForDish(quickDishName, servings);
      
      // Log nutrition data for debugging
      console.log('Quick dish nutrition from API:', JSON.stringify(dishNutrition));
      
      // Check if we got default fallback values, which might indicate an API failure
      const isDefaultNutrition = dishNutrition.calories === 350 && 
        dishNutrition.protein === 15 && 
        dishNutrition.carbs === 30 && 
        dishNutrition.fat === 15;
      
      if (isDefaultNutrition) {
        // Check for update recommendations if we got default values
        checkForUpdates();
      }
      
      // Validate that calories are present and not zero
      if (!dishNutrition || typeof dishNutrition.calories !== 'number' || dishNutrition.calories <= 0) {
        console.warn('Invalid calories in dish nutrition. Using default value.', dishNutrition);
        // Apply default calorie value if none provided
        dishNutrition.calories = 250 * servings;
        dishNutrition.protein = dishNutrition.protein || 10 * servings;
        dishNutrition.carbs = dishNutrition.carbs || 30 * servings;
        dishNutrition.fat = dishNutrition.fat || 10 * servings;
      }
      
      // Generate constituent ingredients for the dish
      const estimatedIngredients = await generateEstimatedIngredients(quickDishName, dishNutrition);
      
      // Verify total calories in the generated ingredients
      const ingredientsCalories = estimatedIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
      console.log(`Total calories in ${estimatedIngredients.length} ingredients: ${ingredientsCalories}. Original: ${dishNutrition.calories}`);
      
      // Create a proper dish with the estimated ingredients
      const newDish: Dish = {
        id: Date.now().toString(),
        name: quickDishName,
        ingredients: estimatedIngredients,
        totalCalories: ingredientsCalories // Use calculated total from ingredients
      };
      
      // Add the dish to the dishes array
      setDishes([...dishes, newDish]);
      
      // Clear the fields
      setQuickDishName('');
      setQuickDishServings('1');
      
      // Show success message
      showSnackbar(`Added "${quickDishName}" to your meal (${ingredientsCalories.toFixed(0)} calories)`, 'success');
    } catch (error) {
      console.error('Error creating quick dish:', error);
      showSnackbar('Failed to create dish with estimated ingredients');
      // Check for update recommendations on error
      checkForUpdates();
    } finally {
      setIsAddingQuickDish(false);
    }
  };

  // Add a helper function to estimate ingredients for a dish
  const generateEstimatedIngredients = async (dishName: string, totalNutrition: NutritionInfo): Promise<MealIngredient[]> => {
    try {
      // Validate input nutrition values
      if (!totalNutrition || typeof totalNutrition.calories !== 'number' || totalNutrition.calories <= 0) {
        console.warn('Invalid input nutrition for estimated ingredients, using defaults', totalNutrition);
        totalNutrition = {
          calories: 250, 
          protein: 10,
          carbs: 30,
          fat: 10
        };
      }
      
      console.log('Generating estimated ingredients for:', dishName, 'with calories:', totalNutrition.calories);
    
      // For now, we'll create 2-4 estimated ingredients for the dish
      // In a real implementation, this would call an AI service to get more accurate ingredient estimates
      
      const ingredientCount = Math.floor(Math.random() * 3) + 2; // 2-4 ingredients
      const estimatedIngredients: MealIngredient[] = [];
      
      // Calculate distribution of calories and macros
      const caloriesPerIngredient = totalNutrition.calories / ingredientCount;
      const proteinPerIngredient = (totalNutrition.protein || 0) / ingredientCount;
      const carbsPerIngredient = (totalNutrition.carbs || 0) / ingredientCount;
      const fatPerIngredient = (totalNutrition.fat || 0) / ingredientCount;
      
      // Example ingredients based on the dish name
      const possibleIngredients = [
        { name: `${dishName} main component`, unit: 'g', basePortion: 100 },
        { name: 'Mixed vegetables', unit: 'g', basePortion: 50 },
        { name: 'Sauce', unit: 'ml', basePortion: 30 },
        { name: 'Protein source', unit: 'g', basePortion: 80 },
        { name: 'Carb source', unit: 'g', basePortion: 60 },
        { name: 'Garnish', unit: 'g', basePortion: 10 },
      ];
      
      // Shuffle and pick ingredients
      const shuffled = [...possibleIngredients].sort(() => 0.5 - Math.random());
      const selectedIngredients = shuffled.slice(0, ingredientCount);
      
      // Create ingredient objects with distributed nutrition
      selectedIngredients.forEach((ingredient, index) => {
        // Adjust nutrition slightly for each ingredient to seem more realistic
        const calorieAdjustment = 0.8 + Math.random() * 0.4; // 0.8-1.2 multiplier
        const calories = caloriesPerIngredient * calorieAdjustment;
        
        // Ensure calories are never zero or negative
        const safeCalories = Math.max(1, calories);
        
        // Adjust macros proportionally
        const macroAdjustment = safeCalories / caloriesPerIngredient;
        
        const newIngredient: MealIngredient = {
          id: Date.now().toString() + index,
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: ingredient.basePortion,
          nutrition: {
            calories: safeCalories,
            protein: Math.max(0, proteinPerIngredient * macroAdjustment),
            carbs: Math.max(0, carbsPerIngredient * macroAdjustment),
            fat: Math.max(0, fatPerIngredient * macroAdjustment)
          }
        };
        
        console.log(`Ingredient ${index+1}: ${newIngredient.name} - ${safeCalories.toFixed(1)} calories`);
        estimatedIngredients.push(newIngredient);
      });
      
      // Verify total calories
      const totalCals = estimatedIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
      console.log(`Total calories in generated ingredients: ${totalCals.toFixed(1)}`);
      
      return estimatedIngredients;
      
    } catch (error) {
      console.error('Error generating estimated ingredients:', error);
      
      // Fallback to a single generic ingredient with default calories
      console.log('Using fallback single ingredient with default calories');
      return [{
        id: Date.now().toString(),
        name: `${dishName} (estimated)`,
        unit: 'serving',
        quantity: 1,
        nutrition: {
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 5
        }
      }];
    }
  };

  // Modify quick dish to the dish creation
  const handleAddQuickDishToDish = async () => {
    if (!quickDishName) {
      showSnackbar('Please enter a dish name');
      return;
    }
    
    if (!currentDishName) {
      // Use the quick dish name as the dish name if none provided
      setCurrentDishName(quickDishName);
    }
    
    const servings = parseFloat(quickDishServings);
    if (isNaN(servings) || servings <= 0) {
      showSnackbar('Please enter a valid number of servings');
      return;
    }
    
    setIsAddingQuickDish(true);
    
    try {
      // Fetch nutrition data for the complete dish
      const dishNutrition = await fetchNutritionForDish(quickDishName, servings);
      
      // Log nutrition data for debugging
      console.log('Quick dish nutrition for dish creation:', JSON.stringify(dishNutrition));
      
      // Validate that calories are present and not zero
      if (!dishNutrition || typeof dishNutrition.calories !== 'number' || dishNutrition.calories <= 0) {
        console.warn('Invalid calories in dish nutrition. Using default value.', dishNutrition);
        // Apply default calorie value if none provided
        dishNutrition.calories = 250 * servings;
        dishNutrition.protein = dishNutrition.protein || 10 * servings;
        dishNutrition.carbs = dishNutrition.carbs || 30 * servings;
        dishNutrition.fat = dishNutrition.fat || 10 * servings;
      }
      
      // Generate constituent ingredients for the dish
      const estimatedIngredients = await generateEstimatedIngredients(quickDishName, dishNutrition);
      
      // Verify the total calories in the generated ingredients
      const ingredientsCalories = estimatedIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
      console.log(`Adding to dish: ${estimatedIngredients.length} ingredients with ${ingredientsCalories.toFixed(0)} total calories`);
      
      // Add all the estimated ingredients to the current dish
      setCurrentDishIngredients([...currentDishIngredients, ...estimatedIngredients]);
      
      // Clear the fields
      setQuickDishName('');
      setQuickDishServings('1');
      
      // Show success message
      showSnackbar(`Added "${quickDishName}" ingredients to your dish (${ingredientsCalories.toFixed(0)} calories)`, 'success');
    } catch (error) {
      console.error('Error adding quick dish to dish:', error);
      showSnackbar('Failed to add estimated ingredients to dish');
    } finally {
      setIsAddingQuickDish(false);
    }
  };

  // Add functions for dish management
  const addIngredientToCurrentDish = (ingredient: MealIngredient) => {
    setCurrentDishIngredients([...currentDishIngredients, ingredient]);
  };
  
  const removeIngredientFromCurrentDish = (id: string) => {
    setCurrentDishIngredients(currentDishIngredients.filter(i => i.id !== id));
  };
  
  // Add this function for creating dishes from multiple ingredients
  const openCreateDishModal = (initialIngredients: MealIngredient[] = []) => {
    setCurrentDishIngredients(initialIngredients);
    setCurrentDishName('');
    setActiveTabInDishModal('ingredients');
    setShowDishCreateModal(true);
  };

  // Add this function to handle ingredient selection from the dish modal
  const findIngredientFromDishModal = () => {
    // Simply open the ingredient selection modal directly
    setShowCustomIngredients(true);
    setReturnToDishModal(true);
  };
  
  // Modify saveDishToMeal to add an option to save for future use
  const saveDishToMeal = () => {
    if (!currentDishName) {
      showSnackbar('Please provide a name for the dish');
      return;
    }
    
    if (currentDishIngredients.length === 0) {
      showSnackbar('Please add at least one ingredient to the dish');
      return;
    }
    
    const totalCalories = currentDishIngredients.reduce(
      (sum, ing) => sum + ing.nutrition.calories, 0
    );
    
    const newDish: Dish = {
      id: Date.now().toString(),
      name: currentDishName,
      ingredients: currentDishIngredients,
      totalCalories
    };
    
    setDishes([...dishes, newDish]);
    
    // Ask user if they want to save dish for future use
    Alert.alert(
      'Save Dish',
      `Would you like to save "${currentDishName}" for future use?`,
      [
        { text: 'No', style: 'cancel', onPress: () => {
          showSnackbar(`Dish "${currentDishName}" added to meal`, 'success');
          
          // Reset current dish
          setCurrentDishName('');
          setCurrentDishIngredients([]);
          setShowDishCreateModal(false);
        }},
        { text: 'Yes', onPress: () => {
          // Save the dish for future use
          saveDish({
            name: currentDishName,
            ingredients: currentDishIngredients,
            totalCalories
          }).then(success => {
            if (success) {
              showSnackbar(`Dish "${currentDishName}" saved for future use`, 'success');
            } else {
              showSnackbar(`Dish added to meal but couldn't be saved for future use`, 'warning');
            }
            
            // Reset current dish
            setCurrentDishName('');
            setCurrentDishIngredients([]);
            setShowDishCreateModal(false);
          });
        }}
      ]
    );
  };
  
  const removeDishFromMeal = (dishId: string) => {
    setDishes(dishes.filter(dish => dish.id !== dishId));
  };
  
  const editDish = (dish: Dish) => {
    setCurrentDishName(dish.name);
    setCurrentDishIngredients([...dish.ingredients]);
    setIsCreatingDish(true);
    removeDishFromMeal(dish.id);
  };

  // Add a new function to edit ingredient quantity
  const editIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      showSnackbar('Please enter a valid quantity');
      return false;
    }
    
    // Update the meal ingredients if found there
    const updatedIngredients = mealIngredients.map(ing => {
      if (ing.id === ingredientId) {
        // Calculate scale factor
        const scaleFactor = newQuantity / ing.quantity;
        
        // Scale nutrition values
        const updatedNutrition = {
          calories: ing.nutrition.calories * scaleFactor,
          protein: (ing.nutrition.protein || 0) * scaleFactor,
          carbs: (ing.nutrition.carbs || 0) * scaleFactor,
          fat: (ing.nutrition.fat || 0) * scaleFactor,
        };
        
        return {
          ...ing,
          quantity: newQuantity,
          nutrition: updatedNutrition,
        };
      }
      return ing;
    });
    
    // Check if we found and updated the ingredient
    if (JSON.stringify(updatedIngredients) !== JSON.stringify(mealIngredients)) {
      setMealIngredients(updatedIngredients);
      return true;
    }
    
    return false;
  };
  
  // Add a function to edit dish ingredient quantity
  const editDishIngredientQuantity = (dishId: string, ingredientId: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      showSnackbar('Please enter a valid quantity');
      return;
    }
    
    // Find the dish
    const updatedDishes = dishes.map(dish => {
      if (dish.id === dishId) {
        // Update the ingredient in this dish
        const updatedIngredients = dish.ingredients.map(ing => {
          if (ing.id === ingredientId) {
            // Calculate scale factor
            const scaleFactor = newQuantity / ing.quantity;
            
            // Scale nutrition values
            const updatedNutrition = {
              calories: ing.nutrition.calories * scaleFactor,
              protein: (ing.nutrition.protein || 0) * scaleFactor,
              carbs: (ing.nutrition.carbs || 0) * scaleFactor,
              fat: (ing.nutrition.fat || 0) * scaleFactor,
            };
            
            return {
              ...ing,
              quantity: newQuantity,
              nutrition: updatedNutrition,
            };
          }
          return ing;
        });
        
        // Calculate new total calories
        const newTotalCalories = updatedIngredients.reduce(
          (sum, ing) => sum + ing.nutrition.calories, 0
        );
        
        return {
          ...dish,
          ingredients: updatedIngredients,
          totalCalories: newTotalCalories
        };
      }
      return dish;
    });
    
    setDishes(updatedDishes);
    showSnackbar('Ingredient quantity updated', 'success');
  };
  
  // Add a function to edit current dish ingredient quantity
  const editCurrentDishIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      showSnackbar('Please enter a valid quantity');
      return;
    }
    
    // Update the ingredient in the current dish
    const updatedIngredients = currentDishIngredients.map(ing => {
      if (ing.id === ingredientId) {
        // Calculate scale factor
        const scaleFactor = newQuantity / ing.quantity;
        
        // Scale nutrition values
        const updatedNutrition = {
          calories: ing.nutrition.calories * scaleFactor,
          protein: (ing.nutrition.protein || 0) * scaleFactor,
          carbs: (ing.nutrition.carbs || 0) * scaleFactor,
          fat: (ing.nutrition.fat || 0) * scaleFactor,
        };
        
        return {
          ...ing,
          quantity: newQuantity,
          nutrition: updatedNutrition,
        };
      }
      return ing;
    });
    
    setCurrentDishIngredients(updatedIngredients);
    showSnackbar('Ingredient quantity updated', 'success');
  };

  // Add state for saved dish modal
  const [showSavedDishesModal, setShowSavedDishesModal] = useState(false);

  // Add a function to save current dish for reuse
  const handleSaveDishForReuse = () => {
    if (!currentDishName) {
      showSnackbar('Please provide a name for the dish');
      return;
    }
    
    if (currentDishIngredients.length === 0) {
      showSnackbar('Please add at least one ingredient to the dish');
      return;
    }
    
    const totalCalories = currentDishIngredients.reduce(
      (sum, ing) => sum + ing.nutrition.calories, 0
    );
    
    // Save the dish to context storage
    saveDish({
      name: currentDishName,
      ingredients: currentDishIngredients,
      totalCalories
    }).then(success => {
      if (success) {
        showSnackbar(`Dish "${currentDishName}" saved for future use`, 'success');
      } else {
        showSnackbar('Failed to save dish', 'error');
      }
    });
  };
  
  // Add a function to add saved dish to meal
  const addSavedDishToMeal = (dish: Dish) => {
    // Create a copy with new IDs to avoid conflicts
    const dishCopy: Dish = {
      id: Date.now().toString(),
      name: dish.name,
      ingredients: dish.ingredients.map(ing => ({
        ...ing,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })),
      totalCalories: dish.totalCalories
    };
    
    setDishes([...dishes, dishCopy]);
    showSnackbar(`Added "${dish.name}" to meal`, 'success');
    setShowSavedDishesModal(false);
  };
  
  // Function to delete a saved dish
  const handleDeleteSavedDish = (dishId: string, dishName: string) => {
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to delete "${dishName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteSavedDish(dishId).then(success => {
              if (success) {
                showSnackbar(`Deleted "${dishName}"`, 'success');
              } else {
                showSnackbar('Failed to delete dish', 'error');
              }
            });
          }
        }
      ]
    );
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
        {(dishes.length > 0) && (
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

        {/* Dish Management Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dishes</Text>
            
            <View style={styles.dishHeaderButtons}>
              <TouchableOpacity 
                style={styles.browseSavedDishesButton}
                onPress={() => setShowSavedDishesModal(true)}
              >
                <Ionicons name="book-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.browseDishesButtonText}>Saved Dishes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addDishButton}
                onPress={() => openCreateDishModal()}
              >
                <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addDishButtonText}>Add Dish</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {dishes.length > 0 ? (
            <View style={styles.dishesList}>
              {dishes.map(dish => (
                <View key={dish.id} style={styles.dishItem}>
                  <View style={styles.dishItemHeader}>
                    <Text style={styles.dishItemName}>{dish.name}</Text>
                    <View style={styles.dishItemActions}>
                      <TouchableOpacity 
                        style={styles.dishItemAction}
                        onPress={() => editDish(dish)}
                      >
                        <Ionicons name="create-outline" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.dishItemAction}
                        onPress={() => removeDishFromMeal(dish.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.dishItemCalories}>
                    {dish.totalCalories.toFixed(0)} calories • {dish.ingredients.length} ingredients
                  </Text>
                  
                  <View style={styles.dishItemIngredients}>
                    {dish.ingredients.map((ingredient, index) => (
                      <TouchableOpacity 
                        key={ingredient.id}
                        style={styles.dishItemIngredientWrapper}
                        onPress={() => {
                          // Create a simple prompt to edit quantity
                          const newQuantity = prompt(
                            `Enter new quantity for ${ingredient.name}`,
                            ingredient.quantity.toString()
                          );
                          
                          if (newQuantity) {
                            const parsedQuantity = parseFloat(newQuantity);
                            editDishIngredientQuantity(dish.id, ingredient.id, parsedQuantity);
                          }
                        }}
                      >
                        <Text style={styles.dishItemIngredientText}>
                          {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                          {index < dish.ingredients.length - 1 ? ', ' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDishesContainer}>
              <Text style={styles.emptyDishesText}>
                No dishes added yet
              </Text>
              <Text style={styles.emptyDishesSubtext}>
                Add dishes to your meal by tapping "Add Dish"
              </Text>
              <View style={styles.emptyDishExamplesContainer}>
                <Text style={styles.emptyDishExamplesTitle}>Examples:</Text>
                <Text style={styles.emptyDishExample}>• Muesli with Milk</Text>
                <Text style={styles.emptyDishExample}>• Turkey Sandwich</Text>
                <Text style={styles.emptyDishExample}>• Mixed Salad</Text>
              </View>
            </View>
          )}
        </View>

        {/* Save Meal Button */}
        <View style={styles.saveButtonContainer}>
          {(!name || dishes.length === 0) && (
            <View style={styles.saveRequirementsContainer}>
              <Ionicons name="information-circle" size={20} color="#FF9500" style={styles.saveRequirementsIcon} />
              <View style={styles.saveRequirementsList}>
                <Text style={[styles.saveRequirementItem, name ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
                  {name ? '✓ Meal name provided' : '• Enter a meal name'}
                </Text>
                <Text style={[styles.saveRequirementItem, dishes.length > 0 ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
                  {dishes.length > 0 ? `✓ ${dishes.length} dish(es) added` : '• Add at least one dish'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (!name || dishes.length === 0) && styles.disabledButton
            ]} 
            onPress={handleSaveMeal}
            disabled={!name || dishes.length === 0}
          >
            <View style={styles.saveButtonContent}>
              <Ionicons name="save-outline" size={20} color="white" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Snackbar for showing errors and success messages */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={hideSnackbar}
      />
      
      {/* Modal for creating a dish */}
      <Modal
        visible={showDishCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDishCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a Dish</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowDishCreateModal(false);
                  setCurrentDishName('');
                  setCurrentDishIngredients([]);
                  setReturnToDishModal(false);
                }}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={styles.modalSubTitle}>
                Create a dish to group ingredients that you often eat together
              </Text>
              
              <Text style={styles.inputLabel}>Dish Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Muesli with Milk, Caesar Salad"
                value={currentDishName}
                onChangeText={setCurrentDishName}
              />
              
              {/* Tab navigation for dish creation */}
              <View style={styles.dishModalTabs}>
                <TouchableOpacity 
                  style={[
                    styles.dishModalTab,
                    activeTabInDishModal === 'ingredients' && styles.activeDishModalTab
                  ]}
                  onPress={() => setActiveTabInDishModal('ingredients')}
                >
                  <Text style={[
                    styles.dishModalTabText,
                    activeTabInDishModal === 'ingredients' && styles.activeDishModalTabText
                  ]}>Add Ingredients</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.dishModalTab,
                    activeTabInDishModal === 'quickDish' && styles.activeDishModalTab
                  ]}
                  onPress={() => setActiveTabInDishModal('quickDish')}
                >
                  <Text style={[
                    styles.dishModalTabText,
                    activeTabInDishModal === 'quickDish' && styles.activeDishModalTabText
                  ]}>Quick Entry</Text>
                </TouchableOpacity>
              </View>
              
              {/* Ingredients tab content */}
              {activeTabInDishModal === 'ingredients' && (
                <View style={styles.dishModalTabContent}>
                  <View style={styles.dishAddControls}>
                    {/* Remove the quantity input section and just have the Browse Ingredients button */}
                    <View style={styles.findIngredientButtonContainer}>
                      <Text style={styles.dishControlLabel}>Add an ingredient</Text>
                      <TouchableOpacity 
                        style={styles.findIngredientButton}
                        onPress={() => {
                          // Open ingredients browser on top
                          console.log('Opening ingredients browser');
                          setShowCustomIngredients(true);
                          setReturnToDishModal(true);
                        }}
                      >
                        <Ionicons name="search" size={16} color="#fff" />
                        <Text style={styles.findIngredientButtonText}>Browse Ingredients</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Recently used ingredients */}
                  {ingredients.length > 0 && (
                    <View style={styles.quickIngredients}>
                      <Text style={styles.quickIngredientsTitle}>Recently Used Ingredients</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {ingredients.slice(0, 5).map(ing => (
                          <TouchableOpacity 
                            key={ing.id}
                            style={styles.quickIngredientItem}
                            onPress={() => {
                              // Select the ingredient and show quantity modal
                              setSelectedIngredientForQuantity(ing);
                              setTempQuantity('');
                              setShowQuantityModal(true);
                            }}
                          >
                            <Text style={styles.quickIngredientName}>{ing.name}</Text>
                            <View style={styles.quickIngredientDetails}>
                              <Text style={styles.quickIngredientCal}>
                                {ing.nutrition.calories} cal/{getBaseQuantityForUnit(ing.unit)}{ing.unit}
                              </Text>
                              <View style={styles.quickIngredientUnitBadge}>
                                <Text style={styles.quickIngredientUnitText}>{ing.unit}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
              
              {/* Quick Dish Entry tab content */}
              {activeTabInDishModal === 'quickDish' && (
                <View style={styles.dishModalTabContent}>
                  <Text style={styles.tabInstructions}>
                    Quickly add a complete item with AI-estimated nutrition
                  </Text>
                  
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Item Name</Text>
                    <Text style={styles.requiredBadge}>Required</Text>
                  </View>
                  <TextInput
                    style={[styles.input, !quickDishName && styles.requiredInput]}
                    placeholder="e.g. Chicken Caesar Salad"
                    value={quickDishName}
                    onChangeText={setQuickDishName}
                  />
                  
                  <Text style={styles.inputLabel}>Number of Servings</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={quickDishServings}
                    onChangeText={setQuickDishServings}
                    keyboardType="numeric"
                  />
                  
                  <TouchableOpacity 
                    style={[
                      styles.quickDishButton, 
                      isAddingQuickDish && styles.disabledButton
                    ]} 
                    onPress={handleAddQuickDishToDish}
                    disabled={isAddingQuickDish || !quickDishName}
                  >
                    {isAddingQuickDish ? (
                      <View style={styles.buttonRow}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.buttonText}>Analyzing...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonRow}>
                        <Ionicons name="nutrition-outline" size={20} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Add to Dish</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Show current dish ingredients */}
              <View style={styles.dishIngredientsHeader}>
                <Text style={styles.dishIngredientsTitle}>
                  Ingredients in this dish:
                </Text>
              </View>
              
              {currentDishIngredients.length > 0 ? (
                <View style={styles.dishIngredientsList}>
                  {currentDishIngredients.map(ingredient => (
                    <View key={ingredient.id} style={styles.dishIngredientItem}>
                      <View style={styles.dishIngredientInfo}>
                        <Text style={styles.dishIngredientName}>{ingredient.name}</Text>
                        <View style={styles.dishIngredientDetailsRow}>
                          <TouchableOpacity 
                            style={styles.editQuantityButton}
                            onPress={() => {
                              // Create a simple prompt to edit quantity
                              const newQuantity = prompt(
                                `Enter new quantity for ${ingredient.name}`,
                                ingredient.quantity.toString()
                              );
                              
                              if (newQuantity) {
                                const parsedQuantity = parseFloat(newQuantity);
                                editCurrentDishIngredientQuantity(ingredient.id, parsedQuantity);
                              }
                            }}
                          >
                            <Text style={styles.dishIngredientDetails}>
                              {ingredient.quantity} {ingredient.unit} • {ingredient.nutrition.calories.toFixed(0)} cal
                            </Text>
                            <Ionicons name="pencil-outline" size={14} color="#007AFF" style={styles.editIcon} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeIngredientFromCurrentDish(ingredient.id)}
                      >
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <View style={styles.dishTotalCalories}>
                    <Text style={styles.dishTotalCaloriesText}>
                      Total: {currentDishIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0).toFixed(0)} calories
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyDishContainer}>
                  <Text style={styles.emptyDishText}>No ingredients added yet</Text>
                  <Text style={styles.emptyDishSubText}>Use the controls above to add ingredients</Text>
                </View>
              )}
              
              <View style={styles.dishModalButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.saveDishButton,
                    (!currentDishName || currentDishIngredients.length === 0) && styles.disabledButton
                  ]}
                  onPress={saveDishToMeal}
                  disabled={!currentDishName || currentDishIngredients.length === 0}
                >
                  <Text style={styles.saveDishButtonText}>Add to Meal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.saveDishForReuseButton,
                    (!currentDishName || currentDishIngredients.length === 0) && styles.disabledButton
                  ]}
                  onPress={handleSaveDishForReuse}
                  disabled={!currentDishName || currentDishIngredients.length === 0}
                >
                  <Ionicons name="bookmark-outline" size={18} color="white" />
                  <Text style={styles.saveDishForReuseText}>Save for Reuse</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Redesigned modal for ingredient selection */}
      <Modal
        visible={showCustomIngredients}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomIngredients(false)}
      >
        <View style={styles.ingredientModalOverlay}>
          <View style={styles.ingredientModalContent}>
            <View style={styles.ingredientModalHeader}>
              <Text style={styles.ingredientModalTitle}>Select Ingredient</Text>
              <TouchableOpacity 
                style={styles.ingredientModalCloseButton}
                onPress={() => setShowCustomIngredients(false)}
              >
                <Ionicons name="close-circle" size={26} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ingredientSearchBox}>
              <Ionicons name="search" size={18} color="#999" style={styles.ingredientSearchIcon} />
              <TextInput
                style={styles.ingredientSearchInput}
                placeholder="Search ingredients..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCapitalize="none"
              />
            </View>

            {ingredients.length === 0 ? (
              <View style={styles.emptyIngredientsMessage}>
                <Ionicons name="nutrition-outline" size={40} color="#ccc" />
                <Text style={styles.emptyIngredientsTitle}>No saved ingredients found</Text>
                <Text style={styles.emptyIngredientsSubtext}>Add ingredients using the "Add + Save Ingredient" button</Text>
                <TouchableOpacity
                  style={styles.addIngredientButton}
                  onPress={() => {
                    setShowCustomIngredients(false);
                    setTimeout(() => {
                      setShowIngredientForm(true);
                    }, 300);
                  }}
                >
                  <View style={styles.buttonRow}>
                    <Ionicons name="add-circle" size={18} color="white" />
                    <Text style={styles.addIngredientButtonText}>Add + Save Ingredient</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.ingredientResultsCount}>
                  {filteredIngredients.length} ingredient{filteredIngredients.length !== 1 ? 's' : ''} available
                </Text>
                <FlatList
                  data={filteredIngredients}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.ingredientsModalList}
                  renderItem={renderIngredientItem}
                  ListEmptyComponent={
                    <Text style={styles.emptySearchText}>No matching ingredients found</Text>
                  }
                />

                <TouchableOpacity
                  style={styles.addNewIngredientButton}
                  onPress={() => {
                    setShowCustomIngredients(false);
                    setTimeout(() => {
                      setShowIngredientForm(true);
                    }, 300);
                  }}
                >
                  <Ionicons name="add-circle" size={16} color="white" style={styles.addNewIngredientIcon} />
                  <Text style={styles.addNewIngredientText}>Add New Ingredient</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add the Ingredient Form Modal */}
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
                onPress={() => setShowIngredientForm(false)}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.sectionDescription}>
                Create a new reusable ingredient with nutrition information
              </Text>

              <Text style={styles.inputLabel}>Ingredient Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Oats, Chicken Breast"
                value={ingredientName}
                onChangeText={setIngredientName}
              />

              <Text style={styles.inputLabel}>Measurement Unit</Text>
              <TouchableOpacity 
                style={styles.unitDropdown}
                onPress={() => setShowUnitDropdown(true)}
              >
                <Text style={ingredientUnit ? styles.unitDropdownText : styles.unitDropdownPlaceholder}>
                  {ingredientUnit || 'Select a unit'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <View style={styles.labelSection}>
                <Text style={styles.sectionDescription}>
                  Get nutrition information either by uploading a label image or fetching data
                </Text>

                <View style={styles.imageContainer}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} />
                  ) : (
                    <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                      <Ionicons name="image-outline" size={40} color="#999" />
                      <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {imageUri && (
                  <TouchableOpacity 
                    style={[styles.button, styles.labelButton, labelLoading && styles.disabledButton]} 
                    onPress={processNutritionLabel}
                    disabled={labelLoading}
                  >
                    {labelLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Process Nutrition Label</Text>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity 
                  style={[styles.button, styles.fetchButton, loading && styles.disabledButton]} 
                  onPress={handleFetchNutrition}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.nutritionContainer}>
                <Text style={styles.nutritionTitle}>
                  Nutrition Information (per {ingredientUnit ? `${getBaseQuantityForUnit(ingredientUnit)} ${ingredientUnit}` : 'serving'})
                </Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                    <TextInput
                      style={styles.nutritionInput}
                      keyboardType="numeric"
                      value={nutrition.calories.toString()}
                      onChangeText={(text) => setNutrition({...nutrition, calories: parseFloat(text) || 0})}
                    />
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.nutritionInput}
                      keyboardType="numeric"
                      value={nutrition.protein?.toString() || '0'}
                      onChangeText={(text) => setNutrition({...nutrition, protein: parseFloat(text) || 0})}
                    />
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.nutritionInput}
                      keyboardType="numeric"
                      value={nutrition.carbs?.toString() || '0'}
                      onChangeText={(text) => setNutrition({...nutrition, carbs: parseFloat(text) || 0})}
                    />
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Fat (g)</Text>
                    <TextInput
                      style={styles.nutritionInput}
                      keyboardType="numeric"
                      value={nutrition.fat?.toString() || '0'}
                      onChangeText={(text) => setNutrition({...nutrition, fat: parseFloat(text) || 0})}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.saveIngredientButton]}
                onPress={handleSaveIngredient}
              >
                <Text style={styles.buttonText}>Save Ingredient</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Other existing modals */}
      <Modal
        visible={showPastMeals}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPastMeals(false)}
      >
        {/* Past meals modal content */}
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

      {/* Unit selection modal */}
      <Modal
        visible={showUnitDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUnitDropdown(false)}
      >
        {/* Unit selection modal content */}
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUnitDropdown(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
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

      {/* Add the quantity modal to the JSX */}
      <Modal
        visible={showQuantityModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.quantityModalOverlay}>
          <View style={styles.quantityModalContent}>
            <View style={styles.quantityModalHeader}>
              <Text style={styles.quantityModalTitle}>Enter Quantity</Text>
            </View>
            
            {selectedIngredientForQuantity && (
              <View style={styles.selectedIngredientInfo}>
                <Text style={styles.selectedIngredientName}>{selectedIngredientForQuantity.name}</Text>
                <Text style={styles.selectedIngredientUnit}>
                  Measured in: <Text style={styles.unitHighlight}>{selectedIngredientForQuantity.unit}</Text>
                </Text>
                <Text style={styles.selectedIngredientCalories}>
                  {selectedIngredientForQuantity.nutrition.calories} calories per {getBaseQuantityForUnit(selectedIngredientForQuantity.unit)} {selectedIngredientForQuantity.unit}
                </Text>
              </View>
            )}
            
            <Text style={styles.quantityInputLabel}>How much?</Text>
            <View style={styles.quantityInputRow}>
              <TextInput
                style={styles.quantityModalInput}
                placeholder={`Enter amount`}
                value={tempQuantity}
                onChangeText={setTempQuantity}
                keyboardType="numeric"
                autoFocus={true}
              />
              {selectedIngredientForQuantity && (
                <Text style={styles.quantityInputUnit}>{selectedIngredientForQuantity.unit}</Text>
              )}
            </View>
            
            <View style={styles.quantityModalButtons}>
              <TouchableOpacity 
                style={[styles.quantityModalButton, styles.quantityModalCancelButton]}
                onPress={() => {
                  setShowQuantityModal(false);
                  // If we were supposed to return to dish modal, show it again
                  if (returnToDishModal) {
                    setShowDishCreateModal(true);
                  }
                }}
              >
                <Text style={styles.quantityModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quantityModalButton, styles.quantityModalAddButton]}
                onPress={addIngredientWithQuantity}
              >
                <Text style={styles.quantityModalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add saved dishes modal */}
      <Modal
        visible={showSavedDishesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedDishesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Dishes</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSavedDishesModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {savedDishes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved dishes found</Text>
                <Text style={styles.emptySubtext}>Create a dish and save it for reuse</Text>
              </View>
            ) : (
              <FlatList
                data={savedDishes}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.savedDishItem}>
                    <View style={styles.savedDishInfo}>
                      <Text style={styles.savedDishName}>{item.name}</Text>
                      <Text style={styles.savedDishCalories}>{item.totalCalories.toFixed(0)} calories</Text>
                      <Text style={styles.savedDishIngredients}>
                        {item.ingredients.length} ingredients
                      </Text>
                    </View>
                    <View style={styles.savedDishActions}>
                      <TouchableOpacity 
                        style={styles.savedDishAction}
                        onPress={() => addSavedDishToMeal(item)}
                      >
                        <Ionicons name="add-circle" size={28} color="#34C759" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.savedDishAction}
                        onPress={() => handleDeleteSavedDish(item.id, item.name)}
                      >
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
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
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
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
  quickDishButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Add styles for the main tabs
  mainTabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
  },
  mainTabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeMainTabButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  mainTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeMainTabText: {
    color: '#007AFF',
  },
  mainTabIcon: {
    marginRight: 6,
  },
  tabDescriptionContainer: {
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  tabDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addDishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addDishButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dishCreationContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  dishNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dishNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    marginRight: 10,
  },
  cancelDishButton: {
    padding: 5,
  },
  dishIngredientsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  dishIngredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  dishIngredientInfo: {
    flex: 1,
  },
  dishIngredientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  dishIngredientDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyDishIngredientsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 15,
  },
  dishInstructionsText: {
    fontSize: 13,
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  saveDishButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  saveDishButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  dishesList: {
    marginBottom: 10,
  },
  dishItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dishItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dishItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dishItemActions: {
    flexDirection: 'row',
  },
  dishItemAction: {
    padding: 5,
    marginLeft: 10,
  },
  dishItemCalories: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 8,
  },
  dishItemIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dishItemIngredient: {
    fontSize: 13,
    color: '#666',
  },
  emptyDishesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
  },
  // Dish creation modal styles
  modalSubTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  dishIngredientsHeader: {
    marginTop: 15,
    marginBottom: 10,
  },
  dishIngredientsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dishIngredientsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  dishTotalCalories: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  dishTotalCaloriesText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  emptyDishContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyDishText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginBottom: 5,
  },
  emptyDishSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  dishControlsLabel: {
    marginBottom: 10,
  },
  dishAddControls: {
    marginBottom: 20,
  },
  findIngredientButtonContainer: {
    flex: 1,
  },
  findIngredientButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
  },
  findIngredientButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  dishQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  dishAddIngredientButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minWidth: 140,
  },
  dishAddIngredientText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Enhanced dish section styles
  dishActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convertToDishButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  convertToDishText: {
    fontSize: 12,
    color: '#666',
  },
  emptyDishesContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyDishesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyDishExamplesContainer: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyDishExamplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  emptyDishExample: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  // Dish modal tab styles
  dishModalTabs: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dishModalTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeDishModalTab: {
    backgroundColor: '#007AFF',
  },
  dishModalTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeDishModalTabText: {
    color: 'white',
  },
  dishModalTabContent: {
    marginBottom: 20,
  },
  dishControlLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dishQuantityContainer: {
    flex: 1,
    marginRight: 10,
  },
  tabInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  dishIngredientDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editQuantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  editIcon: {
    marginLeft: 4,
  },
  dishItemIngredientWrapper: {
    marginRight: 4,
  },
  dishItemIngredientText: {
    fontSize: 13,
    color: '#666',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(0, 122, 255, 0.5)',
  },
  // Add these new styles for the find ingredient button
  findIngredientButtonContainer: {
    flex: 1,
    marginLeft: 10,
  },
  findIngredientButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    height: 48,
  },
  findIngredientButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  
  // New styles for the ingredient modal
  ingredientModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ingredientModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  ingredientModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ingredientModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredientModalCloseButton: {
    padding: 5,
  },
  ingredientSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  ingredientSearchIcon: {
    marginRight: 8,
  },
  ingredientSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  emptyIngredientsMessage: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIngredientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyIngredientsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  ingredientResultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  ingredientsModalList: {
    paddingBottom: 10,
  },
  emptySearchText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontStyle: 'italic',
  },
  addNewIngredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addNewIngredientIcon: {
    marginRight: 8,
  },
  addNewIngredientText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  unitExplanationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  unitBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 5,
  },
  unitBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickIngredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickIngredientUnitBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginLeft: 5,
  },
  quickIngredientUnitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quantityModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  quantityModalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  quantityModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedIngredientInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  selectedIngredientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedIngredientUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  unitHighlight: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  selectedIngredientCalories: {
    fontSize: 14,
    color: '#FF9500',
  },
  quantityInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityModalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  quantityInputUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 60,
  },
  quantityModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityModalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  quantityModalAddButton: {
    backgroundColor: '#34C759',
  },
  quantityModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  quantityModalAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  dishHeaderButtons: {
    flexDirection: 'row',
  },
  browseSavedDishesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  browseDishesButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dishModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  saveDishButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  saveDishForReuseButton: {
    flex: 1,
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  saveDishForReuseText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  savedDishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  savedDishInfo: {
    flex: 1,
  },
  savedDishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  savedDishCalories: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 2,
  },
  savedDishIngredients: {
    fontSize: 13,
    color: '#666',
  },
  savedDishActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedDishAction: {
    marginLeft: 15,
  },
});

export default CreateMeal; 