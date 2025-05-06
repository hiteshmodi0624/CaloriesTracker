import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

type RootTabParamList = {
  Home: undefined;
  CreateMeal: undefined;
  Upload: undefined;
  Ingredients: undefined;
  Dashboard: undefined;
};

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

const DAILY_CALORIE_GOAL = 2000; // This could come from user settings later

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { meals } = useContext(AppContext);

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(meal => meal.date === today);
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const caloriePercentage = Math.min(100, Math.round((totalCalories / DAILY_CALORIE_GOAL) * 100));
  const remainingCalories = DAILY_CALORIE_GOAL - totalCalories;

  const renderCalorieProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${caloriePercentage}%` },
              caloriePercentage > 100 ? styles.progressOverflow : {}
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{totalCalories} cal</Text>
          <Text style={styles.progressLabel}>{DAILY_CALORIE_GOAL} cal</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Today's Calories</Text>
        {renderCalorieProgress()}
        
        <View style={styles.statsDetails}>
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={24} color="#FF9500" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statValue}>{totalCalories} cal</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{remainingCalories > 0 ? remainingCalories : 0} cal</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="restaurant-outline" size={24} color="#34C759" />
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Meals</Text>
              <Text style={styles.statValue}>{todayMeals.length}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => navigation.navigate('CreateMeal')}
        >
          <Ionicons name="restaurant" size={28} color="white" />
          <Text style={styles.actionButtonText}>Log Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.uploadButton]} 
          onPress={() => navigation.navigate('Upload')}
        >
          <Ionicons name="camera" size={28} color="white" />
          <Text style={styles.actionButtonText}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.ingredientsButton]} 
          onPress={() => navigation.navigate('Ingredients')}
        >
          <Ionicons name="nutrition" size={28} color="white" />
          <Text style={styles.actionButtonText}>Ingredients</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.dashboardButton}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.dashboardButtonText}>View Full Dashboard</Text>
        <Ionicons name="arrow-forward" size={20} color="#007AFF" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: '#E9E9EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 10,
  },
  progressOverflow: {
    backgroundColor: '#FF3B30',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsDetails: {
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statTextContainer: {
    marginLeft: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
    height: 100,
  },
  uploadButton: {
    backgroundColor: '#FF9500',
  },
  ingredientsButton: {
    backgroundColor: '#5856D6',
    marginRight: 0,
  },
  actionButtonText: {
    color: 'white',
    marginTop: 8,
    fontWeight: 'bold',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dashboardButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default Home; 