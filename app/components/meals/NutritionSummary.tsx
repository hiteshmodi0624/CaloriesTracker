import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

interface NutritionSummaryProps {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const NutritionSummary: React.FC<NutritionSummaryProps> = ({ nutrition }) => {
  // Calculate macro percentages
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  const proteinPct = totalMacros > 0 ? Math.round((nutrition.protein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((nutrition.carbs / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.round((nutrition.fat / totalMacros) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Nutrition Summary</Text>
        <Text style={styles.calories}>{Math.round(nutrition.calories)} calories</Text>
      </View>
      
      <View style={styles.macrosContainer}>
        <View style={styles.macroProgressBar}>
          <View 
            style={[
              styles.macroProgressBarSegment, 
              styles.proteinBar,
              { flex: proteinPct }
            ]} 
          />
          <View 
            style={[
              styles.macroProgressBarSegment, 
              styles.carbsBar,
              { flex: carbsPct }
            ]} 
          />
          <View 
            style={[
              styles.macroProgressBarSegment, 
              styles.fatBar,
              { flex: fatPct }
            ]} 
          />
        </View>
        
        <View style={styles.macrosInfo}>
          <View style={styles.macroItem}>
            <View style={[styles.macroColorIndicator, styles.proteinIndicator]} />
            <View>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>
                {nutrition.protein.toFixed(1)}g ({proteinPct}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.macroItem}>
            <View style={[styles.macroColorIndicator, styles.carbsIndicator]} />
            <View>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>
                {nutrition.carbs.toFixed(1)}g ({carbsPct}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.macroItem}>
            <View style={[styles.macroColorIndicator, styles.fatIndicator]} />
            <View>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>
                {nutrition.fat.toFixed(1)}g ({fatPct}%)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  calories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.orange,
  },
  macrosContainer: {
    marginTop: 5,
  },
  macroProgressBar: {
    height: 12,
    backgroundColor: COLORS.lightBluegrey3,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 15,
  },
  macroProgressBarSegment: {
    height: '100%',
  },
  proteinBar: {
    backgroundColor: COLORS.darkPurple,
  },
  carbsBar: {
    backgroundColor: COLORS.orange,
  },
  fatBar: {
    backgroundColor: COLORS.error,
  },
  macrosInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  macroColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  proteinIndicator: {
    backgroundColor: COLORS.darkPurple,
  },
  carbsIndicator: {
    backgroundColor: COLORS.orange,
  },
  fatIndicator: {
    backgroundColor: COLORS.error,
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});

export default NutritionSummary; 