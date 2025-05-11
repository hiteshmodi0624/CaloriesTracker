import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient, NutritionInfo } from '../../../types';
import * as ImagePicker from 'expo-image-picker';
import { fetchNutritionForIngredient, extractNutritionFromLabel } from '../../services/openai';

interface AddCustomIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
}

const UNITS = [
  'grams',
  'ml',
  'oz',
  'cup',
  'tablespoon',
  'teaspoon',
  'slice',
  'piece',
  'serving'
];

const AddCustomIngredientModal: React.FC<AddCustomIngredientModalProps> = ({
  visible,
  onClose,
  onAddIngredient
}) => {
  // Form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('serving');
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionInfo>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Reset form fields
  const resetForm = () => {
    setName('');
    setUnit('serving');
    setNutrition({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    setImageUri(null);
    setSubmitAttempted(false);
  };

  // Validation
  const isNameValid = name.trim().length > 0;
  const isCaloriesValid = nutrition.calories > 0;
  const isFormValid = isNameValid && isCaloriesValid;

  // Get base quantity for unit
  const getBaseQuantityForUnit = (unit: string): number => {
    // Weight-based units use 100 as standard
    if (["grams", "oz", "ml"].includes(unit.toLowerCase())) {
      return 100;
    }
    // Volume and count-based units use 1 as standard
    return 1;
  };

  // Image picker function
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

  // Process nutrition label from image
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

  // Fetch nutrition data automatically
  const handleFetchNutrition = async () => {
    if (!name || !unit) {
      Alert.alert('Error', 'Please enter ingredient name and unit');
      return;
    }

    setLoading(true);
    try {
      const baseQuantity = getBaseQuantityForUnit(unit);
      const nutritionData = await fetchNutritionForIngredient(name, unit, baseQuantity);
      setNutrition(nutritionData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch nutrition information');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    
    // Validate required fields
    if (!isFormValid) {
      if (!isNameValid) {
        Alert.alert('Error', 'Ingredient name is required');
        return;
      }
      
      if (!isCaloriesValid) {
        Alert.alert('Error', 'Please provide valid nutrition information');
        return;
      }
      
      return;
    }

    setLoading(true);
    
    try {
      // Create sanitized nutrition info with no undefined values
      const sanitizedNutrition: NutritionInfo = {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0
      };

      // Create ingredient
      const newIngredient = {
        name: name.trim(),
        unit,
        nutrition: sanitizedNutrition
      };

      // Add the ingredient
      await onAddIngredient(newIngredient);
      
      // Success
      Alert.alert(
        'Success',
        `${name.trim()} has been added to your custom ingredients`,
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
      Alert.alert('Error', 'Failed to add ingredient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Ingredient</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.sectionDescription}>
              Create a new reusable ingredient with nutrition information
            </Text>

            <Text style={styles.inputLabel}>Ingredient Name*</Text>
            <TextInput
              style={[
                styles.input,
                submitAttempted && !isNameValid && styles.inputError
              ]}
              placeholder="e.g., Homemade Bread, Chicken Breast"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            {submitAttempted && !isNameValid && (
              <Text style={styles.errorText}>Please enter an ingredient name</Text>
            )}

            <Text style={styles.inputLabel}>Unit of Measurement*</Text>
            <TouchableOpacity 
              style={styles.unitSelector}
              onPress={() => setShowUnitSelector(!showUnitSelector)}
            >
              <Text style={styles.unitSelectorText}>{unit}</Text>
              <Ionicons name={showUnitSelector ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>

            {showUnitSelector && (
              <View style={styles.unitListContainer}>
                <ScrollView style={styles.unitList} nestedScrollEnabled={true}>
                  {UNITS.map((unitOption) => (
                    <TouchableOpacity
                      key={unitOption}
                      style={[
                        styles.unitOption,
                        unit === unitOption && styles.selectedUnitOption
                      ]}
                      onPress={() => {
                        setUnit(unitOption);
                        setShowUnitSelector(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.unitOptionText,
                          unit === unitOption && styles.selectedUnitOptionText
                        ]}
                      >
                        {unitOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.labelSection}>
              <Text style={styles.sectionTitle}>Nutrition Information</Text>
              <Text style={styles.sectionDescription}>
                Get nutrition information either by uploading a label image or fetching data
              </Text>

              <View style={styles.imageContainer}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                  <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
                    <Ionicons name="image-outline" size={40} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to select nutrition label image</Text>
                  </TouchableOpacity>
                )}
              </View>

              {imageUri && (
                <TouchableOpacity 
                  style={[styles.button, styles.labelButton, labelLoading && styles.disabledButton]} 
                  onPress={processNutritionLabel}
                  disabled={labelLoading}
                >
                  {labelLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Process Nutrition Label</Text>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.fetchButton, loading && styles.disabledButton]} 
                onPress={handleFetchNutrition}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View style={styles.buttonRow}>
                    <Ionicons name="nutrition-outline" size={18} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.nutritionContainer}>
              <Text style={styles.nutritionTitle}>
                Nutrition Information (per {unit ? `${getBaseQuantityForUnit(unit)} ${unit}` : 'serving'})
              </Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Calories*</Text>
                  <TextInput
                    style={[
                      styles.nutritionInput,
                      submitAttempted && !isCaloriesValid && styles.inputError
                    ]}
                    keyboardType="numeric"
                    value={nutrition.calories.toString()}
                    onChangeText={(text) => setNutrition({...nutrition, calories: parseFloat(text) || 0})}
                  />
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.nutritionInput}
                    keyboardType="numeric"
                    value={nutrition.protein?.toString() || '0'}
                    onChangeText={(text) => setNutrition({...nutrition, protein: parseFloat(text) || 0})}
                  />
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.nutritionInput}
                    keyboardType="numeric"
                    value={nutrition.carbs?.toString() || '0'}
                    onChangeText={(text) => setNutrition({...nutrition, carbs: parseFloat(text) || 0})}
                  />
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.nutritionInput}
                    keyboardType="numeric"
                    value={nutrition.fat?.toString() || '0'}
                    onChangeText={(text) => setNutrition({...nutrition, fat: parseFloat(text) || 0})}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.requiredFieldsNote}>* Required fields</Text>
          </ScrollView>

          <TouchableOpacity 
            style={[
              styles.addButton,
              (!isFormValid || loading) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Add Ingredient</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  closeButton: {
    padding: 5,
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  unitSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  unitSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  unitListContainer: {
    position: 'relative',
    zIndex: 1000,
    elevation: 5,
    marginBottom: 15,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unitList: {
    maxHeight: 200,
  },
  unitOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUnitOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  unitOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedUnitOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  labelSection: {
    marginTop: 15,
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    padding: 10,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelButton: {
    backgroundColor: '#FF9500',
  },
  fetchButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    color: '#666',
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  nutritionContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  nutritionTitle: {
    fontSize: 16,
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
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
  },
  requiredFieldsNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default AddCustomIngredientModal; 