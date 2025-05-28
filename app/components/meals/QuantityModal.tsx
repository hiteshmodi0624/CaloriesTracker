import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Ingredient } from '../../../types';
import { FynkoTextInput } from '../common';

interface QuantityModalProps {
  visible: boolean;
  ingredient: Ingredient | null;
  onSave: (quantity: number) => void;
  onClose: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  ingredient,
  onSave,
  onClose
}) => {
  const [quantity, setQuantity] = useState('');

  const handleSave = () => {
    const qty = parseFloat(quantity);
    if (!isNaN(qty) && qty > 0) {
      onSave(qty);
      setQuantity('');
    }
  };

  if (!ingredient) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Quantity</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.unitText}>
              Enter the amount in {ingredient.unit} (e.g., 150 for 150{ingredient.unit})
            </Text>

            <View style={styles.inputContainer}>
              <FynkoTextInput
                style={styles.input}
                placeholder={`Amount in ${ingredient.unit}`}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.unitLabel}>{ingredient.unit}</Text>
            </View>

            <View style={styles.nutritionPreview}>
              <Text style={styles.previewTitle}>Nutrition Preview:</Text>
              <Text style={styles.previewText}>
                {quantity ? (
                  <>
                    {Math.round(parseFloat(quantity) * ingredient.nutrition.calories)} calories
                    {' • '}
                    P: {(parseFloat(quantity) * (ingredient.nutrition.protein || 0)).toFixed(1)}g
                    {' • '}
                    C: {(parseFloat(quantity) * (ingredient.nutrition.carbs || 0)).toFixed(1)}g
                    {' • '}
                    F: {(parseFloat(quantity) * (ingredient.nutrition.fat || 0)).toFixed(1)}g
                  </>
                ) : (
                  'Enter quantity to see nutrition info'
                )}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Add</Text>
            </TouchableOpacity>
          </View>
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  content: {
    marginBottom: 20,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 42,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 0,
  },
  unitLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  nutritionPreview: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.cardBackground2,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  saveButtonText: {
    color: COLORS.white,
  },
});

export default QuantityModal; 