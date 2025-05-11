import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';
import { NutritionSummary, DishItem } from './index';

interface DishManagementProps {
  dishes: Dish[];
  mealNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  editDish: (dish: Dish) => void;
  removeDishFromMeal: (dishId: string) => void;
  editDishIngredientQuantity: (dishId: string, ingredientId: string, newQuantity: number) => void;
  setShowSavedDishesModal: (show: boolean) => void;
  setCurrentDishName: (name: string) => void;
  setCurrentDishIngredients: (ingredients: any[]) => void;
  setActiveTabInDishModal: (tab: 'ingredients' | 'quickDish') => void;
  setShowDishCreateModal: (show: boolean) => void;
}

const DishManagement: React.FC<DishManagementProps> = ({
  dishes,
  mealNutrition,
  editDish,
  removeDishFromMeal,
  editDishIngredientQuantity,
  setShowSavedDishesModal,
  setCurrentDishName,
  setCurrentDishIngredients,
  setActiveTabInDishModal,
  setShowDishCreateModal
}) => {
  return (
    <>
      {/* Nutrition Summary */}
      {(dishes.length > 0) && (
        <NutritionSummary nutrition={mealNutrition} />
      )}

      {/* Dishes Section */}
      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dishes</Text>
          
          <View style={styles.dishHeaderButtons}>
            <TouchableOpacity 
              style={styles.browseSavedDishesButton}
              onPress={() => setShowSavedDishesModal(true)}
            >
              <Ionicons name="book-outline" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.browseDishesButtonText}>Saved Dishes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addDishButton}
              onPress={() => {
                setCurrentDishName('');
                setCurrentDishIngredients([]);
                setActiveTabInDishModal('ingredients');
                setShowDishCreateModal(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.addDishButtonText}>Add Dish</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {dishes.length > 0 ? (
          <View style={styles.dishesList}>
            {dishes.map(dish => (
              <DishItem 
                key={dish.id}
                dish={dish}
                onEdit={editDish}
                onRemove={removeDishFromMeal}
                onEditIngredientQuantity={editDishIngredientQuantity}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyDishesContainer}>
            <Text style={styles.emptyDishesText}>
              No dishes added yet
            </Text>
            <Text style={styles.emptyDishesSubtext}>
              Add dishes to your meal by tapping "Add Dish"
            </Text>
            <View style={styles.emptyDishExamplesContainer}>
              <Text style={styles.emptyDishExamplesTitle}>Examples:</Text>
              <Text style={styles.emptyDishExample}>• Muesli with Milk</Text>
              <Text style={styles.emptyDishExample}>• Turkey Sandwich</Text>
              <Text style={styles.emptyDishExample}>• Mixed Salad</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  formSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  buttonIcon: {
    marginRight: 8,
  },
  addDishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addDishButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  dishesList: {
    marginBottom: 10,
  },
  emptyDishesContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyDishesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
  },
  emptyDishesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyDishExamplesContainer: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyDishExamplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  emptyDishExample: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  dishHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseSavedDishesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  browseDishesButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DishManagement; 