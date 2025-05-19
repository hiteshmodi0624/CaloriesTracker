import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Meal, MealIngredient } from '../../../types';
import { COLORS } from '../meals/ingredients/constants';

interface MealEditScreenProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onSave: (mealId: string, updates: Partial<Omit<Meal, 'id'>>) => Promise<boolean>;
}

const MealEditScreen: React.FC<MealEditScreenProps> = ({ visible, meal, onClose, onSave }) => {
  // State variables for editing the meal
  const [mealName, setMealName] = useState('');
  const [mealDate, setMealDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<MealIngredient | null>(null);
  const [editIngredientQuantity, setEditIngredientQuantity] = useState('');
  const [editIngredientIndex, setEditIngredientIndex] = useState<number>(-1);
  const [editingDishIndex, setEditingDishIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [mealData, setMealData] = useState<Meal | null>(null);
  
  // Update state when meal changes
  useEffect(() => {
    if (meal) {
      setMealName(meal.name);
      setMealDate(new Date(meal.date));
      // Create a deep copy of the meal object to work with
      setMealData(JSON.parse(JSON.stringify(meal)));
    }
  }, [meal]);

  // If no meal is provided, don't render anything
  if (!meal || !mealData) {
    return null;
  }

  // Function to handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setMealDate(selectedDate);
    }
  };

  // Function to start editing an ingredient
  const handleEditIngredient = (ingredient: MealIngredient, index: number, dishIndex: number = -1) => {
    setEditingIngredient(ingredient);
    setEditIngredientQuantity(ingredient.quantity.toString());
    setEditIngredientIndex(index);
    setEditingDishIndex(dishIndex);
  };

  // Function to cancel editing an ingredient
  const cancelIngredientEdit = () => {
    setEditingIngredient(null);
    setEditIngredientQuantity('');
    setEditIngredientIndex(-1);
    setEditingDishIndex(-1);
  };

  // Function to save ingredient quantity changes
  const handleSaveIngredientEdit = async () => {
    if (!editingIngredient || !mealData) return;

    const quantity = parseFloat(editIngredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Error", "Please enter a valid quantity greater than 0");
      return;
    }

    try {
      // Create a deep copy of the meal for modification
      const updatedMeal = JSON.parse(JSON.stringify(mealData));
      
      // Calculate the change factor for nutrition values
      const changeFactor = quantity / editingIngredient.quantity;
      
      if (editingDishIndex >= 0 && updatedMeal.dishes) {
        // Updating an ingredient within a dish
        const dish = updatedMeal.dishes[editingDishIndex];
        const ingredient = dish.ingredients[editIngredientIndex];
        
        // Generate a new ID for the updated ingredient to avoid conflicts
        ingredient.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Update ingredient quantity and nutrition
        ingredient.quantity = quantity;
        ingredient.nutrition.calories = Math.round(ingredient.nutrition.calories * changeFactor);
        ingredient.nutrition.protein = Math.round((ingredient.nutrition.protein || 0) * changeFactor);
        ingredient.nutrition.carbs = Math.round((ingredient.nutrition.carbs || 0) * changeFactor);
        ingredient.nutrition.fat = Math.round((ingredient.nutrition.fat || 0) * changeFactor);
        
        // Recalculate dish total calories
        dish.totalCalories = dish.ingredients.reduce((sum: number, ing: MealIngredient) => sum + ing.nutrition.calories, 0);
        
        // Remove any duplicate ingredients with the same name in the top-level ingredients array
        updatedMeal.ingredients = updatedMeal.ingredients.filter(
          (ing: MealIngredient) => ing.name !== ingredient.name || ing.id === ingredient.id
        );
      } else {
        // Updating a meal-level ingredient
        const ingredient = updatedMeal.ingredients[editIngredientIndex];
        
        // Generate a new ID for the updated ingredient to avoid conflicts
        ingredient.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Update ingredient quantity and nutrition
        ingredient.quantity = quantity;
        ingredient.nutrition.calories = Math.round(ingredient.nutrition.calories * changeFactor);
        ingredient.nutrition.protein = Math.round((ingredient.nutrition.protein || 0) * changeFactor);
        ingredient.nutrition.carbs = Math.round((ingredient.nutrition.carbs || 0) * changeFactor);
        ingredient.nutrition.fat = Math.round((ingredient.nutrition.fat || 0) * changeFactor);
        
        // Remove any duplicate ingredients with the same name from dishes
        if (updatedMeal.dishes) {
          updatedMeal.dishes.forEach((dish: any) => {
            dish.ingredients = dish.ingredients.filter(
              (ing: MealIngredient) => ing.name !== ingredient.name || ing.id === ingredient.id
            );
            
            // Recalculate dish total calories after removing ingredients
            dish.totalCalories = dish.ingredients.reduce(
              (sum: number, ing: MealIngredient) => sum + ing.nutrition.calories, 0
            );
          });
          
          // Remove empty dishes
          updatedMeal.dishes = updatedMeal.dishes.filter((dish: any) => dish.ingredients.length > 0);
        }
      }
      
      // Recalculate meal total calories
      let totalCalories = updatedMeal.ingredients.reduce(
        (sum: number, ing: MealIngredient) => sum + ing.nutrition.calories, 0
      );
      
      if (updatedMeal.dishes) {
        totalCalories += updatedMeal.dishes.reduce(
          (sum: number, dish: any) => sum + dish.totalCalories, 0
        );
      }
      
      updatedMeal.totalCalories = totalCalories;
      
      // Update the meal object in state with the new version
      setMealData(updatedMeal);
      
      // Reset editing state
      setEditingIngredient(null);
      setEditIngredientQuantity('');
      setEditIngredientIndex(-1);
      setEditingDishIndex(-1);
      
    } catch (error) {
      console.error("Error updating ingredient:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  // Function to save all meal changes
  const handleSaveChanges = async () => {
    if (!mealName.trim() || !mealData) {
      Alert.alert("Error", "Meal name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const updates: Partial<Omit<Meal, 'id'>> = {
        name: mealName,
        date: mealDate.toISOString().split('T')[0],
        totalCalories: mealData.totalCalories,
        ingredients: mealData.ingredients,
        dishes: mealData.dishes,
      };
      
      const success = await onSave(meal.id, updates);
      
      if (success) {
        Alert.alert("Success", "Meal updated successfully", [
          { text: "OK", onPress: onClose }
        ]);
      } else {
        Alert.alert("Error", "Failed to update the meal");
      }
    } catch (error) {
      console.error("Error saving meal:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  console.log(JSON.stringify(meal));
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
            <Text style={styles.modalTitle}>Edit Meal</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.darkGrey} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={true}
            >
              {/* Meal Basic Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <Text style={styles.inputLabel}>Meal Name:</Text>
                <TextInput
                  style={styles.input}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Enter meal name"
                />

                <Text style={styles.inputLabel}>Date:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>{mealDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={24} color={COLORS.secondary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={mealDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <Text style={styles.mealCalories}>
                  Total: {mealData.totalCalories} calories
                </Text>
              </View>

              {/* Dishes Section */}
              {mealData.dishes && mealData.dishes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dishes</Text>

                  {mealData.dishes.map((dish, dishIndex) => (
                    <View key={dish.id} style={styles.dishItem}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishCalories}>
                        {dish.totalCalories} calories
                      </Text>

                      <View style={styles.dishIngredients}>
                        {dish.ingredients.map((ingredient, ingIndex) => (
                          <View
                            key={ingredient.id}
                            style={styles.ingredientItem}
                          >
                            <View style={styles.ingredientRow}>
                              <Text style={styles.ingredientName}>
                                {ingredient.quantity} {ingredient.unit}{" "}
                                {ingredient.name}
                              </Text>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() =>
                                  handleEditIngredient(
                                    ingredient,
                                    ingIndex,
                                    dishIndex
                                  )
                                }
                              >
                                <FontAwesome
                                  name="pencil"
                                  size={16}
                                  color={COLORS.blue}
                                />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.ingredientNutrition}>
                              {ingredient.nutrition.calories} cal | P:{" "}
                              {ingredient.nutrition.protein || 0}g | C:{" "}
                              {ingredient.nutrition.carbs || 0}g | F:{" "}
                              {ingredient.nutrition.fat || 0}g
                            </Text>

                            {/* Inline editing form for this ingredient */}
                            {editingIngredient &&
                              editingDishIndex === dishIndex &&
                              editIngredientIndex === ingIndex && (
                                <View style={styles.inlineEditForm}>
                                  <View
                                    style={styles.quantityInputRow}
                                  >
                                    <TextInput
                                      style={styles.quantityInput}
                                      value={editIngredientQuantity}
                                      onChangeText={setEditIngredientQuantity}
                                      keyboardType="decimal-pad"
                                      placeholder="Enter quantity"
                                    />
                                    <Text style={styles.quantityUnit}>
                                      {editingIngredient.unit}
                                    </Text>
                                  </View>

                                  <View style={styles.editFormButtons}>
                                    <TouchableOpacity
                                      style={[
                                        styles.editFormButton,
                                        styles.cancelButton,
                                      ]}
                                      onPress={cancelIngredientEdit}
                                    >
                                      <Text style={styles.cancelButtonText}>
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.editFormButton,
                                        styles.updateButton,
                                      ]}
                                      onPress={handleSaveIngredientEdit}
                                    >
                                      <Text style={styles.updateButtonText}>
                                        Update
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: .2,
    borderBottomColor: COLORS.lightBluegrey3,
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for the save button
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.secondary,
    marginTop: 8,
  },
  dishItem: {
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dishCalories: {
    fontSize: 14,
    color: COLORS.orange,
    marginBottom: 8,
  },
  dishIngredients: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grey4,
    paddingTop: 8,
    marginTop: 8,
  },
  ingredientItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBluegrey3,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  ingredientNutrition: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  inlineEditForm: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.grey4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityInput: {
    flex: 0.7,
    borderWidth: 1,
    borderColor: COLORS.grey3,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.cardBackground,
  },
  quantityUnit: {
    flex: 0.3,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  editFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editFormButton: {
    flex: 0.48,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.cardBackground3,
    borderWidth: 1,
    borderColor: COLORS.grey4,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: COLORS.secondary,
  },
  updateButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  saveButton: {
    backgroundColor: COLORS.secondary,
    margin: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.cardBackground,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealEditScreen; 