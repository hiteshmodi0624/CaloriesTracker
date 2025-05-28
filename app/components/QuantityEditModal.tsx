import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert
} from 'react-native';
import { COLORS } from '../constants';
import { FynkoTextInput } from './common';

interface DishInfo {
  name: string;
  estimatedQuantity: string;
  currentCount: number;
}

interface QuantityEditModalProps {
  visible: boolean;
  dishInfo: DishInfo | null;
  onClose: () => void;
  onUpdate: (newQuantity: number) => void;
}

const QuantityEditModal: React.FC<QuantityEditModalProps> = ({
  visible,
  dishInfo,
  onClose,
  onUpdate
}) => {
  const [newQuantity, setNewQuantity] = useState('1');

  useEffect(() => {
    if (dishInfo) {
      setNewQuantity(dishInfo.currentCount.toString());
    }
  }, [dishInfo]);

  const handleUpdate = () => {
    const newCount = parseFloat(newQuantity);
    if (isNaN(newCount) || newCount <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid number greater than 0');
      return;
    }

    onUpdate(newCount);
    onClose();
  };

  const getUnitFromEstimatedQuantity = (estimatedQuantity: string): string => {
    return estimatedQuantity.replace(/^\d+(\.\d+)?\s*/, '') || 'items';
  };

  if (!dishInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Quantity</Text>
          
          <Text style={styles.modalIngredientName}>{dishInfo.name}</Text>
          <Text style={styles.modalEstimatedText}>
            AI detected: {dishInfo.estimatedQuantity}
          </Text>
          
          <View style={styles.quantityInputContainer}>
            <FynkoTextInput
              style={styles.quantityInput}
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="numeric"
              autoFocus
              placeholder="Enter quantity"
              backgroundColor={COLORS.cardBackground}
            />
            <Text style={styles.unitText}>
              {getUnitFromEstimatedQuantity(dishInfo.estimatedQuantity)}
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.updateButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalIngredientName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalEstimatedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  quantityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
    backgroundColor: COLORS.background
  },
  quantityInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
    marginBottom: 0,
  },
  unitText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  updateButtonText: {
    color: COLORS.white,
    fontWeight: "500",
  },
});

export default QuantityEditModal; 