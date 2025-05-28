import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NutritionInfo } from "../../../../types";
import { COLORS } from "./constants";
import { FynkoTextInput } from "../../common";

// Constants for styles
const { width } = Dimensions.get("window");
const UNITS = ["g", "ml", "oz", "lb", "cup", "tbsp", "tsp", "piece", "serving"];

interface CustomIngredientFormProps {
  name: string;
  setName: (name: string) => void;
  unit: string;
  setUnit: (unit: string) => void;
  showUnitSelector: boolean;
  setShowUnitSelector: (show: boolean) => void;
  nutrition: NutritionInfo;
  setNutrition: (nutrition: NutritionInfo) => void;
  customLoading: boolean;
  setCustomLoading?: (loading: boolean) => void;
  submitAttempted: boolean;
  setSubmitAttempted: (attempted: boolean) => void;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  isNameValid: boolean;
  isCaloriesValid: boolean;
  isFormValid: boolean;
  pickImage: () => Promise<void>;
  processNutritionLabel: () => Promise<void>;
  handleFetchNutrition: () => Promise<void>;
  handleAddCustomIngredient: () => void;
  handleCloseCustomForm: () => void;
  getBaseQuantityForSelectedUnit: (unit: string) => number;
}

interface NutritionInputState {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const CustomIngredientForm: React.FC<CustomIngredientFormProps> = ({
  name,
  setName,
  unit,
  setUnit,
  showUnitSelector,
  setShowUnitSelector,
  nutrition,
  setNutrition,
  customLoading,
  setCustomLoading,
  submitAttempted,
  setSubmitAttempted,
  imageUri,
  setImageUri,
  isNameValid,
  isCaloriesValid,
  isFormValid,
  pickImage,
  processNutritionLabel,
  handleFetchNutrition,
  handleAddCustomIngredient,
  handleCloseCustomForm,
  getBaseQuantityForSelectedUnit,
}) => {
  const [nutritionInputs, setNutritionInputs] = React.useState<NutritionInputState>({
    calories: nutrition.calories.toString(),
    protein: (nutrition.protein ?? 0).toString(),
    carbs: (nutrition.carbs ?? 0).toString(),
    fat: (nutrition.fat ?? 0).toString(),
  });

  React.useEffect(() => {
    setNutritionInputs({
      calories: nutrition.calories.toString(),
      protein: (nutrition.protein ?? 0).toString(),
      carbs: (nutrition.carbs ?? 0).toString(),
      fat: (nutrition.fat ?? 0).toString(),
    });
  }, [nutrition]);

  const updateNutritionValue = (
    field: keyof NutritionInputState,
    value: string
  ) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setNutritionInputs((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (
        value !== "" &&
        value[value.length - 1] != "." &&
        /^[0-9]*\.?[0-9]*$/.test(value)
      ) {
        const numValue = value === "" ? 0 : parseFloat(value);
        setNutrition({
          ...nutrition,
          [field]: numValue,
        });
      }
    }
  };

  return (
    <View style={styles.customFormContainer}>
      {/* Header */}
      <View style={styles.customFormHeader}>
        <TouchableOpacity onPress={handleCloseCustomForm}>
          <Ionicons name="arrow-back" size={24} color={COLORS.blue} />
        </TouchableOpacity>
        <Text style={styles.customFormTitle}>Add Custom Ingredient</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.customFormScroll}
        contentContainerStyle={styles.customFormContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.customFormDescription}>
          Create a new ingredient with complete nutrition information
        </Text>

        {/* Basic Info Section */}
        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Basic Information</Text>

          <Text style={styles.inputLabel}>Ingredient Name*</Text>
          <View
            style={[
              styles.inputContainer,
              submitAttempted && !isNameValid && styles.inputError,
            ]}
          >
            <FynkoTextInput
              style={styles.input}
              placeholder="e.g., Homemade Bread"
              placeholderTextColor={COLORS.grey3}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            {name.length > 0 && (
              <TouchableOpacity onPress={() => setName("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.grey2}
                />
              </TouchableOpacity>
            )}
          </View>
          {submitAttempted && !isNameValid && (
            <Text style={styles.errorText}>
              Please enter an ingredient name
            </Text>
          )}

          <Text style={styles.inputLabel}>Unit of Measurement*</Text>
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowUnitSelector(!showUnitSelector)}
          >
            <Text style={styles.unitSelectorText}>{unit}</Text>
            <Ionicons
              name={showUnitSelector ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.grey2}
            />
          </TouchableOpacity>

          {showUnitSelector && (
            <View style={styles.unitDropdown}>
              <ScrollView 
                style={styles.unitScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitOption,
                      unit === u && styles.unitOptionSelected,
                    ]}
                    onPress={() => {
                      setUnit(u);
                      setShowUnitSelector(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unit === u && styles.unitOptionTextSelected,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Nutrition Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.formSectionTitle}>Nutrition Information</Text>
            <Text style={styles.formSectionSubtitle}>
              Per {getBaseQuantityForSelectedUnit(unit)} {unit}
            </Text>
          </View>

          {/* Image Upload Section */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePlaceholder}
                onPress={pickImage}
              >
                <View style={styles.imageIconContainer}>
                  <Ionicons
                    name="camera-outline"
                    size={28}
                    color={COLORS.grey2}
                  />
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={COLORS.grey2}
                    style={{ marginLeft: 24 }}
                  />
                </View>
                <Text style={styles.imagePlaceholderText}>
                  Tap to take a photo or select from gallery
                </Text>
              </TouchableOpacity>
            )}

            {imageUri && (
              <TouchableOpacity
                style={styles.processButton}
                onPress={processNutritionLabel}
                disabled={customLoading}
              >
                {customLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name="scan-outline"
                      size={18}
                      color={COLORS.white}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.buttonText}>
                      Process Nutrition Label
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Fetch Nutrition Button */}
          <TouchableOpacity
            style={styles.fetchButton}
            onPress={handleFetchNutrition}
            disabled={customLoading || !name}
          >
            {customLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons
                  name="nutrition-outline"
                  size={18}
                  color={COLORS.white}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.buttonText}>Fetch Nutrition Data</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Nutrition Input Fields */}
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Calories*</Text>
              <FynkoTextInput
                style={[
                  styles.nutritionInput,
                  submitAttempted && !isCaloriesValid && styles.inputError,
                ]}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.grey3}
                value={nutritionInputs.calories}
                onChangeText={(text) => {
                  
                    updateNutritionValue("calories", text);
                }}
              />
              {submitAttempted && !isCaloriesValid && (
                <Text style={styles.errorText}>Required</Text>
              )}
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <FynkoTextInput
                style={styles.nutritionInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.grey3}
                value={nutritionInputs.protein}
                onChangeText={(text) => {
                  updateNutritionValue("protein", text);
                }}
              />
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <FynkoTextInput
                style={styles.nutritionInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.grey3}
                value={nutritionInputs.carbs}
                onChangeText={(text) => {
                  updateNutritionValue("carbs", text);
                }}
              />
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <FynkoTextInput
                style={styles.nutritionInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.grey3}
                value={nutritionInputs.fat}
                onChangeText={(text) => {
                  updateNutritionValue("fat", text);
                }}
              />
            </View>
          </View>
        </View>

        <Text style={styles.requiredNote}>* Required fields</Text>

        {/* Extra space for bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Footer with Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || customLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleAddCustomIngredient}
          disabled={!isFormValid || customLoading}
        >
          {customLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Ingredient</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  customFormContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBackground2,
  },
  customFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBackground2,
  },
  customFormTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  customFormScroll: {
    flex: 1,
  },
  customFormContent: {
    padding: 16,
  },
  customFormDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  formSectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.cardBackground,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: COLORS.cardBackground,
  },
  unitSelectorText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  unitDropdown: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    marginTop: -12,
    marginBottom: 16,
    maxHeight: 200,
  },
  unitScrollView: {
    maxHeight: 200,
  },
  unitOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey4,
  },
  unitOptionSelected: {
    backgroundColor: COLORS.blue + "15",
  },
  unitOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  unitOptionTextSelected: {
    color: COLORS.blue,
    fontWeight: "500",
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.opaqueBlack,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: COLORS.grey4 + "30",
  },
  imageIconContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imagePlaceholderText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  processButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.grey4,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fetchButton: {
    backgroundColor: COLORS.error3,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    marginBottom: 16,
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: COLORS.grey4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.cardBackground,
  },
  requiredNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    padding: 8,
    backgroundColor: COLORS.cardBackground,
  },
  saveButton: {
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.buttonColor2,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomIngredientForm;
