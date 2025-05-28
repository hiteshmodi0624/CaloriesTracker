import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { COLORS } from '../../constants';
import { calculateGoals, ActivityLevel, GoalType, createNutritionGoals } from '../../utils/calculators';
import { NutritionGoals } from '../../../types';
import { FynkoTextInput } from '../common';

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
  
  // Track which field was last changed to determine calculation direction
  const [lastChangedField, setLastChangedField] = useState<'calories' | 'macros'>('macros');
  
  // Lock states for manual entry
  const [lockedFields, setLockedFields] = useState({
    protein: false,
    carbs: false,
    fat: false,
  });
  
  // Ref to prevent circular updates
  const isUpdatingRef = useRef(false);
  
  // Track if profile data has been loaded from AsyncStorage
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);

  const [calculatedGoals, setCalculatedGoals] = useState({
    calories: goals?.calories || 0,
    protein: goals?.protein || 0,
    carbs: goals?.carbs || 0,
    fat: goals?.fat || 0,
  });

  // Load profile information from AsyncStorage when modal opens
  useEffect(() => {
    const loadProfileData = async () => {
      if (visible && !profileDataLoaded) {
        try {
          // Try to load profile data from AsyncStorage first
          const storedWeight = await AsyncStorage.getItem('user_weight');
          const storedHeight = await AsyncStorage.getItem('user_height');
          const storedAge = await AsyncStorage.getItem('user_age');
          const storedGender = await AsyncStorage.getItem('user_gender');
          
          // If we have stored profile data, use it
          if (storedWeight || storedHeight || storedAge || storedGender) {
            if (storedWeight && !goals?.weight) setWeight(storedWeight);
            if (storedHeight && !goals?.height) setHeight(storedHeight);
            if (storedAge && !goals?.age) setAge(storedAge);
            if (storedGender && !goals?.gender) setGender(storedGender as 'male' | 'female');
          }
          
          setProfileDataLoaded(true);
        } catch (error) {
          console.error('Error loading profile data:', error);
          setProfileDataLoaded(true);
        }
      }
    };
    
    loadProfileData();
  }, [visible, profileDataLoaded, goals]);

  // Reset profile data loaded flag when modal is closed
  useEffect(() => {
    if (!visible) {
      setProfileDataLoaded(false);
    }
  }, [visible]);

  // Update state when goals change externally
  useEffect(() => {
    if (goals) {
      setWeight(goals.weight ? goals.weight.toString() : (weight || '70'));
      setHeight(goals.height ? goals.height.toString() : (height || '170'));
      setAge(goals.age ? goals.age.toString() : (age || '30'));
      setGender(goals.gender || gender || 'male');
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
      // Reset the last changed field when goals are loaded externally
      setLastChangedField('macros');
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
        
        if (weightNum <= 0 || heightNum <= 0 || ageNum <= 0) {
          Alert.alert('Input Error', 'Weight, height, and age must be positive numbers');
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
        
        // Check for negative values
        if (caloriesNum < 0 || proteinNum < 0 || carbsNum < 0 || fatNum < 0) {
          Alert.alert('Validation Error', 'All nutrition values must be positive numbers. Please check your inputs.');
          return;
        }
        
        // Check if calories add up correctly (with 5% tolerance for rounding)
        const calculatedCalories = calculateCaloriesFromMacros(proteinNum, carbsNum, fatNum);
        const calorieDifference = Math.abs(calculatedCalories - caloriesNum);
        const tolerance = Math.max(caloriesNum * 0.05, 10); // 5% tolerance or minimum 10 calories
        
        if (calorieDifference > tolerance) {
          Alert.alert(
            'Calorie Mismatch', 
            `The macros don't match the calories:\n\n` +
            `• Entered calories: ${caloriesNum}\n` +
            `• Calculated from macros: ${calculatedCalories}\n` +
            `• Difference: ${calorieDifference} calories\n\n` +
            `Please adjust your values so they match more closely.`
          );
          return;
        }
        
        // Check for unrealistic values
        if (caloriesNum > 10000) {
          Alert.alert('Validation Error', 'Calorie target seems too high (over 10,000). Please enter a realistic value.');
          return;
        }
        
        if (proteinNum > 1000 || carbsNum > 2000 || fatNum > 500) {
          Alert.alert('Validation Error', 'One or more macro values seem unrealistically high. Please check your inputs.');
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

  // Helper functions for manual entry calculations
  const calculateCaloriesFromMacros = (protein: number, carbs: number, fat: number): number => {
    // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
    return Math.round((protein * 4) + (carbs * 4) + (fat * 9));
  };

  const calculateMacrosFromCalories = (calories: number, currentProtein: number, currentCarbs: number, currentFat: number) => {
    // Calculate calories from locked macros
    const lockedCalories = 
      (lockedFields.protein ? currentProtein * 4 : 0) +
      (lockedFields.carbs ? currentCarbs * 4 : 0) +
      (lockedFields.fat ? currentFat * 9 : 0);
    
    // Remaining calories to distribute among unlocked macros
    const remainingCalories = calories - lockedCalories;
    
    // Count unlocked fields
    const unlockedFields = [];
    if (!lockedFields.protein) unlockedFields.push('protein');
    if (!lockedFields.carbs) unlockedFields.push('carbs');
    if (!lockedFields.fat) unlockedFields.push('fat');
    
    if (unlockedFields.length === 0) {
      // All fields are locked, return current values
      return {
        protein: currentProtein,
        carbs: currentCarbs,
        fat: currentFat
      };
    }
    
    // If locked macros exceed total calories, set unlocked macros to 0
    if (lockedCalories > calories) {
      return {
        protein: lockedFields.protein ? currentProtein : 0,
        carbs: lockedFields.carbs ? currentCarbs : 0,
        fat: lockedFields.fat ? currentFat : 0
      };
    }
    
    // Calculate current calories from unlocked macros only
    const currentUnlockedCalories = 
      (!lockedFields.protein ? currentProtein * 4 : 0) +
      (!lockedFields.carbs ? currentCarbs * 4 : 0) +
      (!lockedFields.fat ? currentFat * 9 : 0);
    
    if (currentUnlockedCalories === 0) {
      // No current unlocked macros, use standard ratios for unlocked fields
      const proteinRatio = !lockedFields.protein ? 0.30 : 0;
      const carbsRatio = !lockedFields.carbs ? 0.40 : 0;
      const fatRatio = !lockedFields.fat ? 0.30 : 0;
      const totalRatio = proteinRatio + carbsRatio + fatRatio;
      
      if (totalRatio === 0) {
        return {
          protein: currentProtein,
          carbs: currentCarbs,
          fat: currentFat
        };
      }
      
      return {
        protein: lockedFields.protein ? currentProtein : Math.round((remainingCalories * (proteinRatio / totalRatio)) / 4),
        carbs: lockedFields.carbs ? currentCarbs : Math.round((remainingCalories * (carbsRatio / totalRatio)) / 4),
        fat: lockedFields.fat ? currentFat : Math.round((remainingCalories * (fatRatio / totalRatio)) / 9)
      };
    }
    
    // Scale unlocked macros proportionally based on remaining calories
    const ratio = remainingCalories / currentUnlockedCalories;
    
    return {
      protein: lockedFields.protein ? currentProtein : Math.round(currentProtein * ratio),
      carbs: lockedFields.carbs ? currentCarbs : Math.round(currentCarbs * ratio),
      fat: lockedFields.fat ? currentFat : Math.round(currentFat * ratio)
    };
  };

  const toggleLock = (field: 'protein' | 'carbs' | 'fat') => {
    setLockedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleManualProteinChange = (value: string) => {
    // Only allow positive numbers
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setManualProtein(value);
      
      // Prevent circular updates
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setLastChangedField('macros');
        
        const protein = parseFloat(value) || 0;
        const carbs = parseFloat(manualCarbs) || 0;
        const fat = parseFloat(manualFat) || 0;
        
        const newCalories = calculateCaloriesFromMacros(protein, carbs, fat);
        setManualCalories(newCalories.toString());
        
        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    }
  };

  const handleManualCarbsChange = (value: string) => {
    // Only allow positive numbers
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setManualCarbs(value);
      
      // Prevent circular updates
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setLastChangedField('macros');
        
        const protein = parseFloat(manualProtein) || 0;
        const carbs = parseFloat(value) || 0;
        const fat = parseFloat(manualFat) || 0;
        
        const newCalories = calculateCaloriesFromMacros(protein, carbs, fat);
        setManualCalories(newCalories.toString());
        
        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    }
  };

  const handleManualFatChange = (value: string) => {
    // Only allow positive numbers
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setManualFat(value);
      
      // Prevent circular updates
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setLastChangedField('macros');
        
        const protein = parseFloat(manualProtein) || 0;
        const carbs = parseFloat(manualCarbs) || 0;
        const fat = parseFloat(value) || 0;
        
        const newCalories = calculateCaloriesFromMacros(protein, carbs, fat);
        setManualCalories(newCalories.toString());
        
        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    }
  };

  const handleManualCaloriesChange = (value: string) => {
    // Only allow positive numbers
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
      setManualCalories(value);
      
      // Prevent circular updates
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setLastChangedField('calories');
        
        const calories = parseFloat(value) || 0;
        const currentProtein = parseFloat(manualProtein) || 0;
        const currentCarbs = parseFloat(manualCarbs) || 0;
        const currentFat = parseFloat(manualFat) || 0;
        
        const newMacros = calculateMacrosFromCalories(calories, currentProtein, currentCarbs, currentFat);
        setManualProtein(newMacros.protein.toString());
        setManualCarbs(newMacros.carbs.toString());
        setManualFat(newMacros.fat.toString());
        
        // Reset the flag after a brief delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    }
  };

  // Helper function to check if locked macros exceed calorie target
  const getLockedCaloriesWarning = () => {
    if (activeTab !== 'manual') return null;
    
    const protein = parseFloat(manualProtein) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFat) || 0;
    const calories = parseFloat(manualCalories) || 0;
    
    const lockedCalories = 
      (lockedFields.protein ? protein * 4 : 0) +
      (lockedFields.carbs ? carbs * 4 : 0) +
      (lockedFields.fat ? fat * 9 : 0);
    
    if (lockedCalories > calories && (lockedFields.protein || lockedFields.carbs || lockedFields.fat)) {
      return (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color={COLORS.error} />
          <Text style={styles.warningText}>
            Locked macros ({lockedCalories} cal) exceed total calories ({calories} cal). 
            Unlock some macros or increase calories.
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Helper function to get validation errors for manual entry
  const getValidationErrors = () => {
    if (activeTab !== 'manual') return null;
    
    const protein = parseFloat(manualProtein) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFat) || 0;
    const calories = parseFloat(manualCalories) || 0;
    
    const errors = [];
    
    // Check for negative values
    if (protein < 0 || carbs < 0 || fat < 0 || calories < 0) {
      errors.push('All values must be positive numbers');
    }
    
    // Check calorie mismatch
    const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fat);
    const calorieDifference = Math.abs(calculatedCalories - calories);
    const tolerance = Math.max(calories * 0.05, 10);
    
    if (calorieDifference > tolerance && calories > 0) {
      errors.push(`Calorie mismatch: ${calories} entered vs ${calculatedCalories} calculated`);
    }
    
    // Check for unrealistic values
    if (calories > 10000) {
      errors.push('Calorie target seems too high (over 10,000)');
    }
    
    if (protein > 1000 || carbs > 2000 || fat > 500) {
      errors.push('One or more macro values seem unrealistically high');
    }
    
    if (errors.length > 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <View style={styles.errorTextContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>• {error}</Text>
            ))}
          </View>
        </View>
      );
    }
    
    return null;
  };

  // Helper function to check if save should be disabled
  const isSaveDisabled = () => {
    if (activeTab !== 'manual') return false;
    
    const protein = parseFloat(manualProtein) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFat) || 0;
    const calories = parseFloat(manualCalories) || 0;
    
    // Check for negative values
    if (protein < 0 || carbs < 0 || fat < 0 || calories < 0) return true;
    
    // Check calorie mismatch
    const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fat);
    const calorieDifference = Math.abs(calculatedCalories - calories);
    const tolerance = Math.max(calories * 0.05, 10);
    
    if (calorieDifference > tolerance && calories > 0) return true;
    
    // Check for unrealistic values
    if (calories > 10000) return true;
    if (protein > 1000 || carbs > 2000 || fat > 500) return true;
    
    return false;
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
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
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
                    <View style={[{ flex: 1, marginRight: 10 }]}>
                      <FynkoTextInput
                        backgroundColor={COLORS.cardBackground}
                        label="Weight (kg)"
                        style={styles.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholder="Enter weight"
                      />
                    </View>

                    <View style={[{ flex: 1 }]}>
                      <FynkoTextInput
                        backgroundColor={COLORS.cardBackground}
                        label="Height (cm)"
                        style={styles.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholder="Enter height"
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[{ flex: 1, marginRight: 10 }]}>
                      <FynkoTextInput
                        backgroundColor={COLORS.cardBackground}
                        label="Age"
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholder="Enter age"
                      />
                    </View>

                    <View style={[{ flex: 1, paddingHorizontal: 8 }]}>
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

                <View style={styles.infoTextContainer}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={COLORS.blue}
                  />
                  <Text style={styles.infoText}>
                    Values are automatically synchronized. Change macros to
                    update calories, or change calories to adjust macros
                    proportionally. Use lock icons to keep specific values
                    fixed.
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <FynkoTextInput
                    label="Daily Calories"
                    style={styles.input}
                    value={manualCalories}
                    onChangeText={handleManualCaloriesChange}
                    keyboardType="numeric"
                    placeholder="e.g., 2000"
                    backgroundColor={COLORS.cardBackground}
                  />

                  <View style={styles.inputWithLock}>
                    <View style={styles.inputContainer}>
                      <FynkoTextInput
                        label="Protein (g)"
                        style={styles.input}
                        value={manualProtein}
                        onChangeText={handleManualProteinChange}
                        keyboardType="numeric"
                        placeholder="e.g., 150"
                        backgroundColor={COLORS.cardBackground}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.lockButton,
                        lockedFields.protein && styles.lockButtonActive,
                      ]}
                      onPress={() => toggleLock("protein")}
                    >
                      <Ionicons
                        name={
                          lockedFields.protein ? "lock-closed" : "lock-open"
                        }
                        size={20}
                        color={
                          lockedFields.protein
                            ? COLORS.white
                            : COLORS.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWithLock}>
                    <View style={styles.inputContainer}>
                      <FynkoTextInput
                        label="Carbs (g)"
                        style={styles.input}
                        value={manualCarbs}
                        onChangeText={handleManualCarbsChange}
                        keyboardType="numeric"
                        placeholder="e.g., 250"
                        backgroundColor={COLORS.cardBackground}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.lockButton,
                        lockedFields.carbs && styles.lockButtonActive,
                      ]}
                      onPress={() => toggleLock("carbs")}
                    >
                      <Ionicons
                        name={lockedFields.carbs ? "lock-closed" : "lock-open"}
                        size={20}
                        color={
                          lockedFields.carbs
                            ? COLORS.white
                            : COLORS.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWithLock}>
                    <View style={styles.inputContainer}>
                      <FynkoTextInput
                        label="Fat (g)"
                        style={styles.input}
                        value={manualFat}
                        onChangeText={handleManualFatChange}
                        keyboardType="numeric"
                        placeholder="e.g., 70"
                        backgroundColor={COLORS.cardBackground}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.lockButton,
                        lockedFields.fat && styles.lockButtonActive,
                      ]}
                      onPress={() => toggleLock("fat")}
                    >
                      <Ionicons
                        name={lockedFields.fat ? "lock-closed" : "lock-open"}
                        size={20}
                        color={
                          lockedFields.fat ? COLORS.white : COLORS.textSecondary
                        }
                      />
                    </TouchableOpacity>
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

            {getLockedCaloriesWarning()}

            {getValidationErrors()}

            <TouchableOpacity
              style={[
                styles.saveGoalsButton,
                isSaveDisabled() && styles.saveGoalsButtonDisabled,
              ]}
              onPress={saveGoals}
              disabled={isSaveDisabled()}
            >
              <Text
                style={[
                  styles.saveGoalsText,
                  isSaveDisabled() && styles.saveGoalsTextDisabled,
                ]}
              >
                Save Goals
              </Text>
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
    backgroundColor: COLORS.cardBackground,
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
    backgroundColor: COLORS.cardBackground2,
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentedOptionSelected: {
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.cardBackground,
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
    borderColor: COLORS.grey,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.cardBackground2,
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
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
  infoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 5,
  },
  inputWithLock: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
  },
  lockButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  lockButtonActive: {
    backgroundColor: COLORS.primary,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  errorTextContainer: {
    marginLeft: 5,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  saveGoalsButtonDisabled: {
    backgroundColor: COLORS.grey,
  },
  saveGoalsTextDisabled: {
    color: COLORS.textSecondary,
  },
});

export default GoalsModal; 