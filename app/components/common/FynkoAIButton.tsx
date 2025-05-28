import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface FynkoAIButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}

const FynkoAIButton: React.FC<FynkoAIButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon = 'sparkles',
  style,
  textStyle,
  size = 'medium',
}) => {
  const isDisabled = disabled || loading;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 12,
          iconSize: 16,
          fontSize: 14,
        };
      case 'large':
        return {
          padding: 20,
          iconSize: 24,
          fontSize: 18,
        };
      default: // medium
        return {
          padding: 16,
          iconSize: 20,
          fontSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { padding: sizeStyles.padding },
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <>
          <Ionicons 
            name={icon} 
            size={sizeStyles.iconSize} 
            color={COLORS.white} 
            style={styles.icon}
          />
          <Text 
            style={[
              styles.text,
              { fontSize: sizeStyles.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonColor3,
    borderRadius: 8,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: COLORS.grey3,
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default FynkoAIButton; 