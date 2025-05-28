import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Dish, MealIngredient, Ingredient } from '../../../types';
import { AppContext } from '../../context/AppContext';
import IngredientSelectionModal from './IngredientSelectionModal';
import QuantityModal from './QuantityModal';
import { fetchNutritionForDish, SimpleDishData } from '../../services/openai';
import { FynkoAIButton, FynkoTextInput } from '../common';
import { multiplyNutrition, roundToTwoDecimals } from '../../utils/nutrition';

interface SavedDishesModalProps {
  visible: boolean;
  dishes: Dish[];
  onSelectDish: (dish: Dish) => void;
  onClose: () => void;
}

type TabType = 'saved' | 'create' | 'quick';

const SavedDishesModal: React.FC<SavedDishesModalProps> = ({
  visible,
  dishes,
  onSelectDish,
  onClose
}) => {
  const { ingredients, saveDish } = useContext(AppContext);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('quick');
  
  // Create dish state
  const [newDishName, setNewDishName] = useState('');
  const [newDishIngredients, setNewDishIngredients] = useState<MealIngredient[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  
  // Quick add state
  const [quickDishName, setQuickDishName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickDishIngredients, setQuickDishIngredients] = useState<MealIngredient[]>([]);

  const resetCreateDishForm = () => {
    setNewDishName('');
    setNewDishIngredients([]);
  };

  const resetQuickAddForm = () => {
    setQuickDishName('');
    setQuickDishIngredients([]);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    resetCreateDishForm();
    resetQuickAddForm();
    setActiveTab('saved');
    onClose();
  };

  // Create dish functions
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

    setNewDishIngredients([...newDishIngredients, newIngredient]);
    setShowQuantityModal(false);
    setSelectedIngredient(null);
  };

  const handleRemoveIngredient = (id: string) => {
    setNewDishIngredients(newDishIngredients.filter(i => i.id !== id));
  };

  const handleCreateDish = async () => {
    if (!newDishName.trim() || newDishIngredients.length === 0) return;

    try {
      const totalCalories = roundToTwoDecimals(newDishIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0));
      
      const newDish: Dish = {
        id: Date.now().toString(),
        name: newDishName,
        ingredients: newDishIngredients,
        totalCalories,
      };

      await saveDish(newDish);
      onSelectDish(newDish);
      resetCreateDishForm();
      handleClose();
    } catch (error) {
      console.error('Error creating dish:', error);
    }
  };

  // Quick add functions
  const handleQuickAdd = async () => {
    if (!quickDishName.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const dishData = await fetchNutritionForDish(quickDishName, 1);
      
      // Create a single ingredient representing the entire dish with proper precision
      const dishIngredient: MealIngredient = {
        id: `quick_${Date.now()}`,
        ingredientId: `quick_${Date.now()}`,
        name: dishData.name,
        unit: 'serving',
        quantity: 1,
        nutrition: {
          calories: roundToTwoDecimals(dishData.calories),
          protein: roundToTwoDecimals(dishData.protein),
          carbs: roundToTwoDecimals(dishData.carbs),
          fat: roundToTwoDecimals(dishData.fat),
        },
      };

      setQuickDishIngredients([dishIngredient]);
    } catch (error) {
      console.error('Error analyzing dish:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveQuickDish = async () => {
    if (!quickDishName.trim() || quickDishIngredients.length === 0) return;

    try {
      const totalCalories = roundToTwoDecimals(quickDishIngredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0));
      
      const newDish: Dish = {
        id: Date.now().toString(),
        name: quickDishName,
        ingredients: quickDishIngredients,
        totalCalories,
      };

      await saveDish(newDish);
      onSelectDish(newDish);
      resetQuickAddForm();
      handleClose();
    } catch (error) {
      console.error('Error saving quick dish:', error);
    }
  };

  const renderSavedDishItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={styles.dishItem}
      onPress={() => {
        onSelectDish(item);
        handleClose();
      }}
    >
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{item.name}</Text>
        <Text style={styles.dishDetails}>
          {Math.round(item.totalCalories)} cal • {item.ingredients.length} ingredients
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey3} />
    </TouchableOpacity>
  );

  const renderIngredientItem = (ingredient: MealIngredient) => (
    <View key={ingredient.id} style={styles.ingredientItem}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{ingredient.name}</Text>
        <Text style={styles.ingredientDetails}>
          {ingredient.quantity} {ingredient.unit} • {Math.round(ingredient.nutrition.calories)} cal
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveIngredient(ingredient.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const totalCalories = (activeTab === 'create' ? newDishIngredients : quickDishIngredients)
    .reduce((sum, ing) => sum + ing.nutrition.calories, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Dish</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "quick" && styles.activeTab]}
              onPress={() => setActiveTab("quick")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "quick" && styles.activeTabText,
                ]}
              >
                Quick Add
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "create" && styles.activeTab]}
              onPress={() => setActiveTab("create")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "create" && styles.activeTabText,
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "saved" && styles.activeTab]}
              onPress={() => setActiveTab("saved")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "saved" && styles.activeTabText,
                ]}
              >
                Saved
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === "saved" && (
              <View style={styles.tabContent}>
                {dishes.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="restaurant-outline"
                      size={48}
                      color={COLORS.grey3}
                    />
                    <Text style={styles.emptyStateTitle}>
                      No saved dishes yet
                    </Text>
                    <Text style={styles.emptyStateText}>
                      Create your first dish using the "Create" or "Quick Add"
                      tabs
                    </Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {dishes.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dishItem}
                        onPress={() => {
                          onSelectDish(item);
                          handleClose();
                        }}
                      >
                        <View style={styles.dishInfo}>
                          <Text style={styles.dishName}>{item.name}</Text>
                          <Text style={styles.dishDetails}>
                            {Math.round(item.totalCalories)} cal •{" "}
                            {item.ingredients.length} ingredients
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={COLORS.grey3}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {activeTab === "create" && (
              <ScrollView
                style={styles.tabContent}
                showsVerticalScrollIndicator={false}
              >
                <FynkoTextInput
                  label="Dish Name"
                  placeholder="Enter dish name"
                  value={newDishName}
                  onChangeText={setNewDishName}
                  required={true}
                  leftIcon="restaurant-outline"
                />

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowIngredientModal(true)}
                  >
                    <Ionicons
                      name="add-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {newDishIngredients.length > 0 ? (
                  <>
                    {newDishIngredients.map(renderIngredientItem)}
                    <View style={styles.nutritionSummary}>
                      <Text style={styles.totalCaloriesText}>
                        Total: {Math.round(totalCalories)} calories
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyIngredients}>
                    <Text style={styles.emptyIngredientsText}>
                      No ingredients added yet
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!newDishName.trim() || newDishIngredients.length === 0) &&
                      styles.disabledButton,
                  ]}
                  onPress={handleCreateDish}
                  disabled={
                    !newDishName.trim() || newDishIngredients.length === 0
                  }
                >
                  <Text style={styles.createButtonText}>Create & Add Dish</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {activeTab === "quick" && (
              <ScrollView
                style={styles.tabContent}
                showsVerticalScrollIndicator={false}
              >
                <FynkoTextInput
                  label="Dish Name"
                  placeholder="e.g., Chicken Caesar Salad"
                  value={quickDishName}
                  onChangeText={setQuickDishName}
                  required={true}
                  leftIcon="sparkles"
                  helperText="Enter a dish name for AI analysis"
                />

                {quickDishIngredients.length === 0 ? (
                  <>
                    <Text style={styles.quickInstructions}>
                      Enter a dish name and we'll automatically generate
                      ingredients and nutrition information using AI.
                    </Text>

                    <FynkoAIButton
                      title="Analyze Dish"
                      onPress={handleQuickAdd}
                      loading={isAnalyzing}
                      disabled={!quickDishName.trim()}
                      icon="sparkles"
                    />

                    {isAnalyzing && (
                      <Text style={styles.analyzingText}>
                        Analyzing "{quickDishName}"...
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.nutritionCard}>
                      <Text style={styles.nutritionTitle}>
                        Generated Nutrition
                      </Text>
                      <Text style={styles.caloriesLarge}>
                        {Math.round(totalCalories)} calories
                      </Text>
                      <View style={styles.macrosRow}>
                        <Text style={styles.macroText}>
                          P:{" "}
                          {quickDishIngredients
                            .reduce(
                              (sum, ing) => sum + (ing.nutrition.protein || 0),
                              0
                            )
                            .toFixed(1)}
                          g
                        </Text>
                        <Text style={styles.macroText}>
                          C:{" "}
                          {quickDishIngredients
                            .reduce(
                              (sum, ing) => sum + (ing.nutrition.carbs || 0),
                              0
                            )
                            .toFixed(1)}
                          g
                        </Text>
                        <Text style={styles.macroText}>
                          F:{" "}
                          {quickDishIngredients
                            .reduce(
                              (sum, ing) => sum + (ing.nutrition.fat || 0),
                              0
                            )
                            .toFixed(1)}
                          g
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                      Generated Ingredients
                    </Text>
                    {quickDishIngredients.map(renderIngredientItem)}

                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={handleSaveQuickDish}
                    >
                      <Text style={styles.createButtonText}>
                        Save & Add Dish
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.aiNote}>
                      Note: Nutrition values are AI-generated estimates
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>

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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: "90%",
    flex: 1,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.cardBackground2,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingBottom: 20,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground2,
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
  dishDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBackground2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grey3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground2,
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
  removeButton: {
    padding: 8,
  },
  emptyIngredients: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.cardBackground2,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyIngredientsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  nutritionSummary: {
    alignItems: 'flex-end',
    marginVertical: 12,
  },
  totalCaloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.orange,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: COLORS.grey3,
  },
  quickInstructions: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  analyzingText: {
    fontSize: 14,
    color: COLORS.orange,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nutritionCard: {
    backgroundColor: COLORS.cardBackground2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  caloriesLarge: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  aiNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default SavedDishesModal; 