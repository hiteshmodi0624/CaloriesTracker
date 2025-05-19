import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../../../../types';
import { COLORS } from './constants';


interface IngredientItemProps {
  ingredient: Ingredient;
  onSelect: (ingredient: Ingredient) => void;
  getBaseQuantityForUnit: (unit: string) => number;
}

const IngredientItem: React.FC<IngredientItemProps> = ({ 
  ingredient, 
  onSelect, 
  getBaseQuantityForUnit 
}) => {
  return (
    <TouchableOpacity 
      style={styles.ingredientItem}
      onPress={() => onSelect(ingredient)}
      activeOpacity={0.7}
    >
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{ingredient.name}</Text>
        <View style={styles.ingredientDetails}>
          <View style={styles.ingredientUnit}>
            <Text style={styles.ingredientUnitText}>
              {getBaseQuantityForUnit(ingredient.unit)} {ingredient.unit}
            </Text>
          </View>
          <Text style={styles.ingredientCalories}>
            {ingredient.nutrition.calories.toFixed(0)} cal
          </Text>
        </View>
        <View style={styles.macrosContainer}>
          {ingredient.nutrition.protein !== undefined && ingredient.nutrition.protein > 0 && (
            <Text style={styles.macroText}>P: {ingredient.nutrition.protein.toFixed(1)}g</Text>
          )}
          {ingredient.nutrition.carbs !== undefined && ingredient.nutrition.carbs > 0 && (
            <Text style={styles.macroText}>C: {ingredient.nutrition.carbs.toFixed(1)}g</Text>
          )}
          {ingredient.nutrition.fat !== undefined && ingredient.nutrition.fat > 0 && (
            <Text style={styles.macroText}>F: {ingredient.nutrition.fat.toFixed(1)}g</Text>
          )}
        </View>
      </View>
      <View style={styles.addButtonContainer}>
        <View style={styles.addButton}>
          <Ionicons name="add" size={20} color={COLORS.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  ingredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ingredientUnit: {
    backgroundColor: COLORS.cardBackground3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  ingredientUnitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ingredientCalories: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  addButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IngredientItem; 