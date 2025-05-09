import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { AppContext } from '../context/AppContext';
import { Meal } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const Dashboard: React.FC = () => {
  const { meals } = useContext(AppContext);
  const [selectedMeal, setSelectedMeal] = React.useState<Meal | null>(null);

  const today = new Date().toISOString().split('T')[0];
  
  const todayMeals = useMemo(() => meals.filter(meal => meal.date === today), [meals]);
  
  const nutritionSummary = useMemo(() => {
    return todayMeals.reduce((sum, meal) => {
      // Calculate meal nutrition based on ingredients
      let mealProtein = 0;
      let mealCarbs = 0;
      let mealFat = 0;
      
      meal.ingredients.forEach(ing => {
        mealProtein += ing.nutrition.protein || 0;
        mealCarbs += ing.nutrition.carbs || 0;
        mealFat += ing.nutrition.fat || 0;
      });
      
      return {
        calories: sum.calories + meal.totalCalories,
        protein: sum.protein + mealProtein,
        carbs: sum.carbs + mealCarbs,
        fat: sum.fat + mealFat,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayMeals]);

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

  // Calculate total nutrition for a meal
  const calculateMealNutrition = (meal: Meal) => {
    return meal.ingredients.reduce((sum, ing) => {
      return {
        protein: sum.protein + (ing.nutrition.protein || 0),
        carbs: sum.carbs + (ing.nutrition.carbs || 0),
        fat: sum.fat + (ing.nutrition.fat || 0),
      };
    }, { protein: 0, carbs: 0, fat: 0 });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.todayContainer}>
        <Text style={styles.subtitle}>Today's Summary</Text>
        <View style={styles.nutritionCard}>
          <View style={styles.mainNutrient}>
            <Text style={styles.mainNutrientValue}>{nutritionSummary.calories.toFixed(0)}</Text>
            <Text style={styles.mainNutrientLabel}>Calories</Text>
          </View>
          
          <View style={styles.nutrientRow}>
            <View style={styles.nutrient}>
              <Text style={styles.nutrientValue}>{nutritionSummary.protein.toFixed(1)}g</Text>
              <Text style={styles.nutrientLabel}>Protein</Text>
            </View>
            <View style={styles.nutrient}>
              <Text style={styles.nutrientValue}>{nutritionSummary.carbs.toFixed(1)}g</Text>
              <Text style={styles.nutrientLabel}>Carbs</Text>
            </View>
            <View style={styles.nutrient}>
              <Text style={styles.nutrientValue}>{nutritionSummary.fat.toFixed(1)}g</Text>
              <Text style={styles.nutrientLabel}>Fat</Text>
            </View>
          </View>
        </View>
        <Text style={styles.mealCountText}>Meals Today: {todayMeals.length}</Text>
      </View>

      <Text style={styles.subtitle}>Meal History</Text>
      {groupedMeals.map(([date, dateMeals]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateText}>{new Date(date).toLocaleDateString()}</Text>
          {dateMeals.map(meal => {
            const mealNutrition = calculateMealNutrition(meal);
            
            return (
              <TouchableOpacity 
                key={meal.id} 
                style={styles.mealItem}
                onPress={() => setSelectedMeal(meal)}
              >
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  {meal.imageUri && (
                    <Text style={styles.mealType}>Photo Meal</Text>
                  )}
                </View>
                
                <View style={styles.mealNutrition}>
                  <View style={styles.mealCalories}>
                    <Text style={styles.calorieValue}>{meal.totalCalories.toFixed(0)}</Text>
                    <Text style={styles.calorieLabel}>calories</Text>
                  </View>
                  
                  <View style={styles.macroNutrients}>
                    <Text style={styles.macroText}>P: {mealNutrition.protein.toFixed(1)}g</Text>
                    <Text style={styles.macroText}>C: {mealNutrition.carbs.toFixed(1)}g</Text>
                    <Text style={styles.macroText}>F: {mealNutrition.fat.toFixed(1)}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Meal Detail Modal */}
      <Modal
        visible={!!selectedMeal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMeal(null)}
      >
        {selectedMeal && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                <TouchableOpacity onPress={() => setSelectedMeal(null)}>
                  <Ionicons name="close" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalDate}>
                {new Date(selectedMeal.date).toLocaleDateString()}
              </Text>
              
              <View style={styles.nutritionCard}>
                <View style={styles.mainNutrient}>
                  <Text style={styles.mainNutrientValue}>{selectedMeal.totalCalories.toFixed(0)}</Text>
                  <Text style={styles.mainNutrientLabel}>Calories</Text>
                </View>
                
                {selectedMeal.ingredients.length > 0 && (
                  <View style={styles.nutrientRow}>
                    <View style={styles.nutrient}>
                      <Text style={styles.nutrientValue}>
                        {calculateMealNutrition(selectedMeal).protein.toFixed(1)}g
                      </Text>
                      <Text style={styles.nutrientLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutrient}>
                      <Text style={styles.nutrientValue}>
                        {calculateMealNutrition(selectedMeal).carbs.toFixed(1)}g
                      </Text>
                      <Text style={styles.nutrientLabel}>Carbs</Text>
                    </View>
                    <View style={styles.nutrient}>
                      <Text style={styles.nutrientValue}>
                        {calculateMealNutrition(selectedMeal).fat.toFixed(1)}g
                      </Text>
                      <Text style={styles.nutrientLabel}>Fat</Text>
                    </View>
                  </View>
                )}
              </View>
              
              {selectedMeal.ingredients.length > 0 ? (
                <>
                  <Text style={styles.ingredientsTitle}>Ingredients</Text>
                  {selectedMeal.ingredients.map((ingredient) => (
                    <View key={ingredient.id} style={styles.ingredientItem}>
                      <View style={styles.ingredientHeader}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientAmount}>
                          {ingredient.quantity} {ingredient.unit}
                        </Text>
                      </View>
                      <View style={styles.ingredientNutrition}>
                        <Text style={styles.ingredientNutrientText}>
                          {ingredient.nutrition.calories.toFixed(0)} cal
                        </Text>
                        <Text style={styles.ingredientNutrientText}>
                          P: {(ingredient.nutrition.protein || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.ingredientNutrientText}>
                          C: {(ingredient.nutrition.carbs || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.ingredientNutrientText}>
                          F: {(ingredient.nutrition.fat || 0).toFixed(1)}g
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noIngredientsText}>No ingredients data available</Text>
              )}
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  todayContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionCard: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  mainNutrient: {
    alignItems: 'center',
    marginBottom: 15,
  },
  mainNutrientValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  mainNutrientLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutrient: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666',
  },
  mealCountText: {
    fontSize: 16,
    color: '#666',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mealItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealType: {
    fontSize: 12,
    color: '#007AFF',
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  macroNutrients: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  ingredientItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#666',
  },
  ingredientNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ingredientNutrientText: {
    fontSize: 13,
    color: '#666',
  },
  noIngredientsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontStyle: 'italic',
  }
});

export default Dashboard; 