import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  FlatList,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../../../types';

interface DayData {
  date: string;
  meals: Meal[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  }
}

interface MealHistoryProps {
  visible: boolean;
  onClose: () => void;
  onSelectDay: (day: DayData) => void;
  days: DayData[];
  goals?: {
    calories: number;
  };
}

const MealHistory: React.FC<MealHistoryProps> = ({ 
  visible, 
  onClose, 
  days, 
  onSelectDay,
  goals 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split('T')[0];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Meal History</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {days.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="calendar-outline" size={50} color="#c1c1c1" />
              <Text style={styles.emptyText}>No meal history</Text>
              <Text style={styles.emptySubtext}>Your meal history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={days}
              keyExtractor={item => item.date}
              contentContainerStyle={styles.historyListContainer}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.historyDayCard}
                  onPress={() => onSelectDay(item)}
                >
                  <View style={styles.historyDayContent}>
                    <View style={styles.historyDayInfo}>
                      <Text style={[
                        styles.historyDayDate,
                        isToday(item.date) && styles.todayText
                      ]}>
                        {formatDate(item.date)}
                        {isToday(item.date) && <Text style={styles.todayIndicator}> (Today)</Text>}
                      </Text>
                      
                      <View style={styles.historyMealsInfo}>
                        <Text style={styles.historyMealCount}>
                          {item.meals.length} {item.meals.length === 1 ? 'meal' : 'meals'}
                        </Text>
                        <Text style={styles.historyCalories}>{Math.round(item.totalCalories)} cal</Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyMacrosContainer}>
                      <View style={styles.historyMacroItem}>
                        <View style={[styles.historyMacroDot, { backgroundColor: '#5E72E4' }]} />
                        <Text style={styles.historyMacroLabel}>P:</Text>
                        <Text style={styles.historyMacroValue}>{Math.round(item.macros.protein)}g</Text>
                      </View>
                      
                      <View style={styles.historyMacroItem}>
                        <View style={[styles.historyMacroDot, { backgroundColor: '#11CDEF' }]} />
                        <Text style={styles.historyMacroLabel}>C:</Text>
                        <Text style={styles.historyMacroValue}>{Math.round(item.macros.carbs)}g</Text>
                      </View>
                      
                      <View style={styles.historyMacroItem}>
                        <View style={[styles.historyMacroDot, { backgroundColor: '#FB6340' }]} />
                        <Text style={styles.historyMacroLabel}>F:</Text>
                        <Text style={styles.historyMacroValue}>{Math.round(item.macros.fat)}g</Text>
                      </View>
                    </View>
                    
                    {goals?.calories && (
                      <View style={styles.historyProgressContainer}>
                        <View style={styles.historyProgressBar}>
                          <View 
                            style={[
                              styles.historyProgressFill, 
                              { 
                                width: `${Math.min(100, (item.totalCalories / goals.calories) * 100)}%`,
                                backgroundColor: item.totalCalories > goals.calories ? '#FF3B30' : '#5E72E4' 
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.historyProgressText}>
                          {Math.round((item.totalCalories / goals.calories) * 100)}% of goal
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.historyChevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#c5c5c5" />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fe',
    borderRadius: 12,
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#8898aa',
    fontWeight: '500',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a7b2c3',
    textAlign: 'center',
    marginTop: 5,
  },
  historyListContainer: {
    paddingBottom: 20,
  },
  historyDayCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fe',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyDayContent: {
    flex: 1,
  },
  historyDayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDayDate: {
    fontSize: 16,
    color: '#32325d',
    fontWeight: '500',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#5E72E4',
  },
  todayIndicator: {
    color: '#5E72E4',
    fontWeight: 'bold',
  },
  historyMealsInfo: {
    alignItems: 'flex-end',
  },
  historyMealCount: {
    fontSize: 14,
    color: '#8898aa',
  },
  historyCalories: {
    fontSize: 16,
    color: '#32325d',
    fontWeight: 'bold',
  },
  historyMacrosContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  historyMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyMacroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  historyMacroLabel: {
    fontSize: 14,
    color: '#8898aa',
    marginRight: 2,
  },
  historyMacroValue: {
    fontSize: 14,
    color: '#32325d',
    fontWeight: '500',
  },
  historyProgressContainer: {
    marginTop: 5,
  },
  historyProgressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  historyProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  historyProgressText: {
    fontSize: 12,
    color: '#8898aa',
    textAlign: 'right',
  },
  historyChevronContainer: {
    justifyContent: 'center',
    paddingLeft: 5,
  },
});

export default MealHistory; 