import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface MealFormProps {
  name: string;
  setName: (name: string) => void;
  date: Date;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  handleDateChange: (event: any, selectedDate?: Date) => void;
  setShowPastMeals: (show: boolean) => void;
}

const MealForm: React.FC<MealFormProps> = ({
  name,
  setName,
  date,
  showDatePicker,
  setShowDatePicker,
  handleDateChange,
  setShowPastMeals
}) => {
  return (
    <>
      <Text style={styles.title}>Create New Meal</Text>

      <View style={styles.formSection}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>Meal Name</Text>
          <Text style={styles.requiredBadge}>Required</Text>
        </View>
        <TextInput
          style={[styles.input, !name && styles.requiredInput]}
          placeholder="Enter meal name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toDateString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        
        <TouchableOpacity
          style={styles.previousMealButton}
          onPress={() => setShowPastMeals(true)}
        >
          <Ionicons name="albums-outline" size={18} color="#fff" style={styles.previousMealIcon} />
          <Text style={styles.previousMealButtonText}>Browse Meal History</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formSection: {
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  requiredInput: {
    borderColor: 'rgba(255, 59, 48, 0.5)',
    backgroundColor: 'rgba(255, 59, 48, 0.03)',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  previousMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  previousMealIcon: {
    marginRight: 8,
  },
  previousMealButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MealForm; 