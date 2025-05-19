import React from 'react';
import { 
  Modal, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  FlatList, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';
import { COLORS } from '../../constants';

interface SavedDishesModalProps {
  visible: boolean;
  savedDishes: Dish[];
  onClose: () => void;
  onAddDishToMeal: (dish: Dish) => void;
  onDeleteDish: (dishId: string) => void;
}

const SavedDishesModal: React.FC<SavedDishesModalProps> = ({
  visible,
  savedDishes,
  onClose,
  onAddDishToMeal,
  onDeleteDish
}) => {
  // Confirm dish deletion
  const confirmDeleteDish = (dish: Dish) => {
    Alert.alert(
      'Delete Saved Dish',
      `Are you sure you want to delete "${dish.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteDish(dish.id)
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Dishes</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
          
          {savedDishes.length > 0 ? (
            <FlatList
              data={savedDishes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.savedDishItem}>
                  <View style={styles.savedDishInfo}>
                    <Text style={styles.savedDishName}>{item.name}</Text>
                    <Text style={styles.savedDishDetails}>
                      {item.totalCalories.toFixed(0)} calories • {item.ingredients.length} ingredients
                    </Text>
                  </View>
                  
                  <View style={styles.savedDishActions}>
                    <TouchableOpacity 
                      style={styles.addDishButton}
                      onPress={() => onAddDishToMeal(item)}
                    >
                      <Ionicons name="add-circle" size={24} color={COLORS.success} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteDishButton}
                      onPress={() => confirmDeleteDish(item)}
                    >
                      <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.savedDishesList}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>No saved dishes found</Text>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.grey3} />
              <Text style={styles.emptyTitle}>No Saved Dishes</Text>
              <Text style={styles.emptyText}>
                Save dishes for quick reuse by using the "Save for Reuse" option when creating a dish.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
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
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  savedDishesList: {
    paddingBottom: 20,
  },
  savedDishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey3,
  },
  savedDishInfo: {
    flex: 1,
    marginRight: 10,
  },
  savedDishName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  savedDishDetails: {
    fontSize: 14,
    color: COLORS.orange,
  },
  savedDishActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDishButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteDishButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyListText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: 30,
    fontStyle: 'italic',
  },
});

export default SavedDishesModal; 