import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { AppContext } from '../context/AppContext';
import Header from '../components/Header';
import { COLORS } from '../constants';

// Import custom components
import DailyProgress from '../components/dashboard/DailyProgress';
import TodaysMeals from '../components/dashboard/TodaysMeals';
import WeekSummary from '../components/dashboard/WeekSummary';
import GoalsModal from '../components/dashboard/GoalsModal';
import DayDetailModal from '../components/dashboard/DayDetailModal';
import MealDetailModal from '../components/dashboard/MealDetailModal';
import MealHistory from '../components/dashboard/MealHistory';
import MealEditScreen from '../components/dashboard/MealEditScreen';

// Import utility functions
import { 
  getTodayMeals, 
  getLastDays, 
  calculateMacros, 
  getAllMealDays,
  DayDataSummary
} from '../utils/dashboard';
import { Meal, NutritionGoals } from '../../types';

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { meals, goals, deleteMeal, updateMeal } = useContext(AppContext);
  const [scrollY] = useState(new Animated.Value(0));
  
  // Modal states
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayDataSummary | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  
  // Get today's meals
  const todayMeals = getTodayMeals(meals);
  
  // Calculate today's nutrition
  const macros = calculateMacros(todayMeals);
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  
  // Get last 7 days data
  const last7Days = getLastDays(meals, 7);
  
  // Get all meal days for history
  const allMealDays = getAllMealDays(meals);

  // Handle meal deletion
  const handleDeleteMeal = async (mealId: string) => {
    await deleteMeal(mealId);
  };
  
  // Handle meal updates
  const handleUpdateMeal = async (mealId: string, updates: Partial<Omit<Meal, 'id'>>) => {
    return await updateMeal(mealId, updates);
  };

  // Handle navigating to edit screen
  const handleEditMeal = (meal: Meal) => {
    setMealToEdit(meal);
  };

  // Handle closing edit screen
  const handleCloseEditScreen = () => {
    setMealToEdit(null);
  };

  // Create nutrition goals object for components that need it
  const safeGoals = goals || {
    calories: 2000,
    protein: 50,
    carbs: 200,
    fat: 70
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <Header title="Dashboard" />

      <Animated.ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Today's Summary</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Daily Progress Card */}
        <DailyProgress 
          totalCalories={totalCalories}
          totalProtein={macros.protein}
          totalCarbs={macros.carbs}
          totalFat={macros.fat}
          goals={safeGoals}
          onEditGoals={() => setShowGoalsModal(true)}
        />

        {/* Today's Meals Card */}
        <TodaysMeals 
          meals={todayMeals}
          onSelectMeal={setSelectedMeal}
        />

        {/* Last 7 Days Summary Card */}
        <WeekSummary 
          days={last7Days}
          goals={safeGoals}
          onViewAll={() => setShowFullHistory(true)}
          onSelectDay={setSelectedDay}
        />
      </Animated.ScrollView>

      {/* Modals */}
      <GoalsModal 
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
      />

      <DayDetailModal 
        visible={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        day={selectedDay}
        goals={safeGoals}
        onSelectMeal={(meal) => {
          setSelectedDay(null);
          setSelectedMeal(meal as Meal);
        }}
      />

      {/* Meal Detail Modal */}
      <MealDetailModal 
        visible={selectedMeal !== null}
        onClose={() => setSelectedMeal(null)}
        meal={selectedMeal}
        onDeleteMeal={handleDeleteMeal}
        onEditMeal={handleEditMeal}
      />

      {/* Meal Edit Modal */}
      <MealEditScreen
        visible={mealToEdit !== null}
        meal={mealToEdit!}
        onClose={handleCloseEditScreen}
        onSave={handleUpdateMeal}
      />

      {/* Full History Modal */}
      <MealHistory 
        visible={showFullHistory}
        onClose={() => setShowFullHistory(false)}
        days={allMealDays}
        goals={safeGoals}
        onSelectDay={(day) => {
          setShowFullHistory(false);
          setSelectedDay(day as DayDataSummary);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 60, // Account for header + status bar on iOS
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
});

export default Dashboard; 