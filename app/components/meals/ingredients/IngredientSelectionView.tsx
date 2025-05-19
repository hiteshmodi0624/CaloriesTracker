import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../../../../types';
import IngredientItem from './IngredientItem';
import { COLORS } from './constants';

interface IngredientSelectionViewProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  ingredients: Ingredient[];
  filteredIngredients: Ingredient[];
  recentlyUsedIngredients: Ingredient[];
  loading: boolean;
  onSelectIngredient: (ingredient: Ingredient) => void;
  handleShowCustomForm: () => void;
  handleClearSearch: () => void;
  getBaseQuantityForUnit: (unit: string) => number;
  onClose: () => void;
}

const IngredientSelectionView: React.FC<IngredientSelectionViewProps> = ({
  searchTerm,
  onSearchChange,
  ingredients,
  filteredIngredients,
  recentlyUsedIngredients,
  loading,
  onSelectIngredient,
  handleShowCustomForm,
  handleClearSearch,
  getBaseQuantityForUnit,
  onClose
}) => {
  return (
    <View style={styles.selectionContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Ingredient</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.grey2} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          placeholderTextColor={COLORS.grey3}
          value={searchTerm}
          onChangeText={(text) => {
            onSearchChange(text);
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle-outline" size={20} color={COLORS.grey2} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Add Custom Button */}
      <TouchableOpacity style={styles.addCustomButton} onPress={handleShowCustomForm}>
        <Ionicons name="add-circle" size={20} color={COLORS.white} style={styles.addCustomIcon} />
        <Text style={styles.addCustomText}>Add Custom Ingredient</Text>
      </TouchableOpacity>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.blue} />
            <Text style={styles.loadingText}>Loading ingredients...</Text>
          </View>
        ) : searchTerm && filteredIngredients.length === 0 ? (
          <View style={styles.emptyResultsContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.grey4} />
            <Text style={styles.emptyResultsTitle}>No results found</Text>
            <Text style={styles.emptyResultsSubtitle}>
              Try a different search term or add a custom ingredient
            </Text>
          </View>
        ) : (
          <>
            {!searchTerm && recentlyUsedIngredients.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Recently Used</Text>
                <FlatList
                  data={recentlyUsedIngredients}
                  renderItem={({ item }) => (
                    <IngredientItem 
                      ingredient={item} 
                      onSelect={onSelectIngredient}
                      getBaseQuantityForUnit={getBaseQuantityForUnit}
                    />
                  )}
                  keyExtractor={item => `recent-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentList}
                />
              </View>
            )}
            
            {searchTerm ? (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <Text style={styles.resultCount}>{filteredIngredients.length} ingredients found</Text>
              </View>
            ) : (
              <View style={styles.allIngredientsHeader}>
                <Text style={styles.sectionTitle}>All Ingredients</Text>
                <Text style={styles.resultCount}>{ingredients.length} ingredients</Text>
              </View>
            )}
            
            <FlatList
              data={searchTerm ? filteredIngredients : ingredients}
              renderItem={({ item }) => (
                <IngredientItem 
                  ingredient={item} 
                  onSelect={onSelectIngredient}
                  getBaseQuantityForUnit={getBaseQuantityForUnit}
                />
              )}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.ingredientsList}
              ListEmptyComponent={
                !searchTerm && ingredients.length === 0 ? (
                  <View style={styles.emptyListContainer}>
                    <Ionicons name="nutrition-outline" size={48} color={COLORS.grey4} />
                    <Text style={styles.emptyListTitle}>No ingredients yet</Text>
                    <Text style={styles.emptyListSubtitle}>
                      Add your first ingredient using the button above
                    </Text>
                  </View>
                ) : null
              }
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectionContainer: {
    flex: 1,
    backgroundColor: COLORS.cardBackground3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBackground3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonColor,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
  },
  addCustomIcon: {
    marginRight: 8,
  },
  addCustomText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  recentList: {
    paddingBottom: 8,
  },
  searchResultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allIngredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ingredientsList: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyResultsSubtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 50,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyListSubtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default IngredientSelectionView; 