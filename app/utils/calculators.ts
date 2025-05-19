import { NutritionGoals } from '../../types';

// Types needed for the calculator
export type ActivityLevel = 'sedentary' | 'lightly active' | 'moderately active' | 'very active' | 'extra active';
export type GoalType = 'lose weight' | 'gain weight' | 'maintain' | 'build muscle';

// Improved calculation formula for nutrition goals extracted from GoalsModal.tsx
export const calculateGoals = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: ActivityLevel,
  goalType: GoalType
): { calories: number; protein: number; fat: number; carbs: number; } => {
  /* ---------- sanitize inputs ---------- */
  const weightKg = Number(weight);
  const heightCm = Number(height);
  const ageYears = Number(age);

  if ([weightKg, heightCm, ageYears].some((n) => !Number.isFinite(n))) {
    throw new Error("Invalid numeric input.");
  }

  /* ---------- BMR & TDEE (India-adjusted) ---------- */
  // Mifflin-St Jeor with ≈-10 % correction seen in Indian cohorts
  const BASE_BMR =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  const bmr = BASE_BMR * 0.9; // India adjustment

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.15,
    "lightly active": 1.3,
    "moderately active": 1.45,
    "very active": 1.6,
    "extra active": 1.75,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.3);

  /* ---------- calorie target ---------- */
  let calories: number;
  switch (goalType) {
    case "lose weight":
      calories = Math.round(tdee * 0.85); // ~15 % deficit
      break;
    case "gain weight":
      calories = Math.round(tdee * 1.08); // ~8 % surplus
      break;
    case "build muscle":
      calories = Math.round(tdee * 1.05); // mild surplus
      break;
    default:
      calories = Math.round(tdee); // maintain
  }

  /* ---------- protein target (activity × goal) ---------- */
  const activityProteinBase: Record<ActivityLevel, number> = {
    sedentary: 1.0,
    "lightly active": 1.2,
    "moderately active": 1.4,
    "very active": 1.6,
    "extra active": 1.8,
  };

  const baseProt = activityProteinBase[activityLevel] ?? 1.2;
  let proteinPerKg: number;

  switch (goalType) {
    case "lose weight":
      proteinPerKg = Math.max(baseProt, 1.3); // boost a little for satiety
      break;
    case "gain weight":
      proteinPerKg = Math.max(baseProt + 0.2, 1.6);
      break;
    case "build muscle":
      proteinPerKg = Math.max(baseProt + 0.4, 1.8);
      break;
    default: // maintain
      proteinPerKg = baseProt;
  }

  const protein = Math.round(weightKg * proteinPerKg); // g

  /* ---------- fats & carbs ---------- */
  const fatRatio = goalType === "lose weight" ? 0.3 : 0.25; // 25–30 % kcal
  const fat = Math.round((calories * fatRatio) / 9); // g
  const carbs = Math.max(
    0,
    Math.round((calories - protein * 4 - fat * 9) / 4)
  ); // g

  return { calories, protein, fat, carbs };
};

// Helper function to create a complete NutritionGoals object
export const createNutritionGoals = (
  userDetails: {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: ActivityLevel;
    goal: GoalType;
  }
): NutritionGoals => {
  // Calculate nutrition values
  const { calories, protein, carbs, fat } = calculateGoals(
    userDetails.weight,
    userDetails.height,
    userDetails.age,
    userDetails.gender,
    userDetails.activityLevel,
    userDetails.goal
  );

  // Return complete nutrition goals object
  return {
    calories,
    protein, 
    carbs,
    fat,
    weight: userDetails.weight,
    height: userDetails.height,
    age: userDetails.age,
    gender: userDetails.gender,
    activityLevel: userDetails.activityLevel,
    goal: userDetails.goal
  };
}; 