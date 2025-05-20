import React, { useContext, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import { COLORS } from "../constants";

type RootTabParamList = {
  Home: undefined;
  CreateMeal: undefined;
  Upload: undefined;
  Ingredients: undefined;
  Dashboard: undefined;
  AIChat: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  ProfileStack: undefined;
};

type NavigationProp = BottomTabNavigationProp<RootTabParamList> & {
  navigate(name: keyof MainStackParamList): void;
};

const { width } = Dimensions.get("window");
const ITEM_SIZE = width * 0.72;
const SPACING = 10;

// Define type for inspiration data item
type InspirationItem = {
  id: string;
  title: string;
  color: string;
  gradient: string[];
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { meals, goals, checkOnboardingStatus } = useContext(AppContext);
  const [scrollY] = useState(new Animated.Value(0));

  // Check onboarding status when Home screen loads
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Calculate today's stats
  const today = new Date().toISOString().split("T")[0];
  const todayMeals = meals.filter((meal) => meal.date === today);
  const totalCalories = todayMeals.reduce(
    (sum, meal) => sum + meal.totalCalories,
    0
  );

  // Calculate past 7 days meals
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const recentDailyCalories = last7Days
    .map((date) => {
      const dayMeals = meals.filter((meal) => meal.date === date);
      return {
        date,
        calories: dayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0),
        formattedDate: new Date(date).toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
        }),
      };
    })
    .reverse();

  // Use goals from context if available, otherwise use default values
  const calorieGoal = goals?.calories || 2000;
  const caloriePercentage = Math.min(
    100,
    Math.round((totalCalories / calorieGoal) * 100)
  );
  const remainingCalories = calorieGoal - totalCalories;

  // Calculate macros for today
  const totalProtein = todayMeals.reduce(
    (sum, meal) =>
      sum +
      meal.ingredients.reduce(
        (mealSum, ing) => mealSum + (ing.nutrition.protein || 0),
        0
      ),
    0
  );
  const totalCarbs = todayMeals.reduce(
    (sum, meal) =>
      sum +
      meal.ingredients.reduce(
        (mealSum, ing) => mealSum + (ing.nutrition.carbs || 0),
        0
      ),
    0
  );
  const totalFat = todayMeals.reduce(
    (sum, meal) =>
      sum +
      meal.ingredients.reduce(
        (mealSum, ing) => mealSum + (ing.nutrition.fat || 0),
        0
      ),
    0
  );

  // Get the last meal
  const lastMeal =
    todayMeals.length > 0 ? todayMeals[todayMeals.length - 1] : null;

  // Calculate daily protein, carbs and fat goals progress
  const proteinGoal = goals?.protein || 100;
  const carbsGoal = goals?.carbs || 200;
  const fatGoal = goals?.fat || 70;

  const proteinPercentage = Math.min(
    100,
    Math.round((totalProtein / proteinGoal) * 100)
  );
  const carbsPercentage = Math.min(
    100,
    Math.round((totalCarbs / carbsGoal) * 100)
  );
  const fatPercentage = Math.min(100, Math.round((totalFat / fatGoal) * 100));

  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Quick actions
  const quickActions = [
    {
      id: "meal",
      name: "Log Meal",
      screen: "CreateMeal",
      icon: "restaurant" as const,
      color: COLORS.primary,
      description: "Track your food intake",
    },
    {
      id: "scan",
      name: "Scan Food",
      screen: "Upload",
      icon: "camera" as const,
      color: COLORS.lightBlue,
      description: "Use camera to analyze food",
    },
    {
      id: "chat",
      name: "AI Chat",
      screen: "AIChat",
      icon: "chatbubble" as const,
      color: COLORS.error3,
      description: "Get nutrition advice",
    },
    {
      id: "stats",
      name: "Dashboard",
      screen: "Dashboard",
      icon: "stats-chart" as const,
      color: COLORS.green,
      description: "View your progress",
    },
  ];

  // Handle main scroll view scrolling
  const handleMainScroll = (event: any) => {
    // Extract the contentOffset.y value
    const offsetY = event.nativeEvent.contentOffset.y;
    // Update the scrollY Animated.Value
    scrollY.setValue(offsetY);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0.9],
            }),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greetingText()}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("ProfileStack")}
          >
            <Ionicons name="person-circle" size={36} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
      >
        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardContent}>
            <View style={styles.calorieSummary}>
              <View style={styles.calorieTextContainer}>
                <Text style={styles.calorieTitle}>Today's Calories</Text>
                <View style={styles.calorieRow}>
                  <Text style={styles.calorieMainValue}>{totalCalories}</Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
                <Text
                  style={[
                    styles.goalText,
                    {
                      color:
                        remainingCalories >= 0
                          ? COLORS.green
                          : COLORS.error3,
                    },
                  ]}
                >
                  {remainingCalories >= 0
                    ? `${remainingCalories} kcal remaining`
                    : `${Math.abs(remainingCalories)} kcal over goal`}
                </Text>
              </View>

              <View style={styles.calorieCircle}>
                <View style={styles.circleBackground}>
                  <View
                    style={[
                      styles.circleFill,
                      {
                        backgroundColor:
                          caloriePercentage > 100
                            ? COLORS.error3
                            : COLORS.secondary,
                        width: `${
                          caloriePercentage > 100 ? 100 : caloriePercentage
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.circleText}>{caloriePercentage}%</Text>
              </View>
            </View>

            <View style={styles.macroContainer}>
              <View style={styles.macroItem}>
                <View style={styles.macroTop}>
                  <View
                    style={[
                      styles.macroDot,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <Text style={styles.macroValue}>
                  {Math.round(totalProtein)}g
                </Text>
                <View style={styles.macroBarContainer}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: COLORS.primary,
                        width: `${proteinPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroItem}>
                <View style={styles.macroTop}>
                  <View
                    style={[
                      styles.macroDot,
                      { backgroundColor: COLORS.lightBlue },
                    ]}
                  />
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
                <View style={styles.macroBarContainer}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: COLORS.lightBlue,
                        width: `${carbsPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroItem}>
                <View style={styles.macroTop}>
                  <View
                    style={[
                      styles.macroDot,
                      { backgroundColor: COLORS.error3 },
                    ]}
                  />
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
                <Text style={styles.macroValue}>{Math.round(totalFat)}g</Text>
                <View style={styles.macroBarContainer}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: COLORS.error3,
                        width: `${fatPercentage}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionScrollContainer}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen as any)}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: action.color },
                  ]}
                >
                  <Ionicons name={action.icon} size={28} color={COLORS.white} />
                </View>
                <Text style={styles.actionTitle}>{action.name}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Today's Meals */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("Dashboard")}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {todayMeals.length > 0 ? (
            <View style={styles.mealsContainer}>
              {todayMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to meal details
                    navigation.navigate("Dashboard");
                  }}
                >
                  <View style={styles.mealIconContainer}>
                    <Ionicons
                      name="restaurant"
                      size={20}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealCalories}>
                      {Math.round(meal.totalCalories)} kcal
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.grey2}
                  />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addMealButton}
                onPress={() => navigation.navigate("CreateMeal")}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.addMealText}>Add a meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyMealsContainer}>
              <Ionicons
                name="restaurant-outline"
                size={60}
                color={COLORS.grey4}
              />
              <Text style={styles.emptyMealsText}>No meals logged today</Text>
              <TouchableOpacity
                style={styles.addFirstMealButton}
                onPress={() => navigation.navigate("CreateMeal")}
              >
                <Text style={styles.addFirstMealText}>Add your first meal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weekly Progress */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>

          <View style={styles.weeklyProgressCard}>
            <View style={styles.weeklyChartContainer}>
              {recentDailyCalories.map((day, index) => {
                const dayPercentage = Math.min(
                  100,
                  (day.calories / calorieGoal) * 100
                );
                const barHeight = Math.max(20, (dayPercentage * 120) / 100);
                const isToday = day.date === today;

                return (
                  <View key={index} style={styles.weeklyBarItem}>
                    <View style={styles.barContainer}>
                      <Text style={styles.weeklyBarValue}>
                        {day.calories > 0 ? day.calories : ""}
                      </Text>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: barHeight,
                              backgroundColor:
                                day.calories > calorieGoal
                                  ? COLORS.error3
                                  : isToday
                                  ? COLORS.primary
                                  : COLORS.secondary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.weeklyBarDay,
                        isToday && styles.weeklyBarToday,
                      ]}
                    >
                      {day.formattedDate}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.weeklyGoalLine}>
              <View style={styles.goalDashedLine} />
              <Text style={styles.goalLineText}>Goal: {calorieGoal} kcal</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
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
  },
  contentContainer: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.background,
    zIndex: 10,
    borderBottomWidth: .2,
    borderBottomColor: COLORS.lightBluegrey4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  summaryCardContent: {
    padding: 20,
  },
  calorieSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  calorieTextContainer: {
    flex: 1,
  },
  calorieTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  calorieMainValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  calorieUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginBottom: 6,
  },
  goalText: {
    fontSize: 14,
    marginTop: 2,
  },
  calorieCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.cardBackground3,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  circleBackground: {
    width: "100%",
    height: 10,
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 5,
    overflow: "hidden",
    transform: [{ rotateZ: "-90deg" }],
    position: "absolute",
  },
  circleFill: {
    height: "100%",
    borderRadius: 5,
  },
  circleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  // Macros
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  macroBarContainer: {
    height: 6,
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Sections
  sectionContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Quick Actions
  actionScrollContainer: {
    paddingBottom: 10,
  },
  actionCard: {
    width: 140,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Meals
  mealsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey5,
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 5,
  },
  addMealText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  emptyMealsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  emptyMealsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginVertical: 10,
  },
  addFirstMealButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  addFirstMealText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },

  // Weekly Progress
  weeklyProgressCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    position: "relative",
  },
  weeklyChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    marginTop: 10,
  },
  weeklyBarItem: {
    flex: 1,
    alignItems: "center",
  },
  weeklyBarValue: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  barContainer: {
    alignItems: "center",
    height: 130,
    justifyContent: "flex-end",
  },
  barBackground: {
    width: 10,
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 120,
  },
  barFill: {
    width: "100%",
    borderRadius: 5,
  },
  weeklyBarDay: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  weeklyBarToday: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  weeklyGoalLine: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 70,
  },
  goalDashedLine: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 1,
  },
  goalLineText: {
    position: "absolute",
    right: 0,
    top: -8,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 4,
    fontSize: 12,
    color: COLORS.primary,
  },

  // Inspiration Cards
  inspirationList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
  },
  inspirationCard: {
    width: ITEM_SIZE,
    height: 160,
    borderRadius: 20,
    padding: 20,
    marginRight: SPACING,
    justifyContent: "space-between",
  },
  inspirationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginVertical: 10,
  },
  inspirationButton: {
    backgroundColor: COLORS.opaqueBlack,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  inspirationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },

  bottomPadding: {
    height: 80,
  },
});

export default Home;
