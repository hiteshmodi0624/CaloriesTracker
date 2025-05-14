import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  ActivityIndicator,
  Keyboard,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealIngredient } from '../../../types';

interface CreateDishModalProps {
  visible: boolean;
  dishName: string;
  onDishNameChange: (name: string) => void;
  ingredients: MealIngredient[];
  onAddIngredient: () => void;
  onRemoveIngredient: (id: string) => void;
  editCurrentDishIngredient: (id: string, quantity: number, nutrition: { calories: number; protein: number; carbs: number; fat: number; }) => void;
  editCurrentDishIngredients: (ingredients: MealIngredient[]) => void;
  onSaveDish: () => void;
  onClose: () => void;
  activeTab: 'ingredients' | 'quickDish';
  onTabChange: (tab: 'ingredients' | 'quickDish') => void;
  quickDishName: string;
  onQuickDishNameChange: (name: string) => void;
  quickDishServings: string;
  onQuickDishServingsChange: (servings: string) => void;
  isAddingQuickDish: boolean;
  onAddQuickDish: () => void;
  quickDishServingsMultiplier: number;
  onQuickDishServingsMultiplierChange: (multiplier: number) => void;
}

const CreateDishModal: React.FC<CreateDishModalProps> = ({
  visible,
  dishName,
  onDishNameChange,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  editCurrentDishIngredient,
  editCurrentDishIngredients,
  onSaveDish,
  onClose,
  activeTab,
  onTabChange,
  quickDishName,
  onQuickDishNameChange,
  quickDishServings,
  onQuickDishServingsChange,
  isAddingQuickDish,
  onAddQuickDish,
  quickDishServingsMultiplier,
  onQuickDishServingsMultiplierChange
}) => {
  // Local ingredients state for immediate UI updates
  const [localIngredients, setLocalIngredients] = useState<MealIngredient[]>([]);
  
  // Calculate total calories from localIngredients to ensure reactivity
  const totalCalories = localIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
  
  // Edit ingredient modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<MealIngredient | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [autoScaleNutrition, setAutoScaleNutrition] = useState(true);
  
  // Quick dish state
  const [originalIngredients, setOriginalIngredients] = useState<MealIngredient[]>([]);
  
  // Sync local ingredients with props
  useEffect(() => {
    setLocalIngredients(ingredients);
    
    // Store original ingredients when first loaded or when they change
    // This allows us to always scale from the original values
    if (ingredients.length > 0) {
      console.log("Storing original ingredients:", ingredients.length);
      setOriginalIngredients([...ingredients]);
    }
  }, [ingredients]);
  
  // Reset servings when ingredients change
  useEffect(() => {
    // If ingredients were just loaded through AI analysis,
    // reset the servings to "1" to avoid stale values
    if (ingredients.length > 0 && localIngredients.length === 0) {
      console.log("Resetting servings to 1");
      onQuickDishServingsChange("1");
    }
  }, [ingredients.length]);
  
  // Handle opening the edit ingredient modal
  const handleEditIngredient = (id: string) => {
    const ingredient = localIngredients.find(ing => ing.id === id);
    if (ingredient) {
      setSelectedIngredient(ingredient);
      setEditQuantity(ingredient.quantity.toString());
      setEditCalories(ingredient.nutrition.calories.toString());
      setEditProtein((ingredient.nutrition.protein || 0).toString());
      setEditCarbs((ingredient.nutrition.carbs || 0).toString());
      setEditFat((ingredient.nutrition.fat || 0).toString());
      setAutoScaleNutrition(true); // Reset to default (true)
      setEditModalVisible(true);
    }
  };
  
  // Handle quantity change with auto-scaling
  const handleQuantityChange = (value: string) => {
    setEditQuantity(value);
    
    if (autoScaleNutrition && selectedIngredient) {
      try {
        const newQuantity = parseFloat(value.replace(',', '.'));
        
        if (!isNaN(newQuantity) && newQuantity > 0) {
          // Calculate scale factor
          const scaleFactor = newQuantity / selectedIngredient.quantity;
          
          // Scale nutrition values
          setEditCalories((selectedIngredient.nutrition.calories * scaleFactor).toFixed(1));
          setEditProtein(((selectedIngredient.nutrition.protein || 0) * scaleFactor).toFixed(1));
          setEditCarbs(((selectedIngredient.nutrition.carbs || 0) * scaleFactor).toFixed(1)); 
          setEditFat(((selectedIngredient.nutrition.fat || 0) * scaleFactor).toFixed(1));
        }
      } catch (e) {
        // Silently fail if parsing fails
      }
    }
  };
  
  // Handle saving edited ingredient
  const handleSaveIngredientEdit = () => {
    if (!selectedIngredient) return;
    
    // Dismiss keyboard before saving
    Keyboard.dismiss();
    
    // Parse values
    const newQuantity = Number(editQuantity.replace(',', '.'));
    
    // Validate quantity
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    // Parse nutrition values
    const newCalories = Number(editCalories.replace(',', '.'));
    const newProtein = Number(editProtein.replace(',', '.'));
    const newCarbs = Number(editCarbs.replace(',', '.'));
    const newFat = Number(editFat.replace(',', '.'));
    
    // Validate calories
    if (isNaN(newCalories) || newCalories < 0) {
      alert('Please enter valid calorie value');
      return;
    }
    
    try {
      // Create nutrition object
      const nutritionUpdate = {
        calories: newCalories,
        protein: isNaN(newProtein) ? 0 : newProtein,
        carbs: isNaN(newCarbs) ? 0 : newCarbs,
        fat: isNaN(newFat) ? 0 : newFat,
      };
      
      // Update local state
      const updatedLocalIngredients = localIngredients.map(ing => {
        if (ing.id === selectedIngredient.id) {
          return {
            ...ing,
            quantity: newQuantity,
            nutrition: nutritionUpdate
          };
        }
        return ing;
      });
      
      // Update local state
      setLocalIngredients(updatedLocalIngredients);
      
      // Update parent state
      editCurrentDishIngredient(
        selectedIngredient.id,
        newQuantity,
        nutritionUpdate
      );
      
      // Close modal
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating ingredient:', error);
      alert('There was an error updating the ingredient. Please try again.');
    }
  };
  
  // Handle servings adjustment for quick dish
  const handleServingsChange = (newServings: string) => {
    // Update parent state
    onQuickDishServingsChange(newServings);

    // Parse the multiplier
    const multiplier = parseFloat(newServings) / quickDishServingsMultiplier;
    console.log(
      "Servings multiplier:",
      multiplier,
      quickDishServings,
      newServings,
      quickDishServingsMultiplier
    );

    // Validate multiplier
    if (isNaN(multiplier) || multiplier <= 0) return;

    // Update parent state
    onQuickDishServingsMultiplierChange(parseFloat(newServings));

    // Scale ingredients if we have original values
    if (originalIngredients.length > 0) {
      console.log(
        "Scaling ingredients. Original count:",
        originalIngredients.length
      );
      const updatedIngredients = originalIngredients.map((ing) => {
        const scaledQuantity = ing.quantity * multiplier;
        const scaledNutrition = {
          calories: ing.nutrition.calories * multiplier,
          protein: (ing.nutrition.protein || 0) * multiplier,
          carbs: (ing.nutrition.carbs || 0) * multiplier,
          fat: (ing.nutrition.fat || 0) * multiplier,
        };
        console.log(
          `Scaled ${ing.name}: ${ing.quantity} → ${scaledQuantity}, calories: ${ing.nutrition.calories} → ${scaledNutrition.calories}`
        );
        return {
          ...ing,
          quantity: scaledQuantity,
          nutrition: scaledNutrition,
        };
      });
      editCurrentDishIngredients(updatedIngredients);

      // Update local ingredients with a new array reference to ensure re-render
      setLocalIngredients(updatedIngredients);

      // Log total calories after scaling
      const newTotalCalories = updatedIngredients.reduce(
        (sum, ing) => sum + ing.nutrition.calories,
        0
      );
      console.log(`Total calories after scaling: ${newTotalCalories}`);
    }
  };

  // Render ingredient item
  const renderIngredientItem = (ingredient: MealIngredient) => (
    <View key={ingredient.id} style={styles.ingredientItem}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{ingredient.name}</Text>
        <Text style={styles.ingredientDetails}>
          {ingredient.quantity} {ingredient.unit} • {ingredient.nutrition.calories.toFixed(0)} cal
        </Text>
        <Text style={styles.macroText}>
          P: {(ingredient.nutrition.protein || 0).toFixed(1)}g • 
          C: {(ingredient.nutrition.carbs || 0).toFixed(1)}g • 
          F: {(ingredient.nutrition.fat || 0).toFixed(1)}g
        </Text>
      </View>
      <View style={styles.ingredientActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditIngredient(ingredient.id)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemoveIngredient(ingredient.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render edit ingredient modal
  const renderEditIngredientModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Edit Ingredient</Text>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={styles.editModalCloseButton}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {selectedIngredient && (
            <>
              <Text style={styles.editModalIngredientName}>
                {selectedIngredient.name}
              </Text>

              <View style={styles.quantitySection}>
                <Text style={styles.sectionTitle}>Quantity</Text>
                <Text style={styles.editModalLabel}>
                  Amount ({selectedIngredient.unit})
                </Text>
                <TextInput
                  style={styles.editModalInput}
                  value={editQuantity}
                  onChangeText={handleQuantityChange}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  enterKeyHint="done"
                />

                <View style={styles.autoScaleContainer}>
                  <Text style={styles.autoScaleLabel}>
                    Automatically scale nutrition values
                  </Text>
                  <Switch
                    value={autoScaleNutrition}
                    onValueChange={setAutoScaleNutrition}
                    trackColor={{ false: "#eee", true: "#cce5ff" }}
                    thumbColor={autoScaleNutrition ? "#007AFF" : "#ccc"}
                    ios_backgroundColor="#eee"
                  />
                </View>
              </View>

              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>
                  Nutrition Information (
                  {`${editQuantity}${selectedIngredient.unit}`})
                </Text>

                <Text style={styles.editModalLabel}>Calories</Text>
                <TextInput
                  style={[
                    styles.editModalInput,
                    autoScaleNutrition && styles.editModalInputDisabled,
                  ]}
                  value={editCalories}
                  onChangeText={setEditCalories}
                  keyboardType="numeric"
                  placeholder="Enter calories"
                  enterKeyHint="done"
                  editable={!autoScaleNutrition}
                />

                <Text style={styles.editModalLabel}>Protein (g)</Text>
                <TextInput
                  style={[
                    styles.editModalInput,
                    autoScaleNutrition && styles.editModalInputDisabled,
                  ]}
                  value={editProtein}
                  onChangeText={setEditProtein}
                  keyboardType="numeric"
                  placeholder="Enter protein in grams"
                  enterKeyHint="done"
                  editable={!autoScaleNutrition}
                />

                <Text style={styles.editModalLabel}>Carbs (g)</Text>
                <TextInput
                  style={[
                    styles.editModalInput,
                    autoScaleNutrition && styles.editModalInputDisabled,
                  ]}
                  value={editCarbs}
                  onChangeText={setEditCarbs}
                  keyboardType="numeric"
                  placeholder="Enter carbs in grams"
                  enterKeyHint="done"
                  editable={!autoScaleNutrition}
                />

                <Text style={styles.editModalLabel}>Fat (g)</Text>
                <TextInput
                  style={[
                    styles.editModalInput,
                    autoScaleNutrition && styles.editModalInputDisabled,
                  ]}
                  value={editFat}
                  onChangeText={setEditFat}
                  keyboardType="numeric"
                  placeholder="Enter fat in grams"
                  enterKeyHint="done"
                  editable={!autoScaleNutrition}
                />
              </View>

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={styles.editModalCancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.editModalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editModalSaveButton}
                  onPress={handleSaveIngredientEdit}
                >
                  <Text style={styles.editModalSaveButtonText}>
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Dish</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "ingredients" && styles.activeTab,
              ]}
              onPress={() => onTabChange("ingredients")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ingredients" && styles.activeTabText,
                ]}
              >
                Ingredients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "quickDish" && styles.activeTab,
              ]}
              onPress={() => onTabChange("quickDish")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "quickDish" && styles.activeTabText,
                ]}
              >
                Quick Add
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content - Simple ScrollView */}
          <ScrollView style={styles.scrollContainer}>
            {activeTab === "ingredients" ? (
              // Ingredients Tab Content
              <>
                <Text style={styles.inputLabel}>Dish Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter dish name"
                  value={dishName}
                  onChangeText={onDishNameChange}
                />

                <View style={styles.ingredientsHeader}>
                  <Text style={styles.ingredientsTitle}>Ingredients</Text>
                  <TouchableOpacity
                    style={styles.addIngredientButton}
                    onPress={onAddIngredient}
                  >
                    <Text style={styles.addIngredientButtonText}>
                      Add Ingredient
                    </Text>
                  </TouchableOpacity>
                </View>

                {localIngredients.length > 0 ? (
                  <>
                    {/* Ingredients list */}
                    {localIngredients.map((ingredient) =>
                      renderIngredientItem(ingredient)
                    )}

                    <View style={styles.totalCalories}>
                      <Text style={styles.totalCaloriesText}>
                        Total: {totalCalories.toFixed(0)} calories
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyIngredientsContainer}>
                    <Text style={styles.emptyIngredientsText}>
                      No ingredients added yet
                    </Text>
                    <Text style={styles.emptyIngredientsSubtext}>
                      Add ingredients using the "Add Ingredient" button
                    </Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.saveDishButton,
                      (!dishName || localIngredients.length === 0) &&
                        styles.disabledButton,
                    ]}
                    onPress={onSaveDish}
                    disabled={!dishName || localIngredients.length === 0}
                  >
                    <Text style={styles.saveDishButtonText}>Add to Meal</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.buttonHelpText}>
                  "Add to Meal" adds this dish to your current meal{"\n"}
                </Text>
              </>
            ) : (
              // Quick Add Tab Content
              <View style={styles.quickDishContainer}>
                <View>
                  <Text style={styles.inputLabel}>Dish Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Spaghetti Bolognese"
                    value={quickDishName}
                    onChangeText={onQuickDishNameChange}
                  />

                  {localIngredients.length === 0 ? (
                    // No ingredients yet - show analyze button
                    <>
                      <Text style={styles.quickDishInstructions}>
                        Enter the dish name and press "Analyze Dish" to
                        automatically generate estimated ingredients and
                        nutrition information
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.quickAddButton,
                          (!quickDishName || isAddingQuickDish) &&
                            styles.disabledButton,
                        ]}
                        onPress={onAddQuickDish}
                        disabled={!quickDishName || isAddingQuickDish}
                      >
                        {isAddingQuickDish ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.quickAddButtonText}>
                            Analyze Dish
                          </Text>
                        )}
                      </TouchableOpacity>

                      {isAddingQuickDish && (
                        <Text style={styles.processingText}>
                          Analyzing "{quickDishName}"... Once complete,
                          ingredients will be added automatically.
                        </Text>
                      )}
                    </>
                  ) : (
                    // Ingredients generated
                    <>
                      {/* Nutrition Summary Card */}
                      <View style={styles.nutritionSummaryCard}>
                        <Text style={styles.nutritionSummaryTitle}>
                          Total Nutrition
                        </Text>
                        <Text style={styles.totalCaloriesLarge}>
                          {totalCalories.toFixed(0)} calories
                        </Text>

                        <View style={styles.macroSummaryContainer}>
                          <View style={styles.macroSummaryItem}>
                            <Text style={styles.macroSummaryValue}>
                              {localIngredients
                                .reduce(
                                  (sum, ing) =>
                                    sum + (ing.nutrition.protein || 0),
                                  0
                                )
                                .toFixed(1)}
                              g
                            </Text>
                            <Text style={styles.macroSummaryLabel}>
                              Protein
                            </Text>
                          </View>

                          <View style={styles.macroSummaryItem}>
                            <Text style={styles.macroSummaryValue}>
                              {localIngredients
                                .reduce(
                                  (sum, ing) =>
                                    sum + (ing.nutrition.carbs || 0),
                                  0
                                )
                                .toFixed(1)}
                              g
                            </Text>
                            <Text style={styles.macroSummaryLabel}>Carbs</Text>
                          </View>

                          <View style={styles.macroSummaryItem}>
                            <Text style={styles.macroSummaryValue}>
                              {localIngredients
                                .reduce(
                                  (sum, ing) => sum + (ing.nutrition.fat || 0),
                                  0
                                )
                                .toFixed(1)}
                              g
                            </Text>
                            <Text style={styles.macroSummaryLabel}>Fat</Text>
                          </View>
                        </View>
                      </View>

                      {/* Servings Adjustment */}
                      <View style={styles.servingsContainer}>
                        <Text style={styles.sectionTitle}>Serving Size</Text>

                        <View style={styles.servingsControlRow}>
                          <TouchableOpacity
                            style={styles.servingsButton}
                            onPress={() => {
                              const currentValue =
                                parseFloat(quickDishServings);
                              if (!isNaN(currentValue) && currentValue > 1) {
                                handleServingsChange(
                                  (currentValue - 0.5).toString()
                                );
                              }
                            }}
                            disabled={parseFloat(quickDishServings) <= 1}
                          >
                            <Ionicons
                              name="remove"
                              size={18}
                              color={
                                parseFloat(quickDishServings) <= 1
                                  ? "#ccc"
                                  : "#007AFF"
                              }
                            />
                          </TouchableOpacity>

                          <TextInput
                            style={styles.servingsInput}
                            placeholder="1"
                            value={quickDishServings}
                            onChangeText={handleServingsChange}
                            keyboardType="numeric"
                            enterKeyHint="done"
                          />

                          <TouchableOpacity
                            style={styles.servingsButton}
                            onPress={() => {
                              const currentValue =
                                parseFloat(quickDishServings);
                              if (!isNaN(currentValue)) {
                                handleServingsChange(
                                  (currentValue + 0.5).toString()
                                );
                              } else {
                                handleServingsChange("1.5");
                              }
                            }}
                          >
                            <Ionicons name="add" size={18} color="#007AFF" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.servingsHelp}>
                          Adjust servings to scale ingredients and nutrition
                          values
                        </Text>
                      </View>

                      {/* Ingredients List */}
                      <View style={styles.ingredientsSection}>
                        <Text style={styles.sectionTitle}>
                          Generated Ingredients
                        </Text>
                        <Text style={styles.ingredientCount}>
                          {localIngredients.length}{" "}
                          {localIngredients.length === 1
                            ? "ingredient"
                            : "ingredients"}
                        </Text>

                        {/* Simple list of ingredients */}
                        {localIngredients.map((ingredient) =>
                          renderIngredientItem(ingredient)
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.saveDishButton,
                            !quickDishName && styles.disabledButton,
                          ]}
                          onPress={onSaveDish}
                          disabled={!quickDishName}
                        >
                          <Text style={styles.saveDishButtonText}>
                            Add to Meal
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
                <Text style={styles.quickDishNote}>
                  Note: This uses AI to estimate ingredients and nutrition
                  values
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Edit Ingredient Modal */}
      {renderEditIngredientModal()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Main modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    minHeight: 520,
    maxHeight: "90%",
    width: "100%",
    flexDirection: "column",
  },
  scrollContainer: {
    flex: 1,
  },

  // Modal header styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },

  // Tab styles
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },

  // Input styles
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "white",
  },

  // Ingredients list styles
  ingredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addIngredientButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addIngredientButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
    color: "#666",
  },
  ingredientActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  removeButton: {
    padding: 5,
  },
  emptyIngredientsContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 15,
  },
  emptyIngredientsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 5,
  },
  emptyIngredientsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },

  // Total calories and buttons
  totalCalories: {
    marginVertical: 15,
    alignItems: "flex-end",
  },
  totalCaloriesText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveDishButton: {
    flex: 1,
    backgroundColor: "#34C759",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  saveDishButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveForReuseButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  saveForReuseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonHelpText: {
    marginTop: 10,
    fontSize: 12,
    color: "#8898aa",
    textAlign: "center",
  },

  // Quick dish styles
  quickDishContainer: {
    paddingTop: 10,
    minHeight: 370,
    justifyContent: "center",
  },
  quickDishInstructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  quickAddButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  quickAddButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  quickDishNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  processingText: {
    marginTop: 15,
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Nutrition summary card
  nutritionSummaryCard: {
    backgroundColor: "#f8f9fe",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
  },
  nutritionSummaryTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  totalCaloriesLarge: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9500",
    marginBottom: 12,
  },
  macroSummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 5,
  },
  macroSummaryItem: {
    alignItems: "center",
  },
  macroSummaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  macroSummaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // Servings controls
  servingsContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  servingsControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f8f9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  servingsInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
    fontSize: 16,
    width: 60,
    marginHorizontal: 10,
  },
  servingsHelp: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Ingredients section
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientCount: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    fontStyle: "italic",
  },

  // Edit modal styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editModalCloseButton: {
    padding: 5,
  },
  editModalIngredientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 15,
  },
  quantitySection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  nutritionSection: {
    marginBottom: 15,
  },
  editModalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  editModalInputDisabled: {
    backgroundColor: "#f9f9f9",
    color: "#666",
  },
  editModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editModalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    marginRight: 8,
    alignItems: "center",
  },
  editModalCancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  editModalSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    marginLeft: 8,
    alignItems: "center",
  },
  editModalSaveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  macroText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // Auto-scale toggle
  autoScaleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 5,
  },
  autoScaleLabel: {
    fontSize: 14,
    color: "#333",
  },
});

export default CreateDishModal; 