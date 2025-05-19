import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  SafeAreaView,
  Platform,
  ActionSheetIOS,
  Dimensions,
} from "react-native";
import { Ingredient, NutritionInfo } from '../../../types';
import * as ImagePicker from 'expo-image-picker';
import { fetchNutritionForIngredient, extractNutritionFromLabel } from '../../services/openai';
import * as Haptics from 'expo-haptics';
import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { IngredientSelectionView, CustomIngredientForm } from './ingredients';
import { COLORS } from '../../constants/colors';

// Define interfaces
interface IngredientSelectionModalProps {
  visible: boolean;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  ingredients: Ingredient[];
  onSelectIngredient: (ingredient: Ingredient) => void;
  onAddNewIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onClose: () => void;
  getBaseQuantityForUnit: (unit: string) => number;
}

// Create the main component
const IngredientSelectionModal: React.FC<IngredientSelectionModalProps> = ({
  visible,
  searchTerm,
  onSearchChange,
  ingredients,
  onSelectIngredient,
  onAddNewIngredient,
  onClose,
  getBaseQuantityForUnit
}) => {
  
  // State for ingredients view
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [recentlyUsedIngredients, setRecentlyUsedIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State for custom ingredient form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('serving');
  const [nutrition, setNutrition] = useState<NutritionInfo>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Validation
  const isNameValid = name.trim().length > 0;
  const isCaloriesValid = nutrition.calories > 0;
  const isFormValid = isNameValid && isCaloriesValid;
  
  
  // Effects for ingredient filtering
  useEffect(() => {
    // Get recently used ingredients
    if (ingredients.length > 0) {
      setRecentlyUsedIngredients(ingredients.slice(0, 5));
    }
  }, [ingredients]);
  
  useEffect(() => {
    if (!searchTerm) {
      setFilteredIngredients([]);
      setLoading(false);
      return;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // Simple search implementation
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    
    setFilteredIngredients(filtered);
    setLoading(false);
  }, [searchTerm, ingredients]);

  // Reset custom form
  const resetCustomForm = () => {
    setName('');
    setUnit('serving');
    setNutrition({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    setImageUri(null);
    setShowUnitSelector(false);
    setCustomLoading(false);
    setSubmitAttempted(false);
  };
  
  // Handle showing custom form
  const handleShowCustomForm = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCustomForm(true);
  };
  
  // Handle closing custom form
  const handleCloseCustomForm = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCustomForm(false);
    resetCustomForm();
  };
  
  // Handle clearing search
  const handleClearSearch = () => {
    onSearchChange('');
  };
  
  // Handle adding custom ingredient
  const handleAddCustomIngredient = () => {
    setSubmitAttempted(true);
    
    if (!isFormValid) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    
    const newIngredient: Omit<Ingredient, 'id'> = {
      name,
      unit,
      nutrition,
    };
    
    onAddNewIngredient(newIngredient);
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    resetCustomForm();
    setShowCustomForm(false);
  };
  
  // Get base quantity for selected unit
  const getBaseQuantityForSelectedUnit = (unit: string): number => {
    return getBaseQuantityForUnit(unit);
  };
  
  // Image handling
  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await takePhoto();
          } else if (buttonIndex === 2) {
            await chooseFromLibrary();
          }
        }
      );
    } else {
      // For Android
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: chooseFromLibrary },
        ]
      );
    }
  };
  
  const takePhoto = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Process the image
        const processedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        setImageUri(processedImage.uri);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  
  const chooseFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select images',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Process the image
        const processedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        
        setImageUri(processedImage.uri);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error choosing from library:', error);
      Alert.alert('Error', 'Failed to choose image from library');
    }
  };
  
  // Process nutrition label from image
  const processNutritionLabel = async () => {
    if (!imageUri) return;
    
    setCustomLoading(true);
    
    try {
      // Use real API in production
      const nutritionData = await extractNutritionFromLabel(imageUri);
      setNutrition(nutritionData);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error processing nutrition label:', error);
      Alert.alert('Error', 'Failed to process nutrition label');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCustomLoading(false);
    }
  };
  
  // Fetch nutrition data by name
  const handleFetchNutrition = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter an ingredient name first');
      return;
    }
    
    setCustomLoading(true);
    
    try {
      // Use real API in production
      const nutritionData = await fetchNutritionForIngredient(name, unit, getBaseQuantityForUnit(unit));
      setNutrition(nutritionData);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      Alert.alert('Error', 'Failed to fetch nutrition data');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCustomLoading(false);
    }
  };

  // Main render method
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Semi-transparent background */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Modal content */}
        <Animated.View style={[styles.modalContent]}>
          {!showCustomForm ? (
            <IngredientSelectionView
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              ingredients={ingredients}
              filteredIngredients={filteredIngredients}
              recentlyUsedIngredients={recentlyUsedIngredients}
              loading={loading}
              onSelectIngredient={onSelectIngredient}
              handleShowCustomForm={handleShowCustomForm}
              handleClearSearch={handleClearSearch}
              getBaseQuantityForUnit={getBaseQuantityForUnit}
              onClose={onClose}
            />
          ) : (
            <CustomIngredientForm
              name={name}
              setName={setName}
              unit={unit}
              setUnit={setUnit}
              showUnitSelector={showUnitSelector}
              setShowUnitSelector={setShowUnitSelector}
              nutrition={nutrition}
              setNutrition={setNutrition}
              customLoading={customLoading}
              setCustomLoading={setCustomLoading}
              submitAttempted={submitAttempted}
              setSubmitAttempted={setSubmitAttempted}
              imageUri={imageUri}
              setImageUri={setImageUri}
              isNameValid={isNameValid}
              isCaloriesValid={isCaloriesValid}
              isFormValid={isFormValid}
              pickImage={pickImage}
              processNutritionLabel={processNutritionLabel}
              handleFetchNutrition={handleFetchNutrition}
              handleAddCustomIngredient={handleAddCustomIngredient}
              handleCloseCustomForm={handleCloseCustomForm}
              getBaseQuantityForSelectedUnit={getBaseQuantityForSelectedUnit}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Create styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.opaqueBlack,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 20,
    overflow: 'scroll',
    height: '80%',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  }
});

export default IngredientSelectionModal; 