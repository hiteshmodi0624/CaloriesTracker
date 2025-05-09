import React, { useState, useContext, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import { MealIngredient, Ingredient } from '../../types';
import { fetchNutritionForIngredient } from '../services/openai';
import { Ionicons } from '@expo/vector-icons';

const CreateMeal: React.FC = () => {
  const { addMeal, ingredients } = useContext(AppContext);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  const [showCustomIngredients, setShowCustomIngredients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
  }, [mealIngredients]);

  const handleAddNewIngredient = async () => {
    if (!ingredientName || !ingredientUnit || !ingredientQuantity) {
      Alert.alert('Error', 'Please fill in all ingredient fields');
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity)) {
      Alert.alert('Error', 'Please enter a valid quantity');
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
      
      // Confirm to the user
      Alert.alert('Success', 'Ingredient added successfully');
    } catch (error) {
      console.error('Error fetching nutrition:', error);
      Alert.alert('Error', 'Failed to fetch nutrition information');
    }
  };

  const onSelectIngredient = (ingredient: Ingredient) => {
    if (!ingredientQuantity) {
      Alert.alert('Error', 'Please enter a quantity first');
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity)) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    // Scale nutrition based on quantity
    const scaleFactor = quantity / 100; // Assuming custom ingredients are stored per 100 units
    const scaledNutrition = {
      calories: ingredient.nutrition.calories * scaleFactor,
      protein: ingredient.nutrition.protein ? ingredient.nutrition.protein * scaleFactor : 0,
      carbs: ingredient.nutrition.carbs ? ingredient.nutrition.carbs * scaleFactor : 0,
      fat: ingredient.nutrition.fat ? ingredient.nutrition.fat * scaleFactor : 0,
    };

    const newIngredient: MealIngredient = {
      id: Date.now().toString(),
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      quantity,
      nutrition: scaledNutrition,
    };

    // Add the new ingredient
    const updatedIngredients = [...mealIngredients, newIngredient];
    setMealIngredients(updatedIngredients);
    
    // Clear the quantity field and close the modal
    setIngredientQuantity('');
    setShowCustomIngredients(false);
    
    // Confirm to the user
    Alert.alert('Success', `Added ${ingredient.name} to your meal`);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSaveMeal = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (mealIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    try {
      await addMeal({
        name,
        date: date.toISOString().split('T')[0],
        ingredients: mealIngredients,
      });
      
      Alert.alert('Success', 'Meal saved successfully');
      
      // Reset the form
      setName('');
      setDate(new Date());
      setMealIngredients([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Meal</Text>

      {/* Meal Basic Info */}
      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Meal Name"
          value={name}
          onChangeText={setName}
        />

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
      </View>

      {/* Nutrition Summary */}
      {mealIngredients.length > 0 && (
        <View style={styles.nutritionSummary}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
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
        
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              value={ingredientQuantity}
              onChangeText={setIngredientQuantity}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => {
              if (!ingredientQuantity) {
                Alert.alert('Error', 'Please enter a quantity first');
                return;
              }
              setShowCustomIngredients(true);
            }}
          >
            <Text style={styles.selectButtonText}>Select Saved Ingredient</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.orText}>OR ADD NEW INGREDIENT</Text>
        
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
        <TouchableOpacity 
          style={[
            styles.button, 
            (!ingredientName || !ingredientUnit || !ingredientQuantity) && styles.disabledButton
          ]} 
          onPress={handleAddNewIngredient}
          disabled={!ingredientName || !ingredientUnit || !ingredientQuantity}
        >
          <Text style={styles.buttonText}>Add New Ingredient</Text>
        </TouchableOpacity>
      </View>

      {/* Added Ingredients List */}
      <View style={styles.ingredientsList}>
        <Text style={styles.sectionTitle}>Added Ingredients</Text>
        {mealIngredients.length === 0 ? (
          <Text style={styles.emptyText}>No ingredients added yet</Text>
        ) : (
          mealIngredients.map((ingredient) => (
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
          ))
        )}
      </View>

      {/* Save Meal Button */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          (!name || mealIngredients.length === 0) && styles.disabledButton
        ]} 
        onPress={handleSaveMeal}
        disabled={!name || mealIngredients.length === 0}
      >
        <Text style={styles.buttonText}>Save Meal</Text>
      </TouchableOpacity>

      {/* Modal for selecting custom ingredients */}
      <Modal
        visible={showCustomIngredients}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ingredient</Text>
              <TouchableOpacity onPress={() => setShowCustomIngredients(false)}>
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
                <Text style={styles.emptySubtext}>Add ingredients in the Ingredients tab first</Text>
              </View>
            ) : (
              <FlatList
                data={filteredIngredients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.selectableIngredient}
                    onPress={() => onSelectIngredient(item)}
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
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No matching ingredients found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  selectButtonText: {
    color: '#007AFF',
    marginRight: 5,
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 15,
    fontWeight: 'bold',
  },
  dateButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 15,
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  macroDetails: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientCalories: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 4,
  },
  ingredientNutrition: {
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
  },
  selectableIngredient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addButtonContainer: {
    padding: 10,
  },
  removeButton: {
    padding: 5,
  }
});

export default CreateMeal; 