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

interface QuantityModalProps {
  visible: boolean;
  selectedIngredient: Ingredient | null;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  onCancel: () => void;
  onAdd: () => void;
  getBaseQuantityForUnit: (unit: string) => number;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  selectedIngredient,
  quantity,
  onQuantityChange,
  onCancel,
  onAdd,
  getBaseQuantityForUnit
}) => {
  if (!selectedIngredient) return null;

  const suggestedQuantities = [
    getBaseQuantityForUnit(selectedIngredient.unit) * 0.5,  // Half serving
    getBaseQuantityForUnit(selectedIngredient.unit),        // Standard serving
    getBaseQuantityForUnit(selectedIngredient.unit) * 2,    // Double serving
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.ingredientName}>{selectedIngredient.name}</Text>
          
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionText}>
              {selectedIngredient.nutrition.calories} cal per {getBaseQuantityForUnit(selectedIngredient.unit)} {selectedIngredient.unit}
            </Text>
          </View>
          
          <Text style={styles.inputLabel}>Enter quantity ({selectedIngredient.unit}):</Text>
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            value={quantity}
            onChangeText={onQuantityChange}
            placeholder={`e.g., ${getBaseQuantityForUnit(selectedIngredient.unit)}`}
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
                  <Text style={styles.quickValueText}>{value} {selectedIngredient.unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, !quantity && styles.disabledButton]}
            onPress={onAdd}
            disabled={!quantity}
          >
            <Text style={styles.addButtonText}>Add to Dish</Text>
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
  ingredientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  nutritionInfo: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  nutritionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#666',
    marginBottom: 8,
  },
  quickValueButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickValueButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickValueText: {
    fontSize: 13,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
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

export default QuantityModal; 