import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../../../types';
import { COLORS } from '../../constants';

interface DayDetailProps {
  visible: boolean;
  onClose: () => void;
  onSelectMeal: (meal: Meal) => void;
  day: {
    date: string;
    meals: Meal[];
    totalCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    }
  } | null;
  goals?: {
    calories: number;
  };
}

const DayDetailModal: React.FC<DayDetailProps> = ({ 
  visible, 
  onClose, 
  day, 
  goals,
  onSelectMeal
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split('T')[0];
  };

  if (!day) return null;

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
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>{formatDate(day.date)}</Text>
              {isToday(day.date) && (
                <View style={styles.todayBadgeContainer}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.darkGrey} />
            </TouchableOpacity>
          </View>

          <View style={styles.dayCalorieCard}>
            <View style={styles.dayCalorieHeader}>
              <View>
                <Text style={styles.dayCalorieValue}>
                  {Math.round(day.totalCalories)}
                </Text>
                <Text style={styles.dayCalorieLabel}>Total Calories</Text>
              </View>

              {goals?.calories && (
                <View style={styles.dayGoalPercentContainer}>
                  <View style={styles.dayGoalPercentCircle}>
                    <Text style={styles.dayGoalPercentText}>
                      {Math.round((day.totalCalories / goals.calories) * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.dayGoalLabel}>of daily goal</Text>
                </View>
              )}
            </View>

            {goals?.calories && (
              <View style={styles.dayProgressContainer}>
                <View style={styles.dayProgressBar}>
                  <View
                    style={[
                      styles.dayProgressFill,
                      {
                        width: `${Math.min(
                          100,
                          (day.totalCalories / goals.calories) * 100
                        )}%`,
                        backgroundColor:
                          day.totalCalories > goals.calories
                            ? COLORS.error
                            : COLORS.secondary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.dayProgressLabels}>
                  <Text style={styles.dayProgressLabel}>0</Text>
                  <Text style={styles.dayProgressLabel}>{goals.calories}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.dayNutritionSummary}>
            <View style={styles.totalCaloriesDisplay}>
              <Text style={styles.totalCaloriesValue}>
                {Math.round(day.totalCalories)}
              </Text>
              <Text style={styles.totalCaloriesLabel}>Total Calories</Text>
            </View>

            <View style={styles.dayMacroSummary}>
              <View style={styles.dayMacroItem}>
                <Ionicons name="body-outline" size={20} color={COLORS.success} />
                <Text style={styles.dayMacroValue}>
                  {Math.round(day.macros.protein)}g
                </Text>
                <Text style={styles.dayMacroLabel}>Protein</Text>
              </View>

              <View style={styles.dayMacroItem}>
                <Ionicons name="apps-outline" size={20} color={COLORS.blue} />
                <Text style={styles.dayMacroValue}>
                  {Math.round(day.macros.carbs)}g
                </Text>
                <Text style={styles.dayMacroLabel}>Carbs</Text>
              </View>

              <View style={styles.dayMacroItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.error} />
                <Text style={styles.dayMacroValue}>
                  {Math.round(day.macros.fat)}g
                </Text>
                <Text style={styles.dayMacroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          <Text style={styles.dayMealsTitle}>Meals</Text>

          <View style={styles.dayMealsSectionCard}>
            <Text style={styles.daySectionTitle}>Meals</Text>

            {day.meals.length === 0 ? (
              <View style={styles.emptyMealsContainer}>
                <Ionicons name="restaurant-outline" size={50} color={COLORS.grey3} />
                <Text style={styles.emptyText}>
                  No meals recorded for this day
                </Text>
                <Text style={styles.emptySubtext}>
                  Any meals you add for this date will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={day.meals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.dayMealsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dayMealCard}
                    onPress={() => onSelectMeal(item)}
                  >
                    <View style={styles.dayMealIconContainer}>
                      <Ionicons name="restaurant" size={18} color={COLORS.white} />
                    </View>
                    <View style={styles.dayMealInfo}>
                      <Text style={styles.dayMealName}>{item.name}</Text>
                      <Text style={styles.dayMealCalories}>
                        {Math.round(item.totalCalories)} calories
                      </Text>

                      <View style={styles.dayMealMacros}>
                        <Text style={styles.dayMealMacroText}>
                          P:{" "}
                          {Math.round(
                            item.ingredients.reduce(
                              (sum, ing) => sum + (ing.nutrition.protein || 0),
                              0
                            ) +
                              (item.dishes || []).reduce(
                                (dishSum, dish) =>
                                  dishSum +
                                  dish.ingredients.reduce(
                                    (ingSum, ing) =>
                                      ingSum + (ing.nutrition.protein || 0),
                                    0
                                  ),
                                0
                              )
                          )}
                          g
                        </Text>
                        <Text style={styles.dayMealMacroText}>
                          C:{" "}
                          {Math.round(
                            item.ingredients.reduce(
                              (sum, ing) => sum + (ing.nutrition.carbs || 0),
                              0
                            ) +
                              (item.dishes || []).reduce(
                                (dishSum, dish) =>
                                  dishSum +
                                  dish.ingredients.reduce(
                                    (ingSum, ing) =>
                                      ingSum + (ing.nutrition.carbs || 0),
                                    0
                                  ),
                                0
                              )
                          )}
                          g
                        </Text>
                        <Text style={styles.dayMealMacroText}>
                          F:{" "}
                          {Math.round(
                            item.ingredients.reduce(
                              (sum, ing) => sum + (ing.nutrition.fat || 0),
                              0
                            ) +
                              (item.dishes || []).reduce(
                                (dishSum, dish) =>
                                  dishSum +
                                  dish.ingredients.reduce(
                                    (ingSum, ing) =>
                                      ingSum + (ing.nutrition.fat || 0),
                                    0
                                  ),
                                0
                              )
                          )}
                          g
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.grey3}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </View>
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
    maxHeight: "90%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBluegrey3,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  todayBadgeContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  dayCalorieCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCalorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayCalorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dayCalorieLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dayGoalPercentContainer: {
    alignItems: 'center',
  },
  dayGoalPercentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayGoalPercentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dayGoalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dayProgressContainer: {
    marginTop: 10,
  },
  dayProgressBar: {
    height: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  dayProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayProgressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dayNutritionSummary: {
    marginBottom: 20,
  },
  totalCaloriesDisplay: {
    marginBottom: 10,
  },
  totalCaloriesValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalCaloriesLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dayMacroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: -5, // Compensate for the item margins
  },
  dayMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10,
    minWidth: 150,
  },
  dayMacroValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginHorizontal: 4,
    flexShrink: 1,
  },
  dayMacroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  dayMealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  dayMealsSectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  emptyMealsContainer: {
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
  dayMealsList: {
    paddingBottom: 20,
  },
  dayMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  dayMealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayMealInfo: {
    flex: 1,
  },
  dayMealName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dayMealCalories: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayMealMacros: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayMealMacroText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 10,
  },
});

export default DayDetailModal; 