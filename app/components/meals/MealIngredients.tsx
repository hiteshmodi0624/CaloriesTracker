import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealIngredient } from '../../../types';
import { COLORS } from '../../constants';

interface MealIngredientsProps {
  mealIngredients: MealIngredient[];
  onRemoveIngredient: (id: string) => void;
  onAddIngredient: () => void;
}

const MealIngredients: React.FC<MealIngredientsProps> = ({
  mealIngredients,
  onRemoveIngredient,
  onAddIngredient
}) => {
  return (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {mealIngredients.length > 0 && (
          <Text style={styles.ingredientCount}>
            {mealIngredients.length} {mealIngredients.length === 1 ? 'ingredient' : 'ingredients'}
          </Text>
        )}
      </View>

      {mealIngredients.length > 0 ? (
        <>
          <View style={styles.ingredientsList}>
            {mealIngredients.map(ingredient => (
              <View key={ingredient.id} style={styles.ingredientItem}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <View style={styles.ingredientDetails}>
                    <Text style={styles.ingredientAmount}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <Text style={styles.ingredientCalories}>
                      {Math.round(ingredient.nutrition.calories)} cal
                    </Text>
                  </View>
                  <View style={styles.macrosContainer}>
                    {ingredient.nutrition.protein !== undefined && (
                      <Text style={styles.macroText}>P: {ingredient.nutrition.protein.toFixed(1)}g</Text>
                    )}
                    {ingredient.nutrition.carbs !== undefined && (
                      <Text style={styles.macroText}>C: {ingredient.nutrition.carbs.toFixed(1)}g</Text>
                    )}
                    {ingredient.nutrition.fat !== undefined && (
                      <Text style={styles.macroText}>F: {ingredient.nutrition.fat.toFixed(1)}g</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => onRemoveIngredient(ingredient.id)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyIngredientsContainer}>
          <Text style={styles.emptyIngredientsText}>
            No ingredients added directly to meal
          </Text>
          <Text style={styles.emptyIngredientsSubtext}>
            Add ingredients for items not part of any dish
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onAddIngredient}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />
        <Text style={styles.addButtonText}>Add Ingredient</Text>
      </TouchableOpacity>
    </View>
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
  ingredientCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.cardBackground2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ingredientsList: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground2,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ingredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ingredientAmount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  ingredientCalories: {
    fontSize: 14,
    color: COLORS.orange,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  emptyIngredientsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIngredientsText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptyIngredientsSubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  }
});

export default MealIngredients; 