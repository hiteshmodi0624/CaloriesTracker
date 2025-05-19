import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../../../types';
import { COLORS } from '../../constants';

interface TodaysMealsProps {
  meals: Meal[];
  onSelectMeal: (meal: Meal) => void;
}

const TodaysMeals: React.FC<TodaysMealsProps> = ({ meals, onSelectMeal }) => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.summaryTitle}>Today's Meals</Text>
      </View>
      
      {meals.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="restaurant-outline" size={50} color={COLORS.grey3} />
          <Text style={styles.emptyText}>No meals logged today</Text>
          <Text style={styles.emptySubtext}>Meals you add today will appear here</Text>
        </View>
      ) : (
        meals.map(meal => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealItem}
            onPress={() => onSelectMeal(meal)}
          >
            <View style={styles.mealIconContainer}>
              <Ionicons name="restaurant" size={22} color={COLORS.white} />
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCalories}>{meal.totalCalories} calories</Text>
              <View style={styles.macroRow}>
                <Text style={styles.macroText}>P: {Math.round(
                  meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.protein || 0), 0) +
                  (meal.dishes || []).reduce((dishSum, dish) => 
                    dishSum + dish.ingredients.reduce((ingSum, ing) => ingSum + (ing.nutrition.protein || 0), 0), 0)
                )}g</Text>
                <Text style={styles.macroText}>C: {Math.round(
                  meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.carbs || 0), 0) +
                  (meal.dishes || []).reduce((dishSum, dish) => 
                    dishSum + dish.ingredients.reduce((ingSum, ing) => ingSum + (ing.nutrition.carbs || 0), 0), 0)
                )}g</Text>
                <Text style={styles.macroText}>F: {Math.round(
                  meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.fat || 0), 0) +
                  (meal.dishes || []).reduce((dishSum, dish) => 
                    dishSum + dish.ingredients.reduce((ingSum, ing) => ingSum + (ing.nutrition.fat || 0), 0), 0)
                )}g</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.grey3} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    margin: 15,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey3,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 10,
  }
});

export default TodaysMeals; 