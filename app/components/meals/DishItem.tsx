import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '../../../types';

interface DishItemProps {
  dish: Dish;
  onEdit: (dish: Dish) => void;
  onRemove: (dishId: string) => void;
  onEditIngredientQuantity: (dishId: string, ingredientId: string, newQuantity: number) => void;
}

const DishItem: React.FC<DishItemProps> = ({
  dish,
  onEdit,
  onRemove,
  onEditIngredientQuantity
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleEditIngredientQuantity = (ingredientId: string) => {
    const ingredient = dish.ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
      // Simple prompt implementation - this could be replaced with a proper modal
      const newQuantity = prompt(
        `Change quantity of ${ingredient.name} (${ingredient.unit})`,
        ingredient.quantity.toString()
      );
      
      if (newQuantity) {
        const parsedQuantity = parseFloat(newQuantity);
        if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
          onEditIngredientQuantity(dish.id, ingredientId, parsedQuantity);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dishNameContainer}
          onPress={toggleExpanded}
        >
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.calories}>{dish.totalCalories.toFixed(0)} calories</Text>
        </TouchableOpacity>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(dish)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onRemove(dish.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}
          >
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {expanded && (
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsTitle}>Ingredients:</Text>
          {dish.ingredients.map(ingredient => (
            <View key={ingredient.id} style={styles.ingredientItem}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <TouchableOpacity
                  onPress={() => handleEditIngredientQuantity(ingredient.id)}
                >
                  <View style={styles.quantityContainer}>
                    <Text style={styles.ingredientQuantity}>
                      {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <Ionicons name="pencil-outline" size={12} color="#007AFF" style={styles.editIcon} />
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={styles.ingredientCalories}>
                {ingredient.nutrition.calories.toFixed(0)} cal
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishNameContainer: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  calories: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginHorizontal: 2,
  },
  expandButton: {
    padding: 6,
    marginLeft: 2,
  },
  ingredientsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientQuantity: {
    fontSize: 13,
    color: '#666',
  },
  editIcon: {
    marginLeft: 4,
  },
  ingredientCalories: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
  },
});

export default DishItem; 