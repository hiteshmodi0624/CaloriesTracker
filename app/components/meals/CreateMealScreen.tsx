import React, { useState, useContext, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView,
  Alert
} from 'react-native';
import { AppContext } from '../../context/AppContext';
import { MealIngredient, Ingredient, Dish, Meal } from '../../../types';

// Import our modular components
import {
  Snackbar,
  QuantityModal,
  IngredientSelectionModal,
  SavedDishesModal,
  getBaseQuantityForUnit,
  generateEstimatedIngredients
} from './index';

// Import new modular components
import MealForm from './MealForm';
import DishManagement from './DishManagement';
import SaveMealButton from './SaveMealButton';
import CreateDishModal from './CreateDishModal';
import { fetchNutritionForDish } from '../../services/openai';

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

  // Handle adding quick dish in dish creation
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
      
      // Generate constituent ingredients for the dish
      const estimatedIngredients = await generateEstimatedIngredients(quickDishName, {
        calories: dishNutrition.calories,
        protein: dishNutrition.protein || 0,
        carbs: dishNutrition.carbs || 0,
        fat: dishNutrition.fat || 0
      });
      
      // Verify the total calories in the generated ingredients
      const ingredientsCalories = estimatedIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
      
      // Update current dish ingredients
      setCurrentDishIngredients([...currentDishIngredients, ...estimatedIngredients]);
      
      // If dish name is not set, use quick dish name
      if (!currentDishName) {
        setCurrentDishName(quickDishName);
      }
      
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

  // Save dish to meal
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
    
    // Update dishes state
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
  
  // Edit current dish ingredient quantity
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

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container}>
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
      </ScrollView>
      
      {/* Modals */}
      <CreateDishModal
        visible={showDishCreateModal}
        dishName={currentDishName}
        onDishNameChange={setCurrentDishName}
        ingredients={currentDishIngredients}
        onAddIngredient={() => openIngredientSelection(true)}
        onRemoveIngredient={removeIngredientFromCurrentDish}
        onEditIngredientQuantity={editCurrentDishIngredientQuantity}
        onSaveDish={saveDishToMeal}
        onSaveForReuse={handleSaveDishForReuse}
        onClose={() => setShowDishCreateModal(false)}
        activeTab={activeTabInDishModal}
        onTabChange={setActiveTabInDishModal}
        quickDishName={quickDishName}
        onQuickDishNameChange={setQuickDishName}
        quickDishServings={quickDishServings}
        onQuickDishServingsChange={setQuickDishServings}
        isAddingQuickDish={isAddingQuickDish}
        onAddQuickDish={handleAddQuickDish}
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
        selectedIngredient={selectedIngredientForQuantity}
        quantity={tempQuantity}
        onQuantityChange={setTempQuantity}
        onCancel={() => {
          setShowQuantityModal(false);
          if (returnToDishModal) {
            setTimeout(() => setShowDishCreateModal(true), 300);
          }
        }}
        onAdd={addIngredientWithQuantity}
        getBaseQuantityForUnit={getBaseQuantityForUnit}
      />
      
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
});

export default CreateMealScreen; 