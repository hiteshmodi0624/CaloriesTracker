import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AppContext } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { meals } = useContext(AppContext);

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = useMemo(() => meals.filter(meal => meal.date === today), [meals]);
  const totalCalories = useMemo(() => todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0), [todayMeals]);

  const groupedMeals = useMemo(() => {
    const groups: { [key: string]: typeof meals } = {};
    meals.forEach(meal => {
      if (!groups[meal.date]) {
        groups[meal.date] = [];
      }
      groups[meal.date].push(meal);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [meals]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.todayContainer}>
        <Text style={styles.subtitle}>Today's Summary</Text>
        <Text style={styles.caloriesText}>Total Calories: {totalCalories}</Text>
        <Text style={styles.mealCountText}>Meals: {todayMeals.length}</Text>
      </View>

      <Text style={styles.subtitle}>Meal History</Text>
      {groupedMeals.map(([date, dateMeals]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateText}>{new Date(date).toLocaleDateString()}</Text>
          {dateMeals.map(meal => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCalories}>{meal.totalCalories} calories</Text>
              {meal.imageUri && (
                <Text style={styles.mealType}>Photo Meal</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  todayContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  caloriesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  mealCountText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mealItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealCalories: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  mealType: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
  },
});

export default Dashboard; 