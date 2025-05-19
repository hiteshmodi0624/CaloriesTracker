import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  showHeaderBackground?: boolean;
  onBack?: () => void; // Custom back function
}

/**
 * Extremely simplified header component without any animations
 * to avoid potential ViewManagerAdapter_ errors
 */
const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = true, 
  rightComponent = null,
  showHeaderBackground = false,
  onBack
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Static header (always visible) */}
      <View style={[styles.header, styles.transparentHeader]}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={showHeaderBackground ? COLORS.white : COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}

        <Text
          style={[
            styles.title,
            showHeaderBackground ? styles.lightText : styles.darkText,
          ]}
        >
          {title}
        </Text>

        {rightComponent || <View style={styles.placeholderButton} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'ios' ? 44 : 0, // Account for status bar on iOS
  },
  transparentHeader: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  darkText: {
    color: COLORS.textPrimary,
  },
  lightText: {
    color: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 40,
    height: 40,
  }
});

export default Header; 