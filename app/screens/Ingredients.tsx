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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../context/AppContext';
import { fetchNutritionForIngredient, extractNutritionFromLabel } from '../services/openai';
import { NutritionInfo } from '../../types';

const Ingredients: React.FC = () => {
  const { addCustomIngredient } = useContext(AppContext);
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

  const handleSaveIngredient = async () => {
    if (!name || !unit) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save ingredient');
    }
  };

  const pickImage = async () => {
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
    if (!imageUri) {
      Alert.alert('Error', 'Please upload a nutrition label image first');
      return;
    }

    setLabelLoading(true);
    try {
      const extractedNutrition = await extractNutritionFromLabel(imageUri);
      setNutrition(extractedNutrition);
      Alert.alert('Success', 'Nutrition data extracted from label');
    } catch (error) {
      Alert.alert('Error', 'Failed to extract nutrition data from label');
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Ingredient</Text>

      <View style={styles.formContainer}>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  labelSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 16,
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
    marginHorizontal: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  labelButton: {
    backgroundColor: '#5856D6',
  },
  fetchButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default Ingredients; 