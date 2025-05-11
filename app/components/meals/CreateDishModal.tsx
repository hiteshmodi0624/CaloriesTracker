import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  FlatList
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
  onEditIngredientQuantity: (id: string, quantity: number) => void;
  onSaveDish: () => void;
  onSaveForReuse: () => void;
  onClose: () => void;
  activeTab: 'ingredients' | 'quickDish';
  onTabChange: (tab: 'ingredients' | 'quickDish') => void;
  quickDishName: string;
  onQuickDishNameChange: (name: string) => void;
  quickDishServings: string;
  onQuickDishServingsChange: (servings: string) => void;
  isAddingQuickDish: boolean;
  onAddQuickDish: () => void;
}

const CreateDishModal: React.FC<CreateDishModalProps> = ({
  visible,
  dishName,
  onDishNameChange,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onEditIngredientQuantity,
  onSaveDish,
  onSaveForReuse,
  onClose,
  activeTab,
  onTabChange,
  quickDishName,
  onQuickDishNameChange,
  quickDishServings,
  onQuickDishServingsChange,
  isAddingQuickDish,
  onAddQuickDish
}) => {
  // Calculate total calories
  const totalCalories = ingredients.reduce((sum, ing) => sum + ing.nutrition.calories, 0);
  
  // Handle ingredient quantity editing
  const handleEditQuantity = (id: string) => {
    const ingredient = ingredients.find(ing => ing.id === id);
    if (ingredient) {
      // You can implement a more sophisticated input handling here
      const newQuantity = parseFloat(prompt(`Enter new quantity for ${ingredient.name}`, ingredient.quantity.toString()) || '0');
      if (!isNaN(newQuantity) && newQuantity > 0) {
        onEditIngredientQuantity(id, newQuantity);
      }
    }
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
            <Text style={styles.modalTitle}>Create Dish</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
              onPress={() => onTabChange('ingredients')}
            >
              <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
                Ingredients
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'quickDish' && styles.activeTab]}
              onPress={() => onTabChange('quickDish')}
            >
              <Text style={[styles.tabText, activeTab === 'quickDish' && styles.activeTabText]}>
                Quick Add
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'ingredients' ? (
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
                  <Text style={styles.addIngredientButtonText}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>
              
              {ingredients.length > 0 ? (
                <ScrollView style={styles.ingredientsList}>
                  {ingredients.map(ingredient => (
                    <View key={ingredient.id} style={styles.ingredientItem}>
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientDetails}>
                          {ingredient.quantity} {ingredient.unit} • {ingredient.nutrition.calories.toFixed(0)} cal
                        </Text>
                      </View>
                      <View style={styles.ingredientActions}>
                        <TouchableOpacity 
                          style={styles.editQuantityButton}
                          onPress={() => handleEditQuantity(ingredient.id)}
                        >
                          <Ionicons name="create-outline" size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.removeIngredientButton}
                          onPress={() => onRemoveIngredient(ingredient.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
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
              
              {ingredients.length > 0 && (
                <View style={styles.totalCalories}>
                  <Text style={styles.totalCaloriesText}>
                    Total: {totalCalories.toFixed(0)} calories
                  </Text>
                </View>
              )}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.saveDishButton,
                    (!dishName || ingredients.length === 0) && styles.disabledButton
                  ]}
                  onPress={onSaveDish}
                  disabled={!dishName || ingredients.length === 0}
                >
                  <Text style={styles.saveDishButtonText}>Add to Meal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.saveForReuseButton,
                    (!dishName || ingredients.length === 0) && styles.disabledButton
                  ]}
                  onPress={onSaveForReuse}
                  disabled={!dishName || ingredients.length === 0}
                >
                  <Text style={styles.saveForReuseButtonText}>Save for Reuse</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.quickDishContainer}>
              <Text style={styles.inputLabel}>Dish Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g., Spaghetti Bolognese"
                value={quickDishName}
                onChangeText={onQuickDishNameChange}
              />
              
              <Text style={styles.inputLabel}>Number of Servings</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g., 1"
                value={quickDishServings}
                onChangeText={onQuickDishServingsChange}
                keyboardType="numeric"
              />
              
              <Text style={styles.quickDishInstructions}>
                Enter dish name and servings to automatically generate estimated ingredients and nutrition info
              </Text>
              
              <TouchableOpacity 
                style={[
                  styles.quickAddButton,
                  (!quickDishName || isAddingQuickDish) && styles.disabledButton
                ]}
                onPress={onAddQuickDish}
                disabled={!quickDishName || isAddingQuickDish}
              >
                {isAddingQuickDish ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.quickAddButtonText}>Analyze Dish</Text>
                )}
              </TouchableOpacity>
              
              <Text style={styles.quickDishNote}>
                Note: This will use AI to estimate ingredients and nutrition values based on the dish name
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addIngredientButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addIngredientButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  ingredientsList: {
    maxHeight: 200,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  ingredientDetails: {
    fontSize: 14,
    color: '#666',
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editQuantityButton: {
    padding: 5,
    marginRight: 5,
  },
  removeIngredientButton: {
    padding: 5,
  },
  emptyIngredientsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
  },
  emptyIngredientsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptyIngredientsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  totalCalories: {
    marginVertical: 15,
    alignItems: 'flex-end',
  },
  totalCaloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  saveDishButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  saveDishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveForReuseButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveForReuseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  quickDishContainer: {
    paddingTop: 10,
  },
  quickDishInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickAddButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  quickAddButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quickDishNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default CreateDishModal; 