import React, { useState, useContext, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  Modal,
  Text,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { AppContext } from '../../context/AppContext';
import { MealIngredient, Ingredient, Dish, Meal } from '../../../types';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
// Import our modular components
import {
  Snackbar,
  QuantityModal,
  IngredientSelectionModal,
  SavedDishesModal,
  getBaseQuantityForUnit,
  addQuickDish as addQuickDishHelper
} from './index';

// Import new modular components
import SaveMealButton from './SaveMealButton';
import MealForm from './MealForm';
import DishManagement from './DishManagement';
import CreateDishModal from './CreateDishModal';
import MealHistory from '../dashboard/MealHistory';

// Component to show meals for a specific day
interface DayMealsSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  meals: Meal[];
  onSelectMeal: (meal: Meal) => void;
}

const DayMealsSelectionModal: React.FC<DayMealsSelectionModalProps> = ({ 
  visible, 
  onClose, 
  date, 
  meals, 
  onSelectMeal 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Select Meal</Text>
              <Text style={styles.modalSubtitle}>{formatDate(date)}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.darkGrey} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={meals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.mealListContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.mealCard}
                onPress={() => onSelectMeal(item)}
              >
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{item.name}</Text>
                  <Text style={styles.mealCalories}>
                    {Math.round(item.totalCalories)} calories
                  </Text>

                  {item.dishes && (
                    <Text style={styles.dishesCount}>
                      {item.dishes.length}{" "}
                      {item.dishes.length === 1 ? "dish" : "dishes"}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey3} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const CreateMealScreen: React.FC = () => {
  const { 
    addMeal, 
    ingredients, 
    getPastMeals,
    savedDishes,
    saveDish,
    deleteSavedDish: removeSavedDish,
    addCustomIngredient
  } = useContext(AppContext);
  
  // Add scrollY for header animation
  const [scrollY] = useState(new Animated.Value(0));
  
  // Meal state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  
  // Dish state
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [currentDishName, setCurrentDishName] = useState('');
  const [currentDishIngredients, setCurrentDishIngredients] = useState<MealIngredient[]>([]);
  const [showDishCreateModal, setShowDishCreateModal] = useState(false);
  const [activeTabInDishModal, setActiveTabInDishModal] = useState<'ingredients' | 'quickDish'>('ingredients');
  
  // Quick dish entry state
  const [quickDishName, setQuickDishName] = useState('');
  const [quickDishServings, setQuickDishServings] = useState('1');
  const [quickDishServingsMultiplier, setQuickDishServingsMultiplier] = useState(1);
  const [isAddingQuickDish, setIsAddingQuickDish] = useState(false);
  
  // Ingredient selection state
  const [showIngredientSelectionModal, setShowIngredientSelectionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnToDishModal, setReturnToDishModal] = useState(false);
  
  // Quantity modal state
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedIngredientForQuantity, setSelectedIngredientForQuantity] = useState<Ingredient | null>(null);
  const [tempQuantity, setTempQuantity] = useState('');

  // Past meals modal state
  const [showPastMeals, setShowPastMeals] = useState(false);
  const [pastMeals, setPastMeals] = useState<Meal[]>([]);
  
  // Saved dishes modal state
  const [showSavedDishesModal, setShowSavedDishesModal] = useState(false);
  
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  // Add new state for day meals selection
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayMeals, setSelectedDayMeals] = useState<Meal[]>([]);
  const [showDayMealsModal, setShowDayMealsModal] = useState(false);

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

  // Load past meals when the component mounts
  useEffect(() => {
    const recentMeals = getPastMeals(10); // Get 10 most recent meals
    setPastMeals(recentMeals);
  }, [getPastMeals]);

  // Handle date picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Handle saving the meal
  const handleSaveMeal = async () => {
    if (!name) {
      showSnackbar('Please enter a meal name');
      return;
    }

    if (dishes.length === 0) {
      showSnackbar('Please add at least one dish');
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

  // Handle selecting an ingredient
  const onSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredientForQuantity(ingredient);
    setTempQuantity('');
    setShowQuantityModal(true);
    setShowIngredientSelectionModal(false);
  };

  // Handle adding a quick dish using AI to generate estimated ingredients
  const handleAddQuickDish = async () => {
    if (!quickDishName.trim()) {
      showSnackbar('Please enter a dish name');
      return;
    }
    
    if (isAddingQuickDish) return;

    try {
      // Use the new addQuickDish helper function that leverages OpenAI
      addQuickDishHelper(
        quickDishName,
        setCurrentDishIngredients,
        setCurrentDishName,
        setIsAddingQuickDish
      );
      
      // Show success message when complete
      showSnackbar(`Analyzing "${quickDishName}"...`, 'info');
    } catch (error) {
      console.error('Error adding quick dish:', error);
      showSnackbar('Failed to analyze dish. Please try again or add ingredients manually.');
      setIsAddingQuickDish(false);
    }
  };

  // Add ingredient with quantity
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
      
      const scaledNutrition = {
        calories: (ingredient.nutrition.calories || 0) * scaleFactor,
        protein: (ingredient.nutrition.protein || 0) * scaleFactor,
        carbs: (ingredient.nutrition.carbs || 0) * scaleFactor,
        fat: (ingredient.nutrition.fat || 0) * scaleFactor,
      };

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
        
        // Show dish modal again
        setTimeout(() => {
          setShowDishCreateModal(true);
        }, 300);
      } else {
        // Add the new ingredient to the meal
        setMealIngredients(prev => [...prev, newIngredient]);
        showSnackbar(`Added ${quantity} ${ingredient.unit} of ${ingredient.name} to meal`, 'success');
        
        // Show hint about next steps
        setTimeout(() => {
          showSnackbar('You can now add more ingredients or save the meal', 'info');
        }, 3000);
      }
      
      // Close modal and reset
      setShowQuantityModal(false);
      setSelectedIngredientForQuantity(null);
      setTempQuantity('');
      setReturnToDishModal(false);
    } catch (error) {
      console.error('Error adding ingredient with quantity:', error);
      showSnackbar('Failed to add ingredient');
    }
  };

  // Open ingredient selection modal
  const openIngredientSelection = (returnToDish = false) => {
    setSearchTerm('');
    setReturnToDishModal(returnToDish);
    setShowIngredientSelectionModal(true);
    setShowDishCreateModal(false);
  };

  // Save dish to the current meal
  const saveDishToMeal = () => {
    try {
      if (!currentDishName) {
        showSnackbar('Please enter a dish name');
        return;
      }
      
      if (currentDishIngredients.length === 0) {
        showSnackbar('Please add at least one ingredient to the dish');
        return;
      }
      // Calculate total calories for the dish
      const totalCalories = currentDishIngredients.reduce(
        (sum, ing) => sum + ing.nutrition.calories, 
        0
      );
      
      // Create new dish
      const newDish: Dish = {
        id: Date.now().toString(),
        name: currentDishName,
        ingredients: currentDishIngredients,
        totalCalories
      };
      
      // Add to dishes array
      setDishes(prev => [...prev, newDish]);
      
      // Show success message
      showSnackbar(`Added "${currentDishName}" to meal`, 'success');
      
      // Reset dish creation state
      setCurrentDishName('');
      setCurrentDishIngredients([]);
      setQuickDishName('');
      setQuickDishServings('1');
      handleSaveDishForReuse();
      // Close the modal
      setShowDishCreateModal(false);
      
      // Show next steps hint
      setTimeout(() => {
        showSnackbar('You can now add more dishes or save the meal', 'info');
      }, 2000);
    } catch (error) {
      console.error('Error saving dish to meal:', error);
      showSnackbar('Failed to add dish to meal');
    }
  };

  // Save dish for reuse without adding to meal
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
  
  // Handle editing a dish 
  const editDish = (dish: Dish) => {
    setCurrentDishName(dish.name);
    setCurrentDishIngredients([...dish.ingredients]);
    setShowDishCreateModal(true);
    removeDishFromMeal(dish.id);
  };
  
  // Remove dish from meal
  const removeDishFromMeal = (dishId: string) => {
    setDishes(dishes.filter(dish => dish.id !== dishId));
  };
  
  // Edit dish ingredient quantity
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
  
  // Edit current dish ingredient quantity and nutrition values
  const editCurrentDishIngredient = (ingredientId: string, newQuantity: number, newNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      showSnackbar('Please enter a valid quantity');
      return;
    }
    
    // Update the ingredient in the current dish
    const updatedIngredients = currentDishIngredients.map(ing => {
      if (ing.id === ingredientId) {
        // Find the original ingredient to check if we need to scale nutrition
        const originalIngredient = currentDishIngredients.find(i => i.id === ingredientId);
        
        if (originalIngredient) {
          // Calculate scale factor based on quantity change
          const scaleFactor = newQuantity / originalIngredient.quantity;
          
          // Determine if nutrition values were explicitly changed or should be scaled
          // We'll assume if all values match scaled values, then only quantity changed
          const scaledNutrition = {
            calories: originalIngredient.nutrition.calories * scaleFactor,
            protein: (originalIngredient.nutrition.protein || 0) * scaleFactor,
            carbs: (originalIngredient.nutrition.carbs || 0) * scaleFactor,
            fat: (originalIngredient.nutrition.fat || 0) * scaleFactor,
          };
          
          // Check if nutrition was explicitly changed by comparing with scaled values
          // Allow for small rounding differences (0.1)
          const nutritionExplicitlyChanged = 
            Math.abs(newNutrition.calories - scaledNutrition.calories) > 0.1 ||
            Math.abs(newNutrition.protein - scaledNutrition.protein) > 0.1 ||
            Math.abs(newNutrition.carbs - scaledNutrition.carbs) > 0.1 ||
            Math.abs(newNutrition.fat - scaledNutrition.fat) > 0.1;
          
          return {
            ...ing,
            quantity: newQuantity,
            nutrition: nutritionExplicitlyChanged ? newNutrition : scaledNutrition,
          };
        }
        
        // Fallback if original ingredient not found
        return {
          ...ing,
          quantity: newQuantity,
          nutrition: newNutrition,
        };
      }
      return ing;
    });
    
    setCurrentDishIngredients(updatedIngredients);
    showSnackbar('Ingredient updated', 'success');
  };
  
  const editCurrentDishIngredients = (ingredients: MealIngredient[]) => {
    setCurrentDishIngredients(ingredients);
    showSnackbar('Ingredient updated', 'success');
  };

  // Remove ingredient from current dish
  const removeIngredientFromCurrentDish = (id: string) => {
    setCurrentDishIngredients(currentDishIngredients.filter(i => i.id !== id));
  };

  // Add saved dish to meal
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
  
  // Delete saved dish
  const handleDeleteSavedDish = async (dishId: string) => {
    try {
      await removeSavedDish(dishId);
      showSnackbar('Dish deleted', 'success');
    } catch (error) {
      console.error('Failed to delete dish:', error);
      showSnackbar('Failed to delete dish', 'error');
    }
  };

  // Handle adding a new custom ingredient
  const handleAddCustomIngredient = async (newIngredient: Omit<Ingredient, 'id'>) => {
    try {
      // Save the ingredient to the app context
      const success = await addCustomIngredient(newIngredient);
      
      if (success) {
        showSnackbar(`Custom ingredient "${newIngredient.name}" has been added`, 'success');
      } else {
        showSnackbar('Failed to save custom ingredient', 'error');
      }
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
      showSnackbar('An error occurred while adding the ingredient', 'error');
    }
  };

  // Helper function to process meals into days for MealHistory
  const getMealDays = (mealsData: Meal[]) => {
    const dayMap = new Map<string, {
      date: string;
      meals: Meal[];
      totalCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      }
    }>();

    mealsData.forEach(meal => {
      const day = meal.date;
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          date: day,
          meals: [],
          totalCalories: 0,
          macros: {
            protein: 0,
            carbs: 0,
            fat: 0
          }
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.meals.push(meal);
      dayData.totalCalories += meal.totalCalories;

      meal.ingredients.forEach(ing => {
        dayData.macros.protein += ing.nutrition.protein || 0;
        dayData.macros.carbs += ing.nutrition.carbs || 0;
        dayData.macros.fat += ing.nutrition.fat || 0;
      });

      if (meal.dishes) {
        meal.dishes.forEach(dish => {
          dish.ingredients.forEach(ing => {
            dayData.macros.protein += ing.nutrition.protein || 0;
            dayData.macros.carbs += ing.nutrition.carbs || 0;
            dayData.macros.fat += ing.nutrition.fat || 0;
          });
        });
      }
    });

    return Array.from(dayMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Process past meals into day format
  const pastMealDays = useMemo(() => {
    return getMealDays(pastMeals);
  }, [pastMeals]);

  // Modified function to handle selecting a day from history
  const handleSelectMealFromHistory = (day: {
    date: string;
    meals: Meal[];
    totalCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    }
  }) => {
    // If there's only one meal for this day, use it directly
    if (day.meals && day.meals.length === 1) {
      applyMealTemplate(day.meals[0]);
    } else if (day.meals && day.meals.length > 1) {
      // If there are multiple meals, show the selection modal
      setSelectedDay(day.date);
      setSelectedDayMeals(day.meals);
      setShowDayMealsModal(true);
      setShowPastMeals(false);
    }
  };

  // New function to handle selecting a specific meal
  const handleSelectSpecificMeal = (meal: Meal) => {
    applyMealTemplate(meal);
    setShowDayMealsModal(false);
  };

  // Function to apply a selected meal as a template
  const applyMealTemplate = (selectedMeal: Meal) => {
    // Pre-fill the form with the selected meal data
    // TODO: Add a unique ID to the meal name (strip any existing HH:MM) and add the current time in HH:MM format
    setName(
      selectedMeal.name.replace(/ \([0-9]{2}:[0-9]{2}\)$/, "") +
        ` (${new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })})`
    );
    
    if (selectedMeal.dishes) {
      // Clone dishes to avoid reference issues
      const clonedDishes = selectedMeal.dishes.map((dish: Dish) => ({
        ...dish,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ingredients: dish.ingredients.map((ing: MealIngredient) => ({
          ...ing,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      }));
      setDishes(clonedDishes);
    }
    
    // Close the modal
    setShowPastMeals(false);
    showSnackbar('Meal template loaded', 'success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <Header title="Create Meal" />
      
      <View style={styles.outerContainer}>
        <Animated.ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <MealForm 
            name={name}
            setName={setName}
            date={date}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            handleDateChange={handleDateChange}
            setShowPastMeals={setShowPastMeals}
          />

          {/* Dish Management Section */}
          <DishManagement 
            dishes={dishes}
            mealNutrition={mealNutrition}
            editDish={editDish}
            removeDishFromMeal={removeDishFromMeal}
            editDishIngredientQuantity={editDishIngredientQuantity}
            setShowSavedDishesModal={setShowSavedDishesModal}
            setCurrentDishName={setCurrentDishName}
            setCurrentDishIngredients={setCurrentDishIngredients}
            setActiveTabInDishModal={setActiveTabInDishModal}
            setShowDishCreateModal={setShowDishCreateModal}
          />

          {/* Save Meal Button */}
          <SaveMealButton 
            name={name}
            dishes={dishes}
            handleSaveMeal={handleSaveMeal}
          />
        </Animated.ScrollView>
        
        {/* Modals */}
        <CreateDishModal
          visible={showDishCreateModal}
          dishName={currentDishName}
          onDishNameChange={setCurrentDishName}
          ingredients={currentDishIngredients}
          onAddIngredient={() => openIngredientSelection(true)}
          onRemoveIngredient={removeIngredientFromCurrentDish}
          editCurrentDishIngredient={editCurrentDishIngredient}
          editCurrentDishIngredients={editCurrentDishIngredients}
          onSaveDish={saveDishToMeal}
          onClose={() => setShowDishCreateModal(false)}
          activeTab={activeTabInDishModal}
          onTabChange={setActiveTabInDishModal}
          quickDishName={quickDishName}
          onQuickDishNameChange={setQuickDishName}
          quickDishServings={quickDishServings}
          onQuickDishServingsChange={setQuickDishServings}
          isAddingQuickDish={isAddingQuickDish}
          onAddQuickDish={handleAddQuickDish}
          quickDishServingsMultiplier={quickDishServingsMultiplier}
          onQuickDishServingsMultiplierChange={setQuickDishServingsMultiplier}
        />
        
        <SavedDishesModal 
          visible={showSavedDishesModal}
          savedDishes={savedDishes}
          onClose={() => setShowSavedDishesModal(false)}
          onAddDishToMeal={addSavedDishToMeal}
          onDeleteDish={handleDeleteSavedDish}
        />
        
        <IngredientSelectionModal
          visible={showIngredientSelectionModal}
          ingredients={ingredients}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectIngredient={onSelectIngredient}
          onAddNewIngredient={handleAddCustomIngredient}
          onClose={() => {
            setShowIngredientSelectionModal(false);
            if (returnToDishModal) {
              setTimeout(() => setShowDishCreateModal(true), 300);
            }
          }}
          getBaseQuantityForUnit={getBaseQuantityForUnit}
        />
        
        <QuantityModal
          visible={showQuantityModal}
          ingredient={selectedIngredientForQuantity}
          quantity={tempQuantity}
          onQuantityChange={setTempQuantity}
          onSave={addIngredientWithQuantity}
          onCancel={() => {
            setShowQuantityModal(false);
            if (returnToDishModal) {
              setTimeout(() => setShowDishCreateModal(true), 300);
            }
          }}
        />
        
        {/* Past Meals Modal */}
        <MealHistory 
          visible={showPastMeals}
          onClose={() => setShowPastMeals(false)}
          days={pastMealDays}
          onSelectDay={handleSelectMealFromHistory}
        />
        
        {/* Day Meals Selection Modal */}
        <DayMealsSelectionModal 
          visible={showDayMealsModal}
          onClose={() => setShowDayMealsModal(false)}
          date={selectedDay || ''}
          meals={selectedDayMeals}
          onSelectMeal={handleSelectSpecificMeal}
        />
        
        <Snackbar
          visible={snackbarVisible}
          message={snackbarMessage}
          type={snackbarType}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  outerContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 80, // Account for header + status bar on iOS
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBluegrey3,
  },
  modalTitleContainer: {
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  mealListContainer: {
    paddingBottom: 20,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.orange,
    marginBottom: 2,
  },
  dishesCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  }
});

export default CreateMealScreen; 