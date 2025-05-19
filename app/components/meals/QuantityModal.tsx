import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../../../types';
import { COLORS } from '../../constants';
interface QuantityModalProps {
  visible: boolean;
  ingredient: Ingredient | null;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isDishIngredient?: boolean; // Flag to indicate if adding to dish or meal
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  ingredient,
  quantity,
  onQuantityChange,
  onCancel,
  onSave,
  isDishIngredient = false
}) => {
  if (!ingredient) return null;

  // Helper function to determine base quantity for a unit
  const getBaseQuantityForUnit = (unit: string): number => {
    // Default values for common units
    switch (unit.toLowerCase()) {
      case 'g':
      case 'gram':
      case 'grams':
        return 100;
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        return 0.1;
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        return 100;
      case 'l':
      case 'liter':
      case 'liters':
        return 0.25;
      case 'cup':
      case 'cups':
        return 1;
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        return 2;
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        return 3;
      case 'oz':
      case 'ounce':
      case 'ounces':
        return 3;
      case 'lb':
      case 'pound':
      case 'pounds':
        return 0.5;
      case 'piece':
      case 'pieces':
      case 'slice':
      case 'slices':
        return 1;
      default:
        return 1;
    }
  };

  const suggestedQuantities = [
    getBaseQuantityForUnit(ingredient.unit) * 0.5,  // Half serving
    getBaseQuantityForUnit(ingredient.unit),        // Standard serving
    getBaseQuantityForUnit(ingredient.unit) * 2,    // Double serving
  ];

  // Calculate estimated calories based on current quantity
  const estimatedCalories = quantity 
    ? (ingredient.nutrition.calories * parseFloat(quantity)) / getBaseQuantityForUnit(ingredient.unit)
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Quantity</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.blue} />
            </TouchableOpacity>
          </View>

          <Text style={styles.ingredientName}>{ingredient.name}</Text>
          
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionText}>
              {ingredient.nutrition.calories} cal per {getBaseQuantityForUnit(ingredient.unit)} {ingredient.unit}
            </Text>
          </View>
          
          <Text style={styles.inputLabel}>Enter quantity ({ingredient.unit}):</Text>
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            value={quantity}
            onChangeText={onQuantityChange}
            placeholder={`e.g., ${getBaseQuantityForUnit(ingredient.unit)}`}
            autoFocus
          />
          
          <View style={styles.quickValues}>
            <Text style={styles.quickValuesLabel}>Quick Selections:</Text>
            <View style={styles.quickValueButtons}>
              {suggestedQuantities.map((value, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickValueButton}
                  onPress={() => onQuantityChange(value.toString())}
                >
                  <Text style={styles.quickValueText}>{value} {ingredient.unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {!!quantity && !isNaN(parseFloat(quantity)) && (
            <View style={styles.estimatedCalories}>
              <Text style={styles.estimatedCaloriesText}>
                {Math.round((ingredient.nutrition.calories * parseFloat(quantity)) / getBaseQuantityForUnit(ingredient.unit))} estimated calories
              </Text>
            </View>
          )}
          
          <View style={styles.flowHint}>
            <Text style={styles.flowHintText}>
              After adding this ingredient, you'll be returned to continue creating your meal.
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, !quantity && styles.disabledButton]}
            onPress={onSave}
            disabled={!quantity}
          >
            <Text style={styles.addButtonText}>Add Ingredient</Text>
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
    backgroundColor: COLORS.opaqueBlack,
    padding: 20,
  },
  modalView: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    shadowColor: COLORS.black,
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
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  nutritionInfo: {
    backgroundColor: COLORS.cardBackground3,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  nutritionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  quickValues: {
    marginBottom: 20,
  },
  quickValuesLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quickValueButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickValueButton: {
    backgroundColor: COLORS.lightBluegrey3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickValueText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: COLORS.cardBackground,
  },
  estimatedCalories: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  estimatedCaloriesText: {
    fontSize: 15,
    color: COLORS.blue,
    fontWeight: '500',
  },
  flowHint: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 8,
  },
  flowHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default QuantityModal; 