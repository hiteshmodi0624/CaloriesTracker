import React, { useContext, useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import { Meal } from '../../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Activity level types
type ActivityLevel = 'sedentary' | 'lightly active' | 'moderately active' | 'very active' | 'extra active';
type GoalType = 'lose weight' | 'maintain' | 'gain weight' | 'build muscle';

// Define NutritionGoals type locally to match AppContext
type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
};

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

const Dashboard: React.FC = () => {
  const { meals, goals, setGoals, deleteMeal, updateMeal } = useContext(AppContext);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  
  // Goal setting state
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
  
  const [calculatedGoals, setCalculatedGoals] = useState({
    calories: goals?.calories || 0,
    protein: goals?.protein || 0,
    carbs: goals?.carbs || 0,
    fat: goals?.fat || 0,
  });

  const today = new Date().toISOString().split('T')[0];
  
  const todayMeals = useMemo(() => meals.filter(meal => meal.date === today), [meals]);
  
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => {
    // Get protein from individual ingredients
    const ingredientsProtein = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.protein || 0), 0
    );
    
    // Get protein from dishes
    const dishesProtein = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.protein || 0), 0
      );
    }, 0);
    
    return sum + ingredientsProtein + dishesProtein;
  }, 0);
  
  const totalCarbs = todayMeals.reduce((sum, meal) => {
    // Get carbs from individual ingredients
    const ingredientsCarbs = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.carbs || 0), 0
    );
    
    // Get carbs from dishes
    const dishesCarbs = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.carbs || 0), 0
      );
    }, 0);
    
    return sum + ingredientsCarbs + dishesCarbs;
  }, 0);
  
  const totalFat = todayMeals.reduce((sum, meal) => {
    // Get fat from individual ingredients
    const ingredientsFat = meal.ingredients.reduce(
      (mealSum, ing) => mealSum + (ing.nutrition.fat || 0), 0
    );
    
    // Get fat from dishes
    const dishesFat = (meal.dishes || []).reduce((dishesSum, dish) => {
      return dishesSum + dish.ingredients.reduce(
        (dishSum, ing) => dishSum + (ing.nutrition.fat || 0), 0
      );
    }, 0);
    
    return sum + ingredientsFat + dishesFat;
  }, 0);

  // Calculate goals when inputs change
  useEffect(() => {
    calculateGoals();
  }, [weight, height, age, gender, activityLevel, goalType]);

  // Improved calculation formula for nutrition goals
  const calculateGoals = () => {
    // Parse inputs
    const weightKg = parseFloat(weight) || 70;
    const heightCm = parseFloat(height) || 170;
    const ageYears = parseFloat(age) || 30;
    
    // Calculate BMR using Mifflin-St Jeor Equation (more accurate than Harris-Benedict)
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    
    // Apply activity multiplier (reduced multipliers to avoid overestimation)
    const activityMultipliers: Record<ActivityLevel, number> = {
      'sedentary': 1.2,
      'lightly active': 1.35, // Adjusted from 1.375
      'moderately active': 1.5, // Adjusted from 1.55
      'very active': 1.65, // Adjusted from 1.725
      'extra active': 1.8, // Adjusted from 1.9
    };
    
    const tdee = bmr * activityMultipliers[activityLevel];
    
    // Adjust based on goal
    let calories = Math.round(tdee);
    if (goalType === 'lose weight') {
      calories = Math.round(tdee * 0.85); // 15% deficit instead of fixed 500
    } else if (goalType === 'gain weight') {
      calories = Math.round(tdee * 1.1); // 10% surplus instead of fixed 500
    } else if (goalType === 'build muscle') {
      calories = Math.round(tdee * 1.15); // 15% surplus for muscle building
    }
    
    // Calculate macros based on body weight and goals
    let proteinPerKg = 1.6; // Base protein
    let fatPercent = 0.3; // Base fat percentage of calories
    
    // Adjust macros for specific goals
    if (goalType === 'build muscle') {
      proteinPerKg = 2.0; // Higher protein for muscle building
      fatPercent = 0.25; // Lower fat
    } else if (goalType === 'lose weight') {
      proteinPerKg = 2.2; // Higher protein for muscle preservation
      fatPercent = 0.35; // Higher fat for satiety
    }
    
    // Calculate macros
    const protein = Math.round(weightKg * proteinPerKg);
    const fat = Math.round((calories * fatPercent) / 9);
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);
    
    setCalculatedGoals({
      calories,
      protein,
      carbs,
      fat,
    });
  };

  const saveGoals = async () => {
    try {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      const ageNum = parseFloat(age);
      
      if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
        alert('Please enter valid numbers for weight, height, and age');
        return;
      }
      
      const newGoals = {
        ...calculatedGoals,
        weight: weightNum,
        height: heightNum,
        age: ageNum,
        gender,
        activityLevel,
        goal: goalType,
      };
      
      await setGoals(newGoals);
      setShowGoalsModal(false);
      alert('Your nutrition goals have been updated!');
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to save your goals. Please try again.');
    }
  };

  // Add new state for editing
  const [isEditingMeal, setIsEditingMeal] = useState(false);
  const [editMealName, setEditMealName] = useState('');
  const [editMealDate, setEditMealDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  
  // Add new functions for meal management
  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal? This action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteMeal(mealId);
            if (success) {
              setSelectedMeal(null);
              // Show feedback
              Alert.alert("Success", "Meal deleted successfully");
            } else {
              Alert.alert("Error", "Failed to delete the meal");
            }
          }
        }
      ]
    );
  };
  
  const startEditingMeal = (meal: Meal) => {
    setEditMealName(meal.name);
    setEditMealDate(new Date(meal.date));
    setIsEditingMeal(true);
  };
  
  const cancelEditingMeal = () => {
    setIsEditingMeal(false);
    setEditMealName('');
  };
  
  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    setShowEditDatePicker(false);
    if (selectedDate) {
      setEditMealDate(selectedDate);
    }
  };
  
  const saveMealEdits = async () => {
    if (!selectedMeal) return;
    
    if (!editMealName.trim()) {
      Alert.alert("Error", "Meal name cannot be empty");
      return;
    }
    
    const updates = {
      name: editMealName,
      date: editMealDate.toISOString().split('T')[0],
    };
    
    const success = await updateMeal(selectedMeal.id, updates);
    
    if (success) {
      setIsEditingMeal(false);
      setSelectedMeal(null);
      Alert.alert("Success", "Meal updated successfully");
    } else {
      Alert.alert("Error", "Failed to update the meal");
    }
  };

  const renderGoalProgress = () => {
    if (!goals) {
      return (
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>No Goals Set</Text>
          <Text style={styles.goalSubtitle}>
            Set your nutrition goals to track your progress
          </Text>
          <TouchableOpacity 
            style={styles.setGoalsButton} 
            onPress={() => setShowGoalsModal(true)}
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

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <Text style={styles.goalTitle}>Today's Progress</Text>
          <TouchableOpacity 
            style={styles.editGoalsButton} 
            onPress={() => setShowGoalsModal(true)}
          >
            <Text style={styles.editGoalsText}>Edit Goals</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Calories</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(calorieProgress, 100)}%`, backgroundColor: '#FF9500' }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(totalCalories)} / {goals.calories} kcal
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Protein</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(proteinProgress, 100)}%`, backgroundColor: '#34C759' }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(totalProtein)} / {goals.protein}g
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Carbs</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(carbsProgress, 100)}%`, backgroundColor: '#007AFF' }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(totalCarbs)} / {goals.carbs}g
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Fat</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(fatProgress, 100)}%`, backgroundColor: '#FF3B30' }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(totalFat)} / {goals.fat}g
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Summary</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      {renderGoalProgress()}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Meals</Text>
        {todayMeals.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged today</Text>
        ) : (
          todayMeals.map(meal => (
            <TouchableOpacity
              key={meal.id}
              style={styles.mealItem}
              onPress={() => setSelectedMeal(meal)}
            >
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealCalories}>{meal.totalCalories} calories</Text>
                <View style={styles.macroRow}>
                  <Text style={styles.macroText}>P: {Math.round(meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.protein || 0), 0))}g</Text>
                  <Text style={styles.macroText}>C: {Math.round(meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.carbs || 0), 0))}g</Text>
                  <Text style={styles.macroText}>F: {Math.round(meal.ingredients.reduce((sum, ing) => sum + (ing.nutrition.fat || 0), 0))}g</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Meal Detail Modal */}
      <Modal
        visible={selectedMeal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsEditingMeal(false);
          setSelectedMeal(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedMeal && (
              <>
                <View style={styles.modalHeader}>
                  {!isEditingMeal ? (
                    <>
                      <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => startEditingMeal(selectedMeal)}
                        >
                          <MaterialIcons name="edit" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteMeal(selectedMeal.id)}
                        >
                          <MaterialIcons name="delete" size={24} color="#FF3B30" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.closeButton}
                          onPress={() => setSelectedMeal(null)}
                        >
                          <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalTitle}>Edit Meal</Text>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.closeButton}
                          onPress={cancelEditingMeal}
                        >
                          <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {!isEditingMeal ? (
                  <>
                    <Text style={styles.mealDate}>
                      {new Date(selectedMeal.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.mealCalories}>
                      {selectedMeal.totalCalories} calories
                    </Text>
                    
                    {selectedMeal.dishes && selectedMeal.dishes.length > 0 && (
                      <>
                        <Text style={styles.modalSubtitle}>Dishes:</Text>
                        {selectedMeal.dishes.map(dish => (
                          <View key={dish.id} style={styles.dishItem}>
                            <Text style={styles.dishName}>{dish.name}</Text>
                            <Text style={styles.dishCalories}>{dish.totalCalories} calories</Text>
                            <View style={styles.dishIngredients}>
                              {dish.ingredients.map(ingredient => (
                                <View key={ingredient.id} style={styles.ingredientItem}>
                                  <Text style={styles.ingredientName}>
                                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                                  </Text>
                                  <Text style={styles.ingredientNutrition}>
                                    {ingredient.nutrition.calories} cal | P: {ingredient.nutrition.protein || 0}g | C: {ingredient.nutrition.carbs || 0}g | F: {ingredient.nutrition.fat || 0}g
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                    
                    {selectedMeal.ingredients.length > 0 && (
                      <>
                        <Text style={styles.modalSubtitle}>
                          {selectedMeal.dishes && selectedMeal.dishes.length > 0 
                            ? "Additional Ingredients:" 
                            : "Ingredients:"}
                        </Text>
                        <FlatList
                          data={selectedMeal.ingredients}
                          keyExtractor={item => item.id}
                          renderItem={({ item }) => (
                            <View style={styles.ingredientItem}>
                              <Text style={styles.ingredientName}>
                                {item.quantity} {item.unit} {item.name}
                              </Text>
                              <Text style={styles.ingredientNutrition}>
                                {item.nutrition.calories} cal | P: {item.nutrition.protein || 0}g | C: {item.nutrition.carbs || 0}g | F: {item.nutrition.fat || 0}g
                              </Text>
                            </View>
                          )}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <View style={styles.editForm}>
                    <Text style={styles.editLabel}>Meal Name:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editMealName}
                      onChangeText={setEditMealName}
                      placeholder="Enter meal name"
                    />
                    
                    <Text style={styles.editLabel}>Date:</Text>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowEditDatePicker(true)}
                    >
                      <Text>{editMealDate.toDateString()}</Text>
                    </TouchableOpacity>
                    
                    {showEditDatePicker && (
                      <DateTimePicker
                        value={editMealDate}
                        mode="date"
                        display="default"
                        onChange={handleEditDateChange}
                      />
                    )}
                    
                    <Text style={styles.editNote}>
                      Note: To edit ingredients, please use the Meal Creation screen.
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.saveEditButton}
                      onPress={saveMealEdits}
                    >
                      <Text style={styles.saveEditButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Goals Setting Modal */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.goalModalContainer}>
          <View style={styles.goalModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Nutrition Goals</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGoalsModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="Enter your weight"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Enter your height"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="Enter your age"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(value: 'male' | 'female') => setGender(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Level</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={activityLevel}
                    onValueChange={(value: ActivityLevel) => setActivityLevel(value)}
                    style={styles.picker}
                  >
                    {ACTIVITY_LEVELS.map(level => (
                      <Picker.Item 
                        key={level.value} 
                        label={level.label} 
                        value={level.value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={goalType}
                    onValueChange={(value: GoalType) => setGoalType(value)}
                    style={styles.picker}
                  >
                    {GOALS.map(goal => (
                      <Picker.Item 
                        key={goal.value} 
                        label={goal.label} 
                        value={goal.value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Calculated Targets</Text>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Calories:</Text>
                  <Text style={styles.resultValue}>{calculatedGoals.calories} kcal</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Protein:</Text>
                  <Text style={styles.resultValue}>{calculatedGoals.protein}g</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Carbs:</Text>
                  <Text style={styles.resultValue}>{calculatedGoals.carbs}g</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Fat:</Text>
                  <Text style={styles.resultValue}>{calculatedGoals.fat}g</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.saveGoalsButton} onPress={saveGoals}>
                <Text style={styles.saveGoalsText}>Save Goals</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  goalCard: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  setGoalsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  setGoalsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  editGoalsButton: {
    padding: 5,
  },
  editGoalsText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressItem: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summaryCard: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  mealCalories: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  closeButton: {
    padding: 8,
  },
  mealDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  ingredientItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientName: {
    fontSize: 14,
    color: '#333',
  },
  ingredientNutrition: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Goal modal styles
  goalModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  goalModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  resultsContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultLabel: {
    fontSize: 16,
    color: '#555',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveGoalsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveGoalsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  editForm: {
    marginTop: 10,
  },
  editLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  editNote: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  saveEditButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveEditButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  dishItem: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dishCalories: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 8,
  },
  dishIngredients: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
});

export default Dashboard; 