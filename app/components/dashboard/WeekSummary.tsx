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
interface DayData {
  date: string;
  meals: Meal[];
  mealCount: number;
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  }
}

interface WeekSummaryProps {
  days: DayData[];
  onViewAll: () => void;
  onSelectDay: (day: DayData) => void;
  goals?: {
    calories: number;
  };
}

const WeekSummary: React.FC<WeekSummaryProps> = ({ 
  days, 
  onViewAll, 
  onSelectDay,
  goals 
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

  return (
    <View style={styles.summaryCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.summaryTitle}>Last 7 Days</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onViewAll}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {days.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar-outline" size={50} color={COLORS.grey3} />
          <Text style={styles.emptyText}>No meal history</Text>
          <Text style={styles.emptySubtext}>Your meal history will appear here</Text>
        </View>
      ) : (
        <View style={styles.historyContainer}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={day.date}
              style={styles.historyDayCard}
              onPress={() => onSelectDay(day)}
            >
              <View style={styles.historyDayContent}>
                <View style={styles.historyDayInfo}>
                  <Text style={[
                    styles.historyDayDate,
                    isToday(day.date) && styles.todayText
                  ]}>
                    {formatDate(day.date)}
                    {isToday(day.date) && <Text style={styles.todayIndicator}> (Today)</Text>}
                  </Text>
                  
                  <View style={styles.historyMealsInfo}>
                    <Text style={styles.historyMealCount}>
                      {day.mealCount} {day.mealCount === 1 ? 'meal' : 'meals'}
                    </Text>
                    <Text style={styles.historyCalories}>{Math.round(day.totalCalories)} cal</Text>
                  </View>
                </View>
                
                <View style={styles.historyMacrosContainer}>
                  <View style={styles.historyMacroItem}>
                    <View style={[styles.historyMacroDot, { backgroundColor: COLORS.secondary }]} />
                    <Text style={styles.historyMacroLabel}>P:</Text>
                    <Text style={styles.historyMacroValue}>{Math.round(day.macros.protein)}g</Text>
                  </View>
                  
                  <View style={styles.historyMacroItem}>
                    <View style={[styles.historyMacroDot, { backgroundColor: COLORS.lightBlue }]} />
                    <Text style={styles.historyMacroLabel}>C:</Text>
                    <Text style={styles.historyMacroValue}>{Math.round(day.macros.carbs)}g</Text>
                  </View>
                  
                  <View style={styles.historyMacroItem}>
                    <View style={[styles.historyMacroDot, { backgroundColor: COLORS.orange2 }]} />
                    <Text style={styles.historyMacroLabel}>F:</Text>
                    <Text style={styles.historyMacroValue}>{Math.round(day.macros.fat)}g</Text>
                  </View>
                </View>
                
                {/* Progress bar for calories vs goals */}
                {goals?.calories && (
                  <View style={styles.historyProgressContainer}>
                    <View style={styles.historyProgressBar}>
                      <View 
                        style={[
                          styles.historyProgressFill, 
                          { 
                            width: `${Math.min(100, (day.totalCalories / goals.calories) * 100)}%`,
                            backgroundColor: day.totalCalories > goals.calories ? COLORS.error : COLORS.secondary 
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.historyProgressText}>
                      {Math.round((day.totalCalories / goals.calories) * 100)}% of goal
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.historyChevronContainer}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey3} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
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
  historyContainer: {
    marginTop: 10,
  },
  historyDayCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyDayContent: {
    flex: 1,
  },
  historyDayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDayDate: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  todayIndicator: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  historyMealsInfo: {
    alignItems: 'flex-end',
  },
  historyMealCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  historyCalories: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  historyMacrosContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  historyMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyMacroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  historyMacroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  historyMacroValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  historyProgressContainer: {
    marginTop: 5,
  },
  historyProgressBar: {
    height: 6,
    backgroundColor: COLORS.cardBackground2,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  historyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  historyProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  historyChevronContainer: {
    justifyContent: 'center',
    paddingLeft: 5,
  },
});

export default WeekSummary; 