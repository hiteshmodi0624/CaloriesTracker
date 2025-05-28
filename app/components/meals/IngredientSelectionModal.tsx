import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../../constants';
import { Ingredient } from '../../../types';
import { AppContext } from '../../context/AppContext';
import { extractNutritionFromLabel, fetchNutritionForIngredient } from '../../services/openai';
import { FynkoDropdown, DropdownOption, FynkoAIButton, FynkoImagePicker, FynkoTextInput } from '../common';
import * as ImagePicker from 'expo-image-picker';
import { roundNutritionValues, roundToTwoDecimals } from '../../utils/nutrition';

interface IngredientSelectionModalProps {
  visible: boolean;
  ingredients: Ingredient[];
  onSelectIngredient: (ingredient: Ingredient) => void;
  onClose: () => void;
}

type TabType = 'select' | 'create';
type CreateMethod = 'manual' | 'ai' | 'photo';

const IngredientSelectionModal: React.FC<IngredientSelectionModalProps> = ({
  visible,
  ingredients,
  onSelectIngredient,
  onClose
}) => {
  const { addCustomIngredient } = useContext(AppContext);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('select');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create ingredient state
  const [createMethod, setCreateMethod] = useState<CreateMethod>('manual');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [newIngredientCalories, setNewIngredientCalories] = useState('');
  const [newIngredientProtein, setNewIngredientProtein] = useState('');
  const [newIngredientCarbs, setNewIngredientCarbs] = useState('');
  const [newIngredientFat, setNewIngredientFat] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Unit options for dropdown - using base units
  const unitOptions: DropdownOption[] = [
    // Weight units
    { label: 'grams (g)', value: 'g' },
    { label: 'kilograms (kg)', value: 'kg' },
    { label: 'ounces (oz)', value: 'oz' },
    { label: 'pounds (lb)', value: 'lb' },
    // Volume units
    { label: 'milliliters (ml)', value: 'ml' },
    { label: 'liters (l)', value: 'l' },
    { label: 'cups', value: 'cup' },
    { label: 'tablespoons (tbsp)', value: 'tbsp' },
    { label: 'teaspoons (tsp)', value: 'tsp' },
    // Count units
    { label: 'pieces/items', value: 'piece' },
    { label: 'servings', value: 'serving' },
  ];

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetCreateForm = () => {
    setNewIngredientName('');
    setNewIngredientUnit('');
    setNewIngredientCalories('');
    setNewIngredientProtein('');
    setNewIngredientCarbs('');
    setNewIngredientFat('');
    setSelectedImage(null);
    setCreateMethod('manual');
  };

  const handleClose = () => {
    setActiveTab('select');
    setSearchTerm('');
    resetCreateForm();
    onClose();
  };

  const handleCreateIngredient = async () => {
    if (!newIngredientName.trim() || !newIngredientUnit.trim() || !newIngredientCalories.trim()) {
      return;
    }
    
    setIsCreating(true);
    try {
      const servingSize = getNutritionServingSize(newIngredientUnit);
      
      // Convert nutrition values from input serving size to per-unit basis with proper precision
      const nutritionPerUnit = roundNutritionValues({
        calories: roundToTwoDecimals((parseFloat(newIngredientCalories) || 0) / servingSize),
        protein: roundToTwoDecimals((parseFloat(newIngredientProtein) || 0) / servingSize),
        carbs: roundToTwoDecimals((parseFloat(newIngredientCarbs) || 0) / servingSize),
        fat: roundToTwoDecimals((parseFloat(newIngredientFat) || 0) / servingSize),
      });

      const newIngredient = {
        name: newIngredientName.trim(),
        unit: newIngredientUnit.trim(),
        nutrition: nutritionPerUnit
      };

      const success = await addCustomIngredient(newIngredient);
      
      if (success) {
        const fullIngredient: Ingredient = {
          id: Date.now().toString(),
          ...newIngredient
        };
        
        onSelectIngredient(fullIngredient);
        resetCreateForm();
        handleClose();
      }
    } catch (error) {
      console.error('Error creating ingredient:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!newIngredientName.trim() || !newIngredientUnit.trim()) {
      Alert.alert('Missing Information', 'Please enter ingredient name and unit before AI analysis.');
        return;
    }
    
    setIsAnalyzing(true);
    try {
      const servingSize = getNutritionServingSize(newIngredientUnit);
      const servingText = getNutritionServingText(newIngredientUnit);
      
      const nutrition = await fetchNutritionForIngredient(newIngredientName.trim(), servingText, 1);
      
      if (nutrition && typeof nutrition.calories === 'number') {
        // Store the values as entered (for the serving size), conversion happens on save with proper precision
        setNewIngredientCalories(roundToTwoDecimals(nutrition.calories).toString());
        setNewIngredientProtein(roundToTwoDecimals(nutrition.protein || 0).toString());
        setNewIngredientCarbs(roundToTwoDecimals(nutrition.carbs || 0).toString());
        setNewIngredientFat(roundToTwoDecimals(nutrition.fat || 0).toString());
        
        Alert.alert('Success', `Nutrition information analyzed for ${servingText} of ${newIngredientName}!`);
      } else {
        throw new Error('Invalid nutrition data received from AI');
      }
    } catch (error) {
      console.error('Error analyzing nutrition:', error);
      Alert.alert(
        'Analysis Failed', 
        `Could not analyze nutrition information for "${newIngredientName}". Please check the ingredient name and try again, or enter the information manually.`,
        [
          { text: 'Try Again', style: 'default' },
          { text: 'Enter Manually', onPress: () => setCreateMethod('manual') }
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeNutritionLabel = async (imageUri: string) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image selected. Please try again.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const servingText = getNutritionServingText(newIngredientUnit);
      const nutrition = await extractNutritionFromLabel(imageUri, servingText);
      
      if (nutrition && typeof nutrition.calories === 'number') {
        // Store the values as entered (for the serving size), conversion happens on save with proper precision
        setNewIngredientCalories(roundToTwoDecimals(nutrition.calories).toString());
        setNewIngredientProtein(roundToTwoDecimals(nutrition.protein || 0).toString());
        setNewIngredientCarbs(roundToTwoDecimals(nutrition.carbs || 0).toString());
        setNewIngredientFat(roundToTwoDecimals(nutrition.fat || 0).toString());
        
        Alert.alert('Success', `Nutrition information extracted from image for ${servingText}!`);
      } else {
        throw new Error('Invalid nutrition data received');
      }
    } catch (error) {
      console.error('Error analyzing nutrition label:', error);
      setSelectedImage(null); // Clear the image on error
      Alert.alert(
        'Analysis Failed', 
        'Could not extract nutrition information from the image. Please ensure the image shows a clear nutrition facts label and try again, or enter the information manually.',
        [
          { text: 'Try Again', onPress: () => setSelectedImage(null) },
          { text: 'Enter Manually', onPress: () => setCreateMethod('manual') }
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to get standard serving size for nutrition input
  const getNutritionServingSize = (unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'g':
      case 'ml':
        return 100; // 100g or 100ml (standard nutrition label serving)
      case 'kg':
      case 'l':
        return 1; // 1kg or 1l
      case 'oz':
        return 1; // 1oz
      case 'lb':
        return 1; // 1lb
      case 'cup':
      case 'tbsp':
      case 'tsp':
      case 'piece':
      case 'serving':
        return 1; // 1 cup, 1 tbsp, etc.
      default:
        return 1;
    }
  };

  // Helper function to get display text for nutrition serving
  const getNutritionServingText = (unit: string): string => {
    const servingSize = getNutritionServingSize(unit);
    return `${servingSize}${unit}`;
  };

  const renderIngredientItem = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={styles.ingredientItem}
      onPress={() => {
        onSelectIngredient(item);
        handleClose();
      }}
    >
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <Text style={styles.ingredientDetails}>
          {item.unit} • {item.nutrition.calories} cal
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey3} />
    </TouchableOpacity>
  );

  const renderCreateMethodCard = (method: CreateMethod, icon: string, title: string, description: string) => (
    <TouchableOpacity
      style={[styles.methodCard, createMethod === method && styles.activeMethodCard]}
      onPress={() => setCreateMethod(method)}
    >
      <View style={styles.methodCardHeader}>
        <Ionicons 
          name={icon as any} 
          size={18} 
          color={createMethod === method ? COLORS.primary : COLORS.textSecondary} 
        />
        <Text style={[styles.methodCardTitle, createMethod === method && styles.activeMethodCardTitle]}>
          {title}
        </Text>
      </View>
      <Text style={styles.methodCardDescription}>{description}</Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>
              {activeTab === 'select' ? 'Select Ingredient' : 'Create Ingredient'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'select' && styles.activeTab]}
              onPress={() => setActiveTab('select')}
            >
              <Text style={[styles.tabText, activeTab === 'select' && styles.activeTabText]}>
                Select
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'create' && styles.activeTab]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
                Create New
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'select' ? (
            <>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.grey3} style={styles.searchIcon} />
                <FynkoTextInput
                  style={styles.searchInput}
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={COLORS.textSecondary}
                  backgroundColor={COLORS.background}
                />
              </View>

              {filteredIngredients.length > 0 ? (
                <FlatList
                  data={filteredIngredients}
                  keyExtractor={(item) => item.id}
                  renderItem={renderIngredientItem}
                  contentContainerStyle={styles.listContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={COLORS.grey3} />
                  <Text style={styles.emptyStateTitle}>
                    {searchTerm ? 'No ingredients found' : 'No ingredients available'}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {searchTerm 
                      ? `Try a different search term or create a new ingredient`
                      : 'Create your first ingredient using the "Create New" tab'
                    }
                  </Text>
                </View>
              )}
            </>
          ) : (
            <ScrollView style={styles.createForm} showsVerticalScrollIndicator={false}>
              {/* Method Selection */}
              <Text style={styles.sectionTitle}>How would you like to add nutrition info?</Text>
              
              <View style={styles.methodsContainer}>
                {renderCreateMethodCard('manual', 'create-outline', 'Manual Entry', 'Enter nutrition values manually')}
                {renderCreateMethodCard('ai', 'sparkles-outline', 'AI Analysis', 'Let AI analyze nutrition for you')}
                {renderCreateMethodCard('photo', 'camera-outline', 'Nutrition Label', 'Upload photo of nutrition label')}
              </View>

              {/* Basic Info */}
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <FynkoTextInput
                label="Ingredient Name"
                placeholder="e.g., Chicken Breast"
                value={newIngredientName}
                onChangeText={setNewIngredientName}
                required={true}
                leftIcon="nutrition-outline"
              />

              <Text style={styles.label}>Unit *</Text>
              <FynkoDropdown
                options={unitOptions}
                selectedValue={newIngredientUnit}
                onValueChange={(value: string) => setNewIngredientUnit(value)}
                placeholder="Select unit"
              />

              {/* Method-specific content */}
              {createMethod === 'photo' && (
                <View style={styles.photoSection}>
                  <Text style={styles.sectionTitle}>Nutrition Label Photo</Text>
                  
                  {!newIngredientUnit && (
                    <View style={styles.warningContainer}>
                      <Ionicons name="warning-outline" size={20} color={COLORS.orange} />
                      <Text style={styles.warningText}>
                        Please select a base unit above (e.g., "g" for grams) before uploading a nutrition label photo
                      </Text>
                    </View>
                  )}
                  
                  <FynkoImagePicker
                    selectedImage={selectedImage}
                    onImageSelected={(uri) => setSelectedImage(uri)}
                    onImageRemoved={() => setSelectedImage(null)}
                    placeholder="Add Nutrition Label"
                    disabled={!newIngredientUnit}
                    showNutritionHint={true}
                  />
                  
                  {selectedImage && (
                    <FynkoAIButton
                      title="Analyze Nutrition Label"
                      onPress={() => analyzeNutritionLabel(selectedImage)}
                      loading={isAnalyzing}
                      disabled={isAnalyzing}
                      icon="sparkles"
                      style={styles.analyzeButtonMargin}
                    />
                  )}
                </View>
              )}

              {createMethod === 'ai' && (
                <View style={styles.aiSection}>
                  <Text style={styles.sectionTitle}>AI Nutrition Analysis</Text>
                  <FynkoAIButton
                    title="Analyze Nutrition with AI"
                    onPress={handleAIAnalysis}
                    loading={isAnalyzing}
                    disabled={!newIngredientName.trim() || !newIngredientUnit.trim()}
                    icon="sparkles"
                  />
                  <Text style={styles.aiNote}>
                    AI will analyze nutrition information per {newIngredientUnit ? getNutritionServingText(newIngredientUnit) : 'unit'} of {newIngredientName || 'the ingredient'}
                  </Text>
                </View>
              )}

              {/* Nutrition Information */}
              <Text style={styles.sectionTitle}>
                Nutrition Information (per {newIngredientUnit ? getNutritionServingText(newIngredientUnit) : 'unit'})
                {isAnalyzing && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
              </Text>
              
              {newIngredientUnit && (
                <Text style={styles.nutritionHelper}>
                  Enter nutrition values for {getNutritionServingText(newIngredientUnit)}. 
                  {getNutritionServingSize(newIngredientUnit) === 100 
                    ? ' This matches standard nutrition labels.' 
                    : ''}
                </Text>
              )}
              
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.label}>Calories *</Text>
                  <FynkoTextInput
                    style={styles.input}
                    placeholder="0"
                    value={newIngredientCalories}
                    onChangeText={setNewIngredientCalories}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!isAnalyzing}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Text style={styles.label}>Protein (g)</Text>
                  <FynkoTextInput
                    style={styles.input}
                    placeholder="0"
                    value={newIngredientProtein}
                    onChangeText={setNewIngredientProtein}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!isAnalyzing}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Text style={styles.label}>Carbs (g)</Text>
                  <FynkoTextInput
                    style={styles.input}
                    placeholder="0"
                    value={newIngredientCarbs}
                    onChangeText={setNewIngredientCarbs}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!isAnalyzing}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Text style={styles.label}>Fat (g)</Text>
                  <FynkoTextInput
                    style={styles.input}
                    placeholder="0"
                    value={newIngredientFat}
                    onChangeText={setNewIngredientFat}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!isAnalyzing}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!newIngredientName.trim() || !newIngredientUnit.trim() || !newIngredientCalories.trim() || isCreating) && styles.disabledButton
                ]}
                onPress={handleCreateIngredient}
                disabled={!newIngredientName.trim() || !newIngredientUnit.trim() || !newIngredientCalories.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.createButtonText}>Create & Select Ingredient</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.helpText}>
                * Required fields. Nutrition values should be per {newIngredientUnit ? getNutritionServingText(newIngredientUnit) : 'unit'} (e.g., per 100g if you selected grams).
              </Text>
            </ScrollView>
          )}
      </View>
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
    flexDirection: "row",
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
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 0
  },
  listContainer: {
    paddingBottom: 20,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
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
  emptyState: {
    alignItems: "center",
    padding: 40,
    flex: 1,
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  createForm: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: COLORS.grey3,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  methodsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  methodCard: {
    flex: 1,
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  activeMethodCard: {
    backgroundColor: COLORS.background + "15",
    borderColor: COLORS.primary,
  },
  methodCardHeader: {
    alignItems: "center",
    marginBottom: 2,
  },
  methodCardTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 2,
    textAlign: "center",
  },
  activeMethodCardTitle: {
    color: COLORS.primary,
  },
  methodCardDescription: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 10,
  },
  photoSection: {
    marginBottom: 20,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.orange,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
    width: "90%",
  },
  analyzeButtonMargin: {
    marginTop: 12,
  },
  aiSection: {
    marginBottom: 20,
  },
  aiNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nutritionItem: {
    width: "48%",
    marginBottom: 12,
  },
  nutritionHelper: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
});

export default IngredientSelectionModal; 