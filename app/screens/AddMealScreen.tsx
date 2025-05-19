import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export default function AddMealScreen() {

  return (
    <View style={[styles.container, { backgroundColor: COLORS.cardBackground3 }]}>
      <Text style={[styles.title, { color: COLORS.textPrimary }]}>Add Meal Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 