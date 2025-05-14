import { Dimensions } from 'react-native';

export const { width, height } = Dimensions.get('window');

export const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primary: '#007AFF',
  grey1: '#6E6E6E',
  grey2: '#AEAEB2',
  grey3: '#C7C7CC',
  grey5: '#E5E5EA',
  overlay: 'rgba(0, 0, 0, 0.5)',
  background: '#F2F2F7',
  error: '#FF3B30',
  success: '#34C759',
};

export const UNITS = ['g', 'ml', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'piece', 'serving']; 