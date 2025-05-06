import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import { MealIngredient } from '../../types';
import { fetchNutritionForIngredient } from '../services/openai';

const CreateMeal: React.FC = () => {
  const { addMeal, ingredients } = useContext(AppContext);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);

  const handleAddIngredient = async () => {
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
      setMealIngredients([...mealIngredients, newIngredient]);
      setIngredientName('');
      setIngredientUnit('');
      setIngredientQuantity('');
    } catch (error) {
      console.error('Error adding ingredient:', error);
      Alert.alert('Error', `Failed to fetch nutrition information: ${error}`);
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
      setName('');
      setDate(new Date());
      setMealIngredients([]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', `Failed to save meal: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Meal</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Meal Name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text>Date: {date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <View style={styles.ingredientForm}>
        <Text style={styles.subtitle}>Add Ingredients</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={ingredientQuantity}
          onChangeText={setIngredientQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleAddIngredient}>
          <Text style={styles.buttonText}>Add Ingredient</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ingredientsList}>
        <Text style={styles.subtitle}>Added Ingredients:</Text>
        {mealIngredients.map((ing) => (
          <Text key={ing.id} style={styles.ingredientText}>
            {ing.name} - {ing.quantity} {ing.unit} ({ing.nutrition.calories} cal)
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
        <Text style={styles.buttonText}>Save Meal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 20,
  },
  ingredientForm: {
    marginBottom: 20,
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
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientsList: {
    marginTop: 20,
  },
  ingredientText: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default CreateMeal; 