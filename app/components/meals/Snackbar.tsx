import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onDismiss: () => void;
  duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  type = 'error',
  onDismiss,
  duration = 3000,
}) => {
  const opacity = new Animated.Value(0);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Fade out when visible becomes false
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, opacity, onDismiss]);

  if (!visible) return null;

  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.orange;
      case 'info':
        return COLORS.blue;
      case 'error':
      default:
        return COLORS.error;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor(), opacity }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  message: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Snackbar; 