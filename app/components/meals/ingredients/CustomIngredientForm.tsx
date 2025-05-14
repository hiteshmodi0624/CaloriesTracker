import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image,
  ActivityIndicator,
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NutritionInfo } from '../../../../types';

// Constants for styles
const { width } = Dimensions.get('window');
const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primary: '#007AFF',
  grey1: '#6E6E6E',
  grey2: '#AEAEB2',
  grey3: '#C7C7CC',
  grey5: '#E5E5EA',
  overlay: 'rgba(0, 0, 0, 0.5)',
  background: '#F2F2F7',
  error: '#FF3B30',
  success: '#34C759',
};

const UNITS = ['g', 'ml', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'piece', 'serving'];

interface CustomIngredientFormProps {
  name: string;
  setName: (name: string) => void;
  unit: string;
  setUnit: (unit: string) => void;
  showUnitSelector: boolean;
  setShowUnitSelector: (show: boolean) => void;
  nutrition: NutritionInfo;
  setNutrition: (nutrition: NutritionInfo) => void;
  customLoading: boolean;
  setCustomLoading?: (loading: boolean) => void;
  submitAttempted: boolean;
  setSubmitAttempted: (attempted: boolean) => void;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  isNameValid: boolean;
  isCaloriesValid: boolean;
  isFormValid: boolean;
  pickImage: () => Promise<void>;
  processNutritionLabel: () => Promise<void>;
  handleFetchNutrition: () => Promise<void>;
  handleAddCustomIngredient: () => void;
  handleCloseCustomForm: () => void;
  getBaseQuantityForSelectedUnit: (unit: string) => number;
}

const CustomIngredientForm: React.FC<CustomIngredientFormProps> = ({
  name,
  setName,
  unit,
  setUnit,
  showUnitSelector,
  setShowUnitSelector,
  nutrition,
  setNutrition,
  customLoading,
  setCustomLoading,
  submitAttempted,
  setSubmitAttempted,
  imageUri,
  setImageUri,
  isNameValid,
  isCaloriesValid,
  isFormValid,
  pickImage,
  processNutritionLabel,
  handleFetchNutrition,
  handleAddCustomIngredient,
  handleCloseCustomForm,
  getBaseQuantityForSelectedUnit
}) => {
  return (
    <View style={styles.customFormContainer}>
      {/* Header */}
      <View style={styles.customFormHeader}>
        <TouchableOpacity onPress={handleCloseCustomForm}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.customFormTitle}>Add Custom Ingredient</Text>
        <View style={{width: 24}} />
      </View>
      
      {/* Form Content */}
      <ScrollView 
        style={styles.customFormScroll}
        contentContainerStyle={styles.customFormContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.customFormDescription}>
          Create a new ingredient with complete nutrition information
        </Text>
        
        {/* Basic Info Section */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Basic Information</Text>
          
          <Text style={styles.inputLabel}>Ingredient Name*</Text>
          <View style={[
            styles.inputContainer,
            submitAttempted && !isNameValid && styles.inputError
          ]}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Homemade Bread"
              placeholderTextColor={COLORS.grey2}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            {name.length > 0 && (
              <TouchableOpacity onPress={() => setName('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.grey1} />
              </TouchableOpacity>
            )}
          </View>
          {submitAttempted && !isNameValid && (
            <Text style={styles.errorText}>Please enter an ingredient name</Text>
          )}
          
          <Text style={styles.inputLabel}>Unit of Measurement*</Text>
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowUnitSelector(!showUnitSelector)}
          >
            <Text style={styles.unitSelectorText}>{unit}</Text>
            <Ionicons 
              name={showUnitSelector ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={COLORS.grey1} 
            />
          </TouchableOpacity>
          
          {showUnitSelector && (
            <View style={styles.unitDropdown}>
              {UNITS.map(u => (
                <TouchableOpacity 
                  key={u} 
                  style={[
                    styles.unitOption,
                    unit === u && styles.unitOptionSelected
                  ]}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitSelector(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.unitOptionText,
                      unit === u && styles.unitOptionTextSelected
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Nutrition Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.formSectionTitle}>Nutrition Information</Text>
            <Text style={styles.formSectionSubtitle}>
              Per {getBaseQuantityForSelectedUnit(unit)} {unit}
            </Text>
          </View>
          
          {/* Image Upload Section */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imagePlaceholder} 
                onPress={pickImage}
              >
                <View style={styles.imageIconContainer}>
                  <Ionicons name="camera-outline" size={28} color={COLORS.grey1} />
                  <Ionicons name="image-outline" size={28} color={COLORS.grey1} style={{marginLeft: 24}} />
                </View>
                <Text style={styles.imagePlaceholderText}>
                  Tap to take a photo or select from gallery
                </Text>
              </TouchableOpacity>
            )}

            {imageUri && (
              <TouchableOpacity 
                style={styles.processButton}
                onPress={processNutritionLabel}
                disabled={customLoading}
              >
                {customLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="scan-outline" size={18} color={COLORS.white} style={{marginRight: 8}} />
                    <Text style={styles.buttonText}>Process Nutrition Label</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Fetch Nutrition Button */}
          <TouchableOpacity 
            style={styles.fetchButton}
            onPress={handleFetchNutrition}
            disabled={customLoading || !name}
          >
            {customLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="nutrition-outline" size={18} color={COLORS.white} style={{marginRight: 8}} />
                <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Nutrition Input Fields */}
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Calories*</Text>
              <TextInput
                style={[
                  styles.nutritionInput,
                  submitAttempted && !isCaloriesValid && styles.inputError
                ]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.grey2}
                value={nutrition.calories.toString()}
                onChangeText={text => {
                  const value = text.trim() === '' ? 0 : parseFloat(text);
                  setNutrition({...nutrition, calories: isNaN(value) ? 0 : value});
                }}
              />
              {submitAttempted && !isCaloriesValid && (
                <Text style={styles.errorText}>Required</Text>
              )}
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.nutritionInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.grey2}
                value={nutrition.protein?.toString() || ''}
                onChangeText={text => {
                  const value = text.trim() === '' ? 0 : parseFloat(text);
                  setNutrition({...nutrition, protein: isNaN(value) ? 0 : value});
                }}
              />
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.nutritionInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.grey2}
                value={nutrition.carbs?.toString() || ''}
                onChangeText={text => {
                  const value = text.trim() === '' ? 0 : parseFloat(text);
                  setNutrition({...nutrition, carbs: isNaN(value) ? 0 : value});
                }}
              />
            </View>
            
            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.nutritionInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.grey2}
                value={nutrition.fat?.toString() || ''}
                onChangeText={text => {
                  const value = text.trim() === '' ? 0 : parseFloat(text);
                  setNutrition({...nutrition, fat: isNaN(value) ? 0 : value});
                }}
              />
            </View>
          </View>
        </View>
        
        <Text style={styles.requiredNote}>* Required fields</Text>
        
        {/* Extra space for bottom padding */}
        <View style={{height: 80}} />
      </ScrollView>
      
      {/* Footer with Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!isFormValid || customLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleAddCustomIngredient}
          disabled={!isFormValid || customLoading}
        >
          {customLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Ingredient</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  customFormContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  customFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey5,
    backgroundColor: COLORS.white,
  },
  customFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  customFormScroll: {
    flex: 1,
  },
  customFormContent: {
    padding: 16,
  },
  customFormDescription: {
    fontSize: 14,
    color: COLORS.grey1,
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  formSectionSubtitle: {
    fontSize: 14,
    color: COLORS.grey1,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grey5,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grey5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  unitSelectorText: {
    fontSize: 16,
    color: COLORS.black,
  },
  unitDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grey5,
    borderRadius: 8,
    marginTop: -12,
    marginBottom: 16,
    maxHeight: 200,
  },
  unitOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey5,
  },
  unitOptionSelected: {
    backgroundColor: COLORS.primary + '15',
  },
  unitOptionText: {
    fontSize: 16,
    color: COLORS.black,
  },
  unitOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grey5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.grey5 + '30',
  },
  imageIconContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    color: COLORS.grey1,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  processButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.grey5,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: COLORS.grey1,
    fontSize: 14,
  },
  fetchButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 16,
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: COLORS.grey5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  requiredNote: {
    fontSize: 12,
    color: COLORS.grey1,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grey5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.grey3,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomIngredientForm; 