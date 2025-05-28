import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Text,
  TouchableOpacity,
} from "react-native";
import { AppContext } from '../../context/AppContext';
import { MealIngredient, Ingredient, Dish, Meal } from '../../../types';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Snackbar } from './index';
import IngredientSelectionModal from './IngredientSelectionModal';
import QuantityModal from './QuantityModal';
import SavedDishesModal from './SavedDishesModal';
import { FynkoDatePicker, FynkoTextInput, FynkoDropdown, DropdownOption } from '../common';
import { multiplyNutrition, formatNutritionValue } from '../../utils/nutrition';

const MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Brunch',
  'Dinner',
  'Pre-workout',
  'Post-workout',
  'Snacks'
] as const;

type MealType = typeof MEAL_TYPES[number];

// Create dropdown options for meal types
const mealTypeOptions: DropdownOption[] = MEAL_TYPES.map(type => ({
  label: type,
  value: type
}));

const CreateMealScreen: React.FC = () => {
  const { 
    addMeal, 
    ingredients,
    savedDishes,
    addCustomIngredient
  } = useContext(AppContext);
  
  // Basic meal state
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [date, setDate] = useState(new Date());
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  
  // UI state
  const [scrollY] = useState(new Animated.Value(0));
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success' | 'info'>('info');

  // Add state for saved dishes modal
  const [showSavedDishesModal, setShowSavedDishesModal] = useState(false);

  // Calculate total nutrition
  const totalNutrition = {
    calories: mealIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0) +
              dishes.reduce((sum, dish) => sum + dish.totalCalories, 0),
    protein: mealIngredients.reduce((sum, ing) => sum + (ing.nutrition.protein || 0), 0) +
             dishes.reduce((sum, dish) => sum + dish.ingredients.reduce((p, i) => p + (i.nutrition.protein || 0), 0), 0),
    carbs: mealIngredients.reduce((sum, ing) => sum + (ing.nutrition.carbs || 0), 0) +
           dishes.reduce((sum, dish) => sum + dish.ingredients.reduce((c, i) => c + (i.nutrition.carbs || 0), 0), 0),
    fat: mealIngredients.reduce((sum, ing) => sum + (ing.nutrition.fat || 0), 0) +
         dishes.reduce((sum, dish) => sum + dish.ingredients.reduce((f, i) => f + (i.nutrition.fat || 0), 0), 0),
  };

  const showSnackbar = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!mealType) {
      showSnackbar('Please select a meal type', 'error');
      return;
    }

    if (dishes.length === 0 && mealIngredients.length === 0) {
      showSnackbar('Please add at least one dish or ingredient', 'error');
      return;
    }

    try {
      await addMeal({
        name: mealType,
        date: date.toISOString().split('T')[0],
        ingredients: mealIngredients,
        dishes: dishes,
      });
      
      showSnackbar('Meal saved successfully', 'success');
      
      // Reset form
      setMealType('Breakfast');
      setDate(new Date());
      setMealIngredients([]);
      setDishes([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      showSnackbar('Failed to save meal', 'error');
    }
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowQuantityModal(true);
    setShowIngredientModal(false);
  };

  const handleSaveIngredient = (qty: number) => {
    if (!selectedIngredient) return;

    const newIngredient: MealIngredient = {
      id: Date.now().toString(),
      ingredientId: selectedIngredient.id,
      name: selectedIngredient.name,
      unit: selectedIngredient.unit,
      quantity: qty,
      nutrition: multiplyNutrition(selectedIngredient.nutrition, qty),
    };

    setMealIngredients([...mealIngredients, newIngredient]);
    setShowQuantityModal(false);
    setSelectedIngredient(null);
  };

  const handleRemoveIngredient = (id: string) => {
    setMealIngredients(mealIngredients.filter(i => i.id !== id));
  };

  const handleAddSavedDish = (dish: Dish) => {
    setDishes([...dishes, { ...dish, id: Date.now().toString() }]);
  };

  const handleRemoveDish = (id: string) => {
    setDishes(dishes.filter(d => d.id !== id));
  };

  const handleSelectSavedDish = (dish: Dish) => {
    handleAddSavedDish(dish);
    setShowSavedDishesModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Header title="Create Meal" />

      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Basic Info Section */}

          <Text style={styles.sectionTitle}>Meal Details</Text>
          {/* Meal Type Card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>Meal Type</Text>
              <FynkoDropdown
                options={mealTypeOptions}
                selectedValue={mealType}
                onValueChange={(value) => setMealType(value as MealType)}
                placeholder="Select meal type"
              />
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>Date</Text>
              <FynkoDatePicker
                date={date}
                onDateChange={(newDate) => setDate(newDate)}
              />
            </View>
          </View>

          {/* Nutrition Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Summary</Text>
            <View style={styles.nutritionCard}>
              <Text style={styles.caloriesText}>
                {formatNutritionValue(totalNutrition.calories)} calories
              </Text>
              <View style={styles.macrosContainer}>
                <Text style={styles.macroText}>
                  P: {formatNutritionValue(totalNutrition.protein)}g
                </Text>
                <Text style={styles.macroText}>
                  C: {formatNutritionValue(totalNutrition.carbs)}g
                </Text>
                <Text style={styles.macroText}>
                  F: {formatNutritionValue(totalNutrition.fat)}g
                </Text>
              </View>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowIngredientModal(true)}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add Ingredient</Text>
              </TouchableOpacity>
            </View>

            {mealIngredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientItem}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientDetails}>
                    {ingredient.quantity} {ingredient.unit} •{" "}
                    {formatNutritionValue(Math.round(ingredient.nutrition.calories))} cal
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveIngredient(ingredient.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Dishes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dishes</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowSavedDishesModal(true)}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add Dish</Text>
              </TouchableOpacity>
            </View>

            {dishes.map((dish) => (
              <View key={dish.id} style={styles.dishItem}>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishCalories}>
                    {formatNutritionValue(Math.round(dish.totalCalories))} calories
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveDish(dish.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
            <Text style={styles.saveButtonText}>Save Meal</Text>
          </TouchableOpacity>
        </Animated.ScrollView>

        {/* Modals */}
        <IngredientSelectionModal
          visible={showIngredientModal}
          ingredients={ingredients}
          onSelectIngredient={handleAddIngredient}
          onClose={() => setShowIngredientModal(false)}
        />

        <QuantityModal
          visible={showQuantityModal}
          ingredient={selectedIngredient}
          onSave={handleSaveIngredient}
          onClose={() => {
            setShowQuantityModal(false);
            setSelectedIngredient(null);
          }}
        />

        <SavedDishesModal
          visible={showSavedDishesModal}
          dishes={savedDishes}
          onSelectDish={handleSelectSavedDish}
          onClose={() => setShowSavedDishesModal(false)}
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
  container: {
    flex: 1,
    marginTop: 80, // Account for header + status bar
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grey3,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grey3,
  },
  cardRow: {
    marginVertical: 0,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  pickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grey3,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: "flex-end",
  },
  pickerModalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBluegrey3,
    backgroundColor: COLORS.cardBackground,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  pickerModalButton: {
    padding: 8,
    minWidth: 60,
    alignItems: "center",
  },
  pickerModalButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  pickerModalButtonDone: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  iosPicker: {
    backgroundColor: COLORS.cardBackground,
    height: 200,
  },
  androidPickerItem: {
    color: COLORS.textPrimary,
    fontSize: 16,
    height: 50,
    backgroundColor: COLORS.cardBackground,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grey3,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  nutritionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  caloriesText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.orange,
    marginBottom: 8,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dishItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dishCalories: {
    fontSize: 14,
    color: COLORS.orange,
  },
  removeButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
});

export default CreateMealScreen; 