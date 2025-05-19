import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';
import { NutritionSummary, DishItem } from './index';
import { COLORS } from '../../constants';

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
  // Quick recipe ideas for empty state
  const quickRecipeIdeas = [
    {
      name: "Breakfast Bowl",
      description: "Yogurt, granola, and fresh fruit",
      icon: "cafe-outline"
    },
    {
      name: "Chicken Salad",
      description: "Grilled chicken with mixed greens",
      icon: "leaf-outline"
    },
    {
      name: "Veggie Stir Fry",
      description: "Mixed vegetables with tofu and rice",
      icon: "restaurant-outline"
    }
  ];

  const createNewDish = () => {
    setCurrentDishName('');
    setCurrentDishIngredients([]);
    setActiveTabInDishModal('ingredients');
    setShowDishCreateModal(true);
  };

  const createQuickDish = () => {
    setCurrentDishName('');
    setCurrentDishIngredients([]);
    setActiveTabInDishModal('quickDish');
    setShowDishCreateModal(true);
  };

  return (
    <>
      {/* Nutrition Summary - Only show if dishes exist */}
      {(dishes.length > 0) && (
        <NutritionSummary nutrition={mealNutrition} />
      )}

      {/* Dishes Section */}
      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dishes</Text>
          
          {dishes.length > 0 && (
            <Text style={styles.dishCount}>
              {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
            </Text>
          )}
        </View>
        
        {dishes.length > 0 ? (
          <>
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
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={createNewDish}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Add New Dish</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.savedButton]}
                onPress={() => setShowSavedDishesModal(true)}
              >
                <Ionicons name="bookmark" size={20} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Saved Dishes</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyDishesContainer}>
            <Ionicons name="restaurant-outline" size={60} color={COLORS.grey4} />
            <Text style={styles.emptyDishesText}>
              No dishes added yet
            </Text>
            <Text style={styles.emptyDishesSubtext}>
              Create a dish by adding ingredients or using quick add
            </Text>
            
            <View style={styles.emptyActionButtonsContainer}>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={createNewDish}
              >
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.emptyActionButtonText}>Create Dish</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={createQuickDish}
              >
                <Ionicons name="flash" size={24} color={COLORS.orange} />
                <Text style={styles.emptyActionButtonText}>Quick Add</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => setShowSavedDishesModal(true)}
              >
                <Ionicons name="bookmark" size={24} color={COLORS.green} />
                <Text style={styles.emptyActionButtonText}>Saved Dishes</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.quickIdeasTitle}>Quick Ideas</Text>
            
            <View style={styles.quickIdeasContainer}>
              {quickRecipeIdeas.map((idea, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.quickIdeaCard}
                  onPress={() => {
                    setCurrentDishName(idea.name);
                    setCurrentDishIngredients([]);
                    setActiveTabInDishModal('quickDish');
                    setShowDishCreateModal(true);
                  }}
                >
                  <View style={styles.quickIdeaIcon}>
                    <Ionicons name={idea.icon as any} size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.quickIdeaContent}>
                    <Text style={styles.quickIdeaName}>{idea.name}</Text>
                    <Text style={styles.quickIdeaDescription}>{idea.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  formSection: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dishCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.cardBackground3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  dishesList: {
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 0.48,
  },
  savedButton: {
    backgroundColor: COLORS.lightBlue,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyDishesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyDishesText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 15,
    textAlign: 'center',
  },
  emptyDishesSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  emptyActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  emptyActionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground3,
    padding: 15,
    borderRadius: 12,
    flex: 0.31,
  },
  emptyActionButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  quickIdeasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  quickIdeasContainer: {
    width: '100%',
  },
  quickIdeaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground3,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  quickIdeaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickIdeaContent: {
    flex: 1,
  },
  quickIdeaName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  quickIdeaDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default DishManagement; 