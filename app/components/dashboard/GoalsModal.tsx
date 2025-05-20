import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../constants';
import { calculateGoals, ActivityLevel, GoalType, createNutritionGoals } from '../../utils/calculators';
import { NutritionGoals } from '../../../types';

// Constants for activity levels and goals
const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 'sedentary' as ActivityLevel },
  { label: 'Lightly Active', value: 'lightly active' as ActivityLevel },
  { label: 'Moderately Active', value: 'moderately active' as ActivityLevel },
  { label: 'Very Active', value: 'very active' as ActivityLevel },
  { label: 'Extra Active', value: 'extra active' as ActivityLevel },
];

const GOALS = [
  { label: 'Lose Weight', value: 'lose weight' as GoalType },
  { label: 'Maintain Weight', value: 'maintain' as GoalType },
  { label: 'Gain Weight', value: 'gain weight' as GoalType },
  { label: 'Build Muscle', value: 'build muscle' as GoalType },
];

interface GoalsModalProps {
  visible: boolean;
  onClose: () => void;
}

const GoalsModal: React.FC<GoalsModalProps> = ({ visible, onClose }) => {
  const { goals, setGoals, markGoalsCompleted } = useContext(AppContext);
  
  // Goal setting state with calculator approach
  const [weight, setWeight] = useState(goals?.weight ? goals.weight.toString() : '70');
  const [height, setHeight] = useState(goals?.height ? goals.height.toString() : '170');
  const [age, setAge] = useState(goals?.age ? goals.age.toString() : '30');
  const [gender, setGender] = useState<'male' | 'female'>(goals?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    (goals?.activityLevel as ActivityLevel) || 'moderately active'
  );
  const [goalType, setGoalType] = useState<GoalType>(
    (goals?.goal as GoalType) || 'maintain'
  );
  
  // Custom dropdown state
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  
  // Manual entry state
  const [activeTab, setActiveTab] = useState<'calculator' | 'manual'>('calculator');
  const [manualCalories, setManualCalories] = useState(goals?.calories ? goals.calories.toString() : '2000');
  const [manualProtein, setManualProtein] = useState(goals?.protein ? goals.protein.toString() : '100');
  const [manualCarbs, setManualCarbs] = useState(goals?.carbs ? goals.carbs.toString() : '200');
  const [manualFat, setManualFat] = useState(goals?.fat ? goals.fat.toString() : '70');
  
  const [calculatedGoals, setCalculatedGoals] = useState({
    calories: goals?.calories || 0,
    protein: goals?.protein || 0,
    carbs: goals?.carbs || 0,
    fat: goals?.fat || 0,
  });

  // Update state when goals change externally
  useEffect(() => {
    if (goals) {
      setWeight(goals.weight ? goals.weight.toString() : '70');
      setHeight(goals.height ? goals.height.toString() : '170');
      setAge(goals.age ? goals.age.toString() : '30');
      setGender(goals.gender || 'male');
      setActivityLevel((goals.activityLevel as ActivityLevel) || 'moderately active');
      setGoalType((goals.goal as GoalType) || 'maintain');
      setManualCalories(goals.calories ? goals.calories.toString() : '2000');
      setManualProtein(goals.protein ? goals.protein.toString() : '100');
      setManualCarbs(goals.carbs ? goals.carbs.toString() : '200');
      setManualFat(goals.fat ? goals.fat.toString() : '70');
      setCalculatedGoals({
        calories: goals.calories || 0,
        protein: goals.protein || 0,
        carbs: goals.carbs || 0,
        fat: goals.fat || 0,
      });
    }
  }, [goals]);

  // Calculate goals when inputs change for calculator tab
  useEffect(() => {
    if (activeTab === 'calculator') {
      computeGoals();
    }
  }, [weight, height, age, gender, activityLevel, goalType, activeTab]);

  // Use the shared calculation utility to compute nutrition goals
  const computeGoals = () => {
    try {
      const weightKg = Number(weight);
      const heightCm = Number(height);
      const ageYears = Number(age);

      if ([weightKg, heightCm, ageYears].some((n) => !Number.isFinite(n))) {
        console.warn("Invalid numeric input for goals calculation");
        return;
      }

      const result = calculateGoals(
        weightKg,
        heightCm,
        ageYears,
        gender,
        activityLevel,
        goalType
      );
      
      setCalculatedGoals(result);
      return result;
    } catch (error) {
      console.error('Error calculating goals:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const saveGoals = async () => {
    try {
      let newGoals;
      
      if (activeTab === 'calculator') {
        // Get values from calculator
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const ageNum = parseFloat(age);
        
        if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
          Alert.alert('Input Error', 'Please enter valid numbers for weight, height, and age');
          return;
        }
        
        // Use the shared utility to create a consistent goals object
        newGoals = createNutritionGoals({
          weight: weightNum,
          height: heightNum,
          age: ageNum,
          gender,
          activityLevel,
          goal: goalType
        });
      } else {
        // Get values from manual entry
        const caloriesNum = parseInt(manualCalories);
        const proteinNum = parseInt(manualProtein);
        const carbsNum = parseInt(manualCarbs);
        const fatNum = parseInt(manualFat);
        
        if (isNaN(caloriesNum) || isNaN(proteinNum) || isNaN(carbsNum) || isNaN(fatNum)) {
          Alert.alert('Input Error', 'Please enter valid numbers for all nutrition goals');
          return;
        }
        
        // For manual entry, we'll use existing personal details if available, or defaults
        newGoals = {
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fat: fatNum,
          weight: parseFloat(weight) || 70,
          height: parseFloat(height) || 170,
          age: parseFloat(age) || 30,
          gender: gender || 'male',
          activityLevel: activityLevel || 'moderately active',
          goal: goalType || 'maintain',
        };
      }
      
      await setGoals(newGoals);
      
      // Mark goals setup as completed
      await markGoalsCompleted();
      
      onClose();
      Alert.alert('Success', 'Your nutrition goals have been updated!');
    } catch (error) {
      console.error('Error saving goals:', error);
      Alert.alert('Error', 'Failed to save your goals. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.goalModalContainer}>
        <View style={styles.goalModalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Nutrition Goals</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.darkGrey} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Tabs for different ways to set goals */}
            <View style={styles.goalTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.goalTab,
                  activeTab === "calculator" && styles.activeGoalTab,
                ]}
                onPress={() => setActiveTab("calculator")}
              >
                <Text
                  style={[
                    styles.goalTabText,
                    activeTab === "calculator" && styles.activeGoalTabText,
                  ]}
                >
                  Calculator
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.goalTab,
                  activeTab === "manual" && styles.activeGoalTab,
                ]}
                onPress={() => setActiveTab("manual")}
              >
                <Text
                  style={[
                    styles.goalTabText,
                    activeTab === "manual" && styles.activeGoalTabText,
                  ]}
                >
                  Manual Entry
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "calculator" ? (
              <>
                <Text style={styles.sectionHeader}>Personal Details</Text>

                <View style={styles.infoCard}>
                  <View style={styles.inputRow}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}
                    >
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="Enter weight"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Height (cm)</Text>
                      <TextInput
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="Enter height"
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}
                    >
                      <Text style={styles.inputLabel}>Age</Text>
                      <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholder="Enter age"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <View style={styles.segmentedControl}>
                        <TouchableOpacity
                          style={[
                            styles.segmentedOption,
                            gender === "male" && styles.segmentedOptionSelected,
                          ]}
                          onPress={() => setGender("male")}
                        >
                          <Text
                            style={[
                              styles.segmentedOptionText,
                              gender === "male" &&
                                styles.segmentedOptionTextSelected,
                            ]}
                          >
                            Male
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.segmentedOption,
                            gender === "female" &&
                              styles.segmentedOptionSelected,
                          ]}
                          onPress={() => setGender("female")}
                        >
                          <Text
                            style={[
                              styles.segmentedOptionText,
                              gender === "female" &&
                                styles.segmentedOptionTextSelected,
                            ]}
                          >
                            Female
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionHeader}>Activity & Goals</Text>

                <View style={styles.infoCard}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Activity Level</Text>
                    <View style={styles.customSelectContainer}>
                      <TouchableOpacity
                        style={styles.customSelect}
                        onPress={() => setShowActivityPicker(true)}
                      >
                        <Text style={styles.customSelectText}>
                          {ACTIVITY_LEVELS.find(
                            (item) => item.value === activityLevel
                          )?.label || "Select Activity Level"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>

                    {showActivityPicker && (
                      <View style={styles.pickerOptionsContainer}>
                        {ACTIVITY_LEVELS.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.pickerOption,
                              activityLevel === option.value &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => {
                              setActivityLevel(option.value);
                              setShowActivityPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                activityLevel === option.value &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Goal</Text>
                    <View style={styles.customSelectContainer}>
                      <TouchableOpacity
                        style={styles.customSelect}
                        onPress={() => setShowGoalPicker(true)}
                      >
                        <Text style={styles.customSelectText}>
                          {GOALS.find((item) => item.value === goalType)
                            ?.label || "Select Goal"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>

                    {showGoalPicker && (
                      <View style={styles.pickerOptionsContainer}>
                        {GOALS.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.pickerOption,
                              goalType === option.value &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => {
                              setGoalType(option.value);
                              setShowGoalPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                goalType === option.value &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </>
            ) : (
              // Manual Entry Tab
              <View style={styles.manualEntryContainer}>
                <Text style={styles.sectionHeader}>Set Custom Targets</Text>

                <View style={styles.infoCard}>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>Daily Calories</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            "About Calories",
                            "Calories are a measure of energy from food. Your body needs calories to function properly."
                          )
                        }
                      >
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={manualCalories}
                      onChangeText={setManualCalories}
                      keyboardType="numeric"
                      placeholder="e.g., 2000"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>Protein (g)</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            "About Protein",
                            "Protein is essential for building muscle and repairing tissues. It's recommended to consume 0.8-2.0g per kg of body weight."
                          )
                        }
                      >
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={manualProtein}
                      onChangeText={setManualProtein}
                      keyboardType="numeric"
                      placeholder="e.g., 150"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>Carbs (g)</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            "About Carbohydrates",
                            "Carbohydrates are your body's main energy source. They typically make up 45-65% of your total daily calories."
                          )
                        }
                      >
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={manualCarbs}
                      onChangeText={setManualCarbs}
                      keyboardType="numeric"
                      placeholder="e.g., 250"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>Fat (g)</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            "About Fat",
                            "Dietary fat is essential for hormone production and nutrient absorption. It typically makes up 20-35% of your total daily calories."
                          )
                        }
                      >
                        <Ionicons
                          name="information-circle"
                          size={18}
                          color={COLORS.blueGrey}
                        />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={manualFat}
                      onChangeText={setManualFat}
                      keyboardType="numeric"
                      placeholder="e.g., 70"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.resultsContainer}>
              <Text style={styles.sectionHeader}>Calculated Targets</Text>

              <View style={styles.macroResultsGrid}>
                <View style={styles.macroResultsBox}>
                  <Ionicons name="flame" size={24} color={COLORS.orange} />
                  <Text style={styles.macroResultValue}>
                    {activeTab === "calculator"
                      ? calculatedGoals.calories
                      : parseInt(manualCalories) || 0}
                  </Text>
                  <Text style={styles.macroResultLabel}>Calories</Text>
                </View>

                <View style={styles.macroResultsBox}>
                  <Ionicons name="body" size={24} color={COLORS.success} />
                  <Text style={styles.macroResultValue}>
                    {activeTab === "calculator"
                      ? calculatedGoals.protein
                      : parseInt(manualProtein) || 0}
                    g
                  </Text>
                  <Text style={styles.macroResultLabel}>Protein</Text>
                </View>

                <View style={styles.macroResultsBox}>
                  <Ionicons name="apps" size={24} color={COLORS.blue} />
                  <Text style={styles.macroResultValue}>
                    {activeTab === "calculator"
                      ? calculatedGoals.carbs
                      : parseInt(manualCarbs) || 0}
                    g
                  </Text>
                  <Text style={styles.macroResultLabel}>Carbs</Text>
                </View>

                <View style={styles.macroResultsBox}>
                  <Ionicons name="water" size={24} color={COLORS.error3} />
                  <Text style={styles.macroResultValue}>
                    {activeTab === "calculator"
                      ? calculatedGoals.fat
                      : parseInt(manualFat) || 0}
                    g
                  </Text>
                  <Text style={styles.macroResultLabel}>Fat</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveGoalsButton}
              onPress={saveGoals}
            >
              <Text style={styles.saveGoalsText}>Save Goals</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  goalModalContainer: {
    flex: 1,
    backgroundColor: COLORS.opaqueBlack,
    justifyContent: "flex-end",
  },
  goalModalContent: {
    backgroundColor: COLORS.cardBackground3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey3,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    padding: 20,
  },
  goalTabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  goalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeGoalTab: {
    backgroundColor: COLORS.cardBackground,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  activeGoalTabText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.grey3,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: COLORS.cardBackground3,
    borderWidth: 1,
    borderColor: COLORS.grey3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentedOptionSelected: {
    backgroundColor: COLORS.secondary,
  },
  segmentedOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  segmentedOptionTextSelected: {
    color: COLORS.white,
  },
  customSelectContainer: {
    position: "relative",
  },
  customSelect: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground3,
    borderWidth: 1,
    borderColor: COLORS.grey3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  customSelectText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerOptionsContainer: {
    marginTop: 5,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grey3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey3,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.cardBackground3,
  },
  pickerOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  manualEntryContainer: {
    marginBottom: 20,
  },
  resultsContainer: {
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  macroResultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  macroResultsBox: {
    width: "48%",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  macroResultValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  macroResultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  saveGoalsButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  saveGoalsText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default GoalsModal; 