import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../../../types';
import AddCustomIngredientModal from './AddCustomIngredientModal';

interface IngredientSelectionModalProps {
  visible: boolean;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  ingredients: Ingredient[];
  onSelectIngredient: (ingredient: Ingredient) => void;
  onAddNewIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onClose: () => void;
  getBaseQuantityForUnit: (unit: string) => number;
}

const IngredientSelectionModal: React.FC<IngredientSelectionModalProps> = ({
  visible,
  searchTerm,
  onSearchChange,
  ingredients,
  onSelectIngredient,
  onAddNewIngredient,
  onClose,
  getBaseQuantityForUnit
}) => {
  // State for custom ingredient modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Filter ingredients based on search term
  const filteredIngredients = searchTerm 
    ? ingredients.filter(ing => ing.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : ingredients;

  // Handle adding custom ingredient
  const handleAddCustomIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    onAddNewIngredient(ingredient);
  };

  // Render ingredient item
  const renderIngredientItem = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity 
      style={styles.ingredientItem}
      onPress={() => onSelectIngredient(item)}
    >
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.name}</Text>
        <View style={styles.ingredientDetails}>
          <Text style={styles.ingredientUnit}>
            {getBaseQuantityForUnit(item.unit)} {item.unit}
          </Text>
          <Text style={styles.ingredientCalories}>
            {item.nutrition.calories} calories
          </Text>
        </View>
      </View>
      <View style={styles.ingredientAction}>
        <Ionicons name="add-circle" size={22} color="#34C759" />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ingredient</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                value={searchTerm}
                onChangeText={onSearchChange}
                autoFocus
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.addCustomButton}
              onPress={() => setShowAddCustomModal(true)}
            >
              <Ionicons name="add-circle" size={18} color="#fff" style={styles.addCustomIcon} />
              <Text style={styles.addCustomButtonText}>Add Custom Ingredient</Text>
            </TouchableOpacity>
            
            {filteredIngredients.length > 0 ? (
              <FlatList
                data={filteredIngredients}
                renderItem={renderIngredientItem}
                keyExtractor={item => item.id}
                style={styles.ingredientsList}
                contentContainerStyle={styles.ingredientsListContent}
                keyboardShouldPersistTaps="handled"
              />
            ) : (
              <View style={styles.noResultsContainer}>
                {searchTerm ? (
                  <>
                    <Text style={styles.noResultsText}>
                      No ingredients found matching "{searchTerm}"
                    </Text>
                    <Text style={styles.noResultsSubtext}>
                      Try a different search term or add a custom ingredient
                    </Text>
                  </>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading ingredients...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Ingredient Modal */}
      <AddCustomIngredientModal
        visible={showAddCustomModal}
        onClose={() => setShowAddCustomModal(false)}
        onAddIngredient={handleAddCustomIngredient}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  addCustomButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  addCustomIcon: {
    marginRight: 8,
  },
  addCustomButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  ingredientsList: {
    maxHeight: 400,
  },
  ingredientsListContent: {
    paddingVertical: 5,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  ingredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientUnit: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  ingredientCalories: {
    fontSize: 14,
    color: '#FF9500',
  },
  ingredientAction: {
    padding: 5,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addNewButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addNewIcon: {
    marginRight: 5,
  },
  addNewButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
  },
});

export default IngredientSelectionModal; 