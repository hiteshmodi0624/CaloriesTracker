import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface FynkoTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  style?: any;
  inputStyle?: any;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

const FynkoTextInput: React.FC<FynkoTextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  disabled = false,
  required = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  showCharacterCount = false,
  style,
  inputStyle,
  variant = 'default',
  size = 'medium',
  backgroundColor,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { marginBottom: 12 },
          input: { paddingVertical: 8, paddingHorizontal: 10, fontSize: 14 },
          label: { fontSize: 12, marginBottom: 4 },
        };
      case 'large':
        return {
          container: { marginBottom: 20 },
          input: { paddingVertical: 16, paddingHorizontal: 16, fontSize: 18 },
          label: { fontSize: 16, marginBottom: 8 },
        };
      default: // medium
        return {
          container: { marginBottom: 16 },
          input: { paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 },
          label: { fontSize: 14, marginBottom: 6 },
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyle = {
      borderRadius: 8,
      backgroundColor: backgroundColor ?? COLORS.background,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: error 
            ? COLORS.error 
            : isFocused 
              ? COLORS.primary 
              : COLORS.grey3,
          backgroundColor: 'transparent',
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: backgroundColor ?? COLORS.cardBackground2,
          borderWidth: 0,
        };
      default: // default
        return baseStyle;
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const handleRightIconPress = () => {
    if (isPassword) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = () => {
    if (isPassword) {
      return showPassword ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  return (
    <View style={[sizeStyles.container, style]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, sizeStyles.label]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          variantStyles,
          disabled && styles.disabled,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={disabled ? COLORS.grey3 : COLORS.textSecondary}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            sizeStyles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            disabled && styles.disabledInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {/* Right Icon */}
        {(rightIcon || isPassword) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={handleRightIconPress}
            disabled={disabled}
          >
            <Ionicons
              name={getRightIcon() as any}
              size={20}
              color={disabled ? COLORS.grey3 : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text, Error, or Character Count */}
      {error !== undefined ||
        helperText !== undefined ||
        (showCharacterCount && maxLength !== undefined && (
          <View style={styles.bottomContainer}>
            <View style={styles.bottomLeft}>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : helperText ? (
                <Text style={styles.helperText}>{helperText}</Text>
              ) : null}
            </View>

            {showCharacterCount && maxLength && (
              <Text style={styles.characterCount}>
                {value.length}/{maxLength}
              </Text>
            )}
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  disabled: {
    backgroundColor: COLORS.grey4,
    opacity: 0.6,
  },
  disabledInput: {
    color: COLORS.grey3,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 16,
  },
  bottomLeft: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    lineHeight: 16,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});

export default FynkoTextInput; 