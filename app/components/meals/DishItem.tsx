import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';

interface DishItemProps {
  dish: Dish;
  onEdit: (dish: Dish) => void;
  onRemove: (dishId: string) => void;
  onEditIngredientQuantity: (dishId: string, ingredientId: string, newQuantity: number) => void;
}

const DishItem: React.FC<DishItemProps> = ({
  dish,
  onEdit,
  onRemove,
  onEditIngredientQuantity
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<{id: string, name: string, quantity: number, unit: string} | null>(null);
  const [newQuantity, setNewQuantity] = useState('');

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const openEditModal = (ingredientId: string) => {
    const ingredient = dish.ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
      setCurrentIngredient({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit
      });
      setNewQuantity(ingredient.quantity.toString());
      setEditModalVisible(true);
    }
  };

  const handleUpdateQuantity = () => {
    if (currentIngredient && newQuantity) {
      const parsedQuantity = parseFloat(newQuantity);
      if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
        onEditIngredientQuantity(dish.id, currentIngredient.id, parsedQuantity);
        setEditModalVisible(false);
      }
    }
  };

  // Calculate macro percentages
  const totalCalories = dish.totalCalories;
  const macros = dish.ingredients.reduce(
    (acc, ing) => ({
      protein: acc.protein + (ing.nutrition.protein || 0),
      carbs: acc.carbs + (ing.nutrition.carbs || 0),
      fat: acc.fat + (ing.nutrition.fat || 0),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const totalMacros = macros.protein + macros.carbs + macros.fat;
  const proteinPercentage = totalMacros > 0 ? (macros.protein / totalMacros) * 100 : 0;
  const carbsPercentage = totalMacros > 0 ? (macros.carbs / totalMacros) * 100 : 0;
  const fatPercentage = totalMacros > 0 ? (macros.fat / totalMacros) * 100 : 0;

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.dishHeader}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.dishInfo}>
            <Text style={styles.dishName}>{dish.name}</Text>
            <View style={styles.macroDistribution}>
              <View style={[styles.macroBar, styles.proteinBar, { flex: proteinPercentage }]} />
              <View style={[styles.macroBar, styles.carbsBar, { flex: carbsPercentage }]} />
              <View style={[styles.macroBar, styles.fatBar, { flex: fatPercentage }]} />
            </View>
          </View>
          
          <View style={styles.dishCalories}>
            <Text style={styles.calorieValue}>{Math.round(totalCalories)}</Text>
            <Text style={styles.calorieLabel}>calories</Text>
          </View>
          
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666"
            style={styles.expandIcon}
          />
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <View style={styles.macroIconContainer}>
                  <View style={[styles.macroDot, styles.proteinDot]} />
                </View>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round(macros.protein)}g</Text>
              </View>
              
              <View style={styles.macroItem}>
                <View style={styles.macroIconContainer}>
                  <View style={[styles.macroDot, styles.carbsDot]} />
                </View>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round(macros.carbs)}g</Text>
              </View>
              
              <View style={styles.macroItem}>
                <View style={styles.macroIconContainer}>
                  <View style={[styles.macroDot, styles.fatDot]} />
                </View>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{Math.round(macros.fat)}g</Text>
              </View>
            </View>
            
            <Text style={styles.ingredientsHeader}>Ingredients</Text>
            
            {dish.ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={[
                styles.ingredientItem,
                index === dish.ingredients.length - 1 && styles.lastIngredient
              ]}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                
                <View style={styles.ingredientDetails}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => openEditModal(ingredient.id)}
                  >
                    <Text style={styles.quantityText}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <Ionicons name="create-outline" size={14} color="#5D5FEF" />
                  </TouchableOpacity>
                  
                  <Text style={styles.ingredientCalories}>
                    {Math.round(ingredient.nutrition.calories)} cal
                  </Text>
                </View>
              </View>
            ))}
            
            <View style={styles.dishActions}>
              <TouchableOpacity
                style={[styles.dishActionButton, styles.editButton]}
                onPress={() => onEdit(dish)}
              >
                <Ionicons name="create-outline" size={18} color="#5D5FEF" />
                <Text style={[styles.dishActionText, styles.editText]}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dishActionButton, styles.removeButton]}
                onPress={() => onRemove(dish.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF5A5A" />
                <Text style={[styles.dishActionText, styles.removeText]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {/* Edit Quantity Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Quantity</Text>
            
            {currentIngredient && (
              <Text style={styles.modalIngredientName}>{currentIngredient.name}</Text>
            )}
            
            <View style={styles.quantityInputContainer}>
              <TextInput
                style={styles.quantityInput}
                value={newQuantity}
                onChangeText={setNewQuantity}
                keyboardType="numeric"
                autoFocus
              />
              {currentIngredient && (
                <Text style={styles.unitText}>{currentIngredient.unit}</Text>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdateQuantity}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  macroDistribution: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5F5F7',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
  },
  proteinBar: {
    backgroundColor: '#5D5FEF',
  },
  carbsBar: {
    backgroundColor: '#4DDFFD',
  },
  fatBar: {
    backgroundColor: '#FF7676',
  },
  dishCalories: {
    alignItems: 'center',
    marginRight: 10,
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666666',
  },
  expandIcon: {
    padding: 4,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  proteinDot: {
    backgroundColor: '#5D5FEF',
  },
  carbsDot: {
    backgroundColor: '#4DDFFD',
  },
  fatDot: {
    backgroundColor: '#FF7676',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  ingredientsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  lastIngredient: {
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  ingredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  quantityText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 4,
  },
  ingredientCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9551',
    width: 60,
    textAlign: 'right',
  },
  dishActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  dishActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#F0F0FF',
  },
  removeButton: {
    backgroundColor: '#FFF0F0',
  },
  dishActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  editText: {
    color: '#5D5FEF',
  },
  removeText: {
    color: '#FF5A5A',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalIngredientName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
  },
  quantityInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  unitText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  updateButton: {
    backgroundColor: '#5D5FEF',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default DishItem; 