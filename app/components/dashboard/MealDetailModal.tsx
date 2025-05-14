import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Meal } from '../../../types';

interface MealDetailProps {
  visible: boolean;
  onClose: () => void;
  meal: Meal | null;
  onDeleteMeal: (mealId: string) => Promise<void>;
  onEditMeal: (meal: Meal) => void; // New prop to navigate to edit page
}

const MealDetailModal: React.FC<MealDetailProps> = ({ 
  visible, 
  onClose, 
  meal,
  onDeleteMeal,
  onEditMeal
}) => {
  // Function to handle delete
  const handleDelete = () => {
    if (!meal) return;
    
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal? This action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await onDeleteMeal(meal.id);
            onClose();
          }
        }
      ]
    );
  };

  // Function to navigate to edit page
  const handleNavigateToEdit = () => {
    if (!meal) return;
    onClose(); // Close the modal
    onEditMeal(meal); // Navigate to edit page with meal data
  };

  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{meal.name}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleNavigateToEdit}
              >
                <MaterialIcons name="edit" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={24} color="#FF3B30" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.mealDate}>
              {new Date(meal.date).toLocaleDateString()}
            </Text>
            <Text style={styles.mealCalories}>
              {meal.totalCalories} calories
            </Text>
            
            {meal.dishes && meal.dishes.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>Dishes:</Text>
                {meal.dishes.map((dish) => (
                  <View key={dish.id} style={styles.dishItem}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishCalories}>{dish.totalCalories} calories</Text>
                    <View style={styles.dishIngredients}>
                      {dish.ingredients.map((ingredient) => (
                        <View key={ingredient.id} style={styles.ingredientItem}>
                          <Text style={styles.ingredientName}>
                            {ingredient.quantity} {ingredient.unit} {ingredient.name}
                          </Text>
                          <Text style={styles.ingredientNutrition}>
                            {ingredient.nutrition.calories} cal | P: {ingredient.nutrition.protein || 0}g | 
                            C: {ingredient.nutrition.carbs || 0}g | F: {ingredient.nutrition.fat || 0}g
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
            
            {meal.ingredients.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>
                  {meal.dishes && meal.dishes.length > 0 
                    ? "Additional Ingredients:" 
                    : "Ingredients:"}
                </Text>
                {meal.ingredients.map((ingredient) => (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </Text>
                    <Text style={styles.ingredientNutrition}>
                      {ingredient.nutrition.calories} cal | P: {ingredient.nutrition.protein || 0}g | 
                      C: {ingredient.nutrition.carbs || 0}g | F: {ingredient.nutrition.fat || 0}g
                    </Text>
                  </View>
                ))}
              </>
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  scrollContent: {
    maxHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  mealDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  mealCalories: {
    fontSize: 18,
    color: "#5E72E4",
    fontWeight: "500",
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  dishItem: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dishName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  dishCalories: {
    fontSize: 14,
    color: "#FF9500",
    marginBottom: 8,
  },
  dishIngredients: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  ingredientItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ingredientName: {
    fontSize: 14,
    color: "#333",
  },
  ingredientNutrition: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  bottomPadding: {
    height: 40,
  },
});

export default MealDetailModal; 