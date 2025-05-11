import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';

interface SaveMealButtonProps {
  name: string;
  dishes: Dish[];
  handleSaveMeal: () => void;
}

const SaveMealButton: React.FC<SaveMealButtonProps> = ({
  name,
  dishes,
  handleSaveMeal
}) => {
  return (
    <View style={styles.saveButtonContainer}>
      {(!name || dishes.length === 0) && (
        <View style={styles.saveRequirementsContainer}>
          <Ionicons name="information-circle" size={20} color="#FF9500" style={styles.saveRequirementsIcon} />
          <View style={styles.saveRequirementsList}>
            <Text style={[styles.saveRequirementItem, name ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
              {name ? '✓ Meal name provided' : '• Enter a meal name'}
            </Text>
            <Text style={[styles.saveRequirementItem, dishes.length > 0 ? styles.saveRequirementComplete : styles.saveRequirementIncomplete]}>
              {dishes.length > 0 ? `✓ ${dishes.length} dish(es) added` : '• Add at least one dish'}
            </Text>
          </View>
        </View>
      )}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          (!name || dishes.length === 0) && styles.disabledButton
        ]} 
        onPress={handleSaveMeal}
        disabled={!name || dishes.length === 0}
      >
        <View style={styles.saveButtonContent}>
          <Ionicons name="save-outline" size={20} color="white" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>Save Meal</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  saveButtonContainer: {
    marginVertical: 20,
    paddingHorizontal: 5,
  },
  saveRequirementsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  saveRequirementsIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  saveRequirementsList: {
    flex: 1,
  },
  saveRequirementItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  saveRequirementComplete: {
    color: '#34C759',
    fontWeight: '500',
  },
  saveRequirementIncomplete: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default SaveMealButton; 