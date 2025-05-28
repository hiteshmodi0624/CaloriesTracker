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
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    "lightly active": 1.35,
    "moderately active": 1.5,
    "very active": 1.75,
    "extra active": 2,
  };

  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.3);

  /* ---------- calorie target ---------- */
  let calories: number;
  switch (goalType) {
    case "lose weight":
      const deficit = Math.min(500, Math.round(tdee * 0.15)); // 15% deficit
      calories = Math.max(1200, Math.round(tdee - deficit)); // 1200 kcal is the minimum calorie intake
      break;
    case "gain weight":
      const surplus = Math.min(300, Math.round(tdee * 0.15)); // 15% surplus
      calories = Math.round(tdee + surplus);
      break;
    case "build muscle":
      const muscleSurplus = Math.min(500, Math.round(tdee * 0.1)); // 10% surplus
      calories = Math.round(tdee + muscleSurplus); 
      break;
    default:
      calories = Math.round(tdee); // maintain
  }
  
  const protein = Math.round(weightKg * 1.5); // 1.5 g/kg

  /* ---------- fats & carbs ---------- */
  const fatRatio = goalType === "lose weight" ? 0.3 : 0.25; // 25–30 % kcal
  const fat = Math.round((calories * fatRatio) / 9); // g
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4)); // g

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