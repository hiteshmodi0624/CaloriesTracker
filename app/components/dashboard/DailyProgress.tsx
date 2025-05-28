import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyProgressProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goals: NutritionGoals | null;
  onEditGoals: () => void;
}

const DailyProgress: React.FC<DailyProgressProps> = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  goals,
  onEditGoals
}) => {
  if (!goals) {
    return (
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>No Goals Set</Text>
        <Text style={styles.goalSubtitle}>
          Set your nutrition goals to track your progress
        </Text>
        <TouchableOpacity 
          style={styles.setGoalsButton} 
          onPress={onEditGoals}
        >
          <Text style={styles.setGoalsButtonText}>Set Goals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calorieProgress = (totalCalories / goals.calories) * 100;
  const proteinProgress = (totalProtein / goals.protein) * 100;
  const carbsProgress = (totalCarbs / goals.carbs) * 100;
  const fatProgress = (totalFat / goals.fat) * 100;

  // Calculate remaining nutrients
  const remainingCalories = Math.max(0, goals.calories - totalCalories);
  const remainingProtein = Math.max(0, goals.protein - totalProtein);
  const remainingCarbs = Math.max(0, goals.carbs - totalCarbs);
  const remainingFat = Math.max(0, goals.fat - totalFat);

  return (
    <View style={styles.goalCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.summaryTitle}>Today's Progress</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onEditGoals}
        >
          <Text style={styles.viewAllText}>Edit Goals</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
          <Text style={styles.summaryLabel}>Consumed</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{Math.round(remainingCalories)}</Text>
          <Text style={styles.summaryLabel}>Remaining</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{goals.calories}</Text>
          <Text style={styles.summaryLabel}>Daily Goal</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <View style={styles.progressLabelRow}>
            <View style={styles.macroIconContainer}>
              <Ionicons name="flame" size={14} color={COLORS.orange} />
            </View>
            <Text style={styles.progressLabel}>Calories</Text>
            <Text style={styles.progressValue}>
              {Math.round(totalCalories)} / {goals.calories} kcal
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(calorieProgress, 100)}%`, backgroundColor: COLORS.orange }
              ]} 
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressLabelRow}>
            <View style={styles.macroIconContainer}>
              <Ionicons name="body" size={14} color={COLORS.success} />
            </View>
            <Text style={styles.progressLabel}>Protein</Text>
            <Text style={styles.progressValue}>
              {Math.round(totalProtein)} / {goals.protein}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(proteinProgress, 100)}%`, backgroundColor: COLORS.success }
              ]} 
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressLabelRow}>
            <View style={styles.macroIconContainer}>
              <Ionicons name="apps" size={14} color={COLORS.blue} />
            </View>
            <Text style={styles.progressLabel}>Carbs</Text>
            <Text style={styles.progressValue}>
              {Math.round(totalCarbs)} / {goals.carbs}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(carbsProgress, 100)}%`, backgroundColor: COLORS.blue }
              ]} 
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressLabelRow}>
            <View style={styles.macroIconContainer}>
              <Ionicons name="water" size={14} color={COLORS.error} />
            </View>
            <Text style={styles.progressLabel}>Fat</Text>
            <Text style={styles.progressValue}>
              {Math.round(totalFat)} / {goals.fat}g
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(fatProgress, 100)}%`, backgroundColor: COLORS.error }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  goalCard: {
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
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  goalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  setGoalsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  setGoalsButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 10,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressItem: {
    marginBottom: 15,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  progressValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default DailyProgress; 