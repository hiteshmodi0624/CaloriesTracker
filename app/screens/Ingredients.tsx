import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../context/AppContext';
import { fetchNutritionForIngredient, extractNutritionFromLabel } from '../services/openai';
import { NutritionInfo, Ingredient as IngredientType } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const Ingredients: React.FC = () => {
  const { addCustomIngredient, ingredients, deleteIngredient } = useContext(AppContext);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionInfo>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleFetchNutrition = async () => {
    if (!name || !unit) {
      Alert.alert('Error', 'Please enter ingredient name and unit');
      return;
    }

    setLoading(true);
    try {
      const nutritionData = await fetchNutritionForIngredient(name, unit, 100);
      setNutrition(nutritionData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nutrition information');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveIngredient = async () => {
    if (!name || !unit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('Saving ingredient:', { name, unit, nutrition });
      await addCustomIngredient({
        name,
        unit,
        nutrition,
      });
      Alert.alert('Success', 'Ingredient saved successfully');
      setName('');
      setUnit('');
      setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      setImageUri(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving ingredient:', error);
      Alert.alert('Error', 'Failed to save ingredient');
    }
  };

  const renderIngredientItem = ({ item }: { item: IngredientType }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <Text style={styles.ingredientUnit}>Unit: {item.unit}</Text>
        
        <View style={styles.nutritionOverview}>
          <Text style={styles.ingredientCalories}>{item.nutrition.calories} calories per {item.unit}</Text>
          <View style={styles.macroRow}>
            <Text style={styles.macroText}>P: {(item.nutrition.protein || 0).toFixed(1)}g</Text>
            <Text style={styles.macroText}>C: {(item.nutrition.carbs || 0).toFixed(1)}g</Text>
            <Text style={styles.macroText}>F: {(item.nutrition.fat || 0).toFixed(1)}g</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => {
          Alert.alert(
            "Delete Ingredient",
            `Are you sure you want to delete ${item.name}?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteIngredient(item.id) }
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingredients</Text>

      {!showAddForm ? (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>Add New Ingredient</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add New Ingredient</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Ingredient Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Unit (e.g., grams, cups)"
            value={unit}
            onChangeText={setUnit}
          />

          <View style={styles.labelSection}>
            <Text style={styles.sectionTitle}>Nutrition Label</Text>
            <Text style={styles.sectionDescription}>
              Upload a nutrition label image to automatically extract information
            </Text>

            <View style={styles.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                  <Text style={styles.imagePlaceholderText}>Tap to Upload Nutrition Label</Text>
                </TouchableOpacity>
              )}
            </View>

            {imageUri && (
              <TouchableOpacity
                style={[styles.button, styles.labelButton]}
                onPress={processNutritionLabel}
                disabled={labelLoading}
              >
                {labelLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Extract from Label</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.fetchButton]}
            onPress={handleFetchNutrition}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
            )}
          </TouchableOpacity>

          <View style={styles.nutritionContainer}>
            <Text style={styles.nutritionTitle}>Nutrition Information</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calories</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.calories.toString()}
                  onChangeText={(value) =>
                    setNutrition({ ...nutrition, calories: Number(value) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.protein?.toString()}
                  onChangeText={(value) =>
                    setNutrition({ ...nutrition, protein: Number(value) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.carbs?.toString()}
                  onChangeText={(value) =>
                    setNutrition({ ...nutrition, carbs: Number(value) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.nutritionInput}
                  value={nutrition.fat?.toString()}
                  onChangeText={(value) =>
                    setNutrition({ ...nutrition, fat: Number(value) || 0 })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveIngredient}>
            <Text style={styles.buttonText}>Save Ingredient</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {!showAddForm && (
        <FlatList
          data={ingredients}
          renderItem={renderIngredientItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved ingredients found</Text>
              <Text style={styles.emptySubtext}>Add your first ingredient to get started</Text>
            </View>
          }
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  ingredientItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  ingredientUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  ingredientCalories: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
    marginBottom: 5,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  labelSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imageContainer: {
    marginVertical: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  labelButton: {
    backgroundColor: '#5856D6',
  },
  fetchButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    paddingHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  nutritionContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  nutritionTitle: {
    fontSize: 18,
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
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  nutritionOverview: {
    marginTop: 5,
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
});

export default Ingredients; 