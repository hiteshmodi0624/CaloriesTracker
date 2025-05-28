import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { Notification, NotificationButton } from '../../types';
import HTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface NotificationModalProps {
  notification: Notification | null;
  visible: boolean;
  onDismiss: (notificationId: string) => void;
  onButtonPress: (notificationId: string, buttonId: string) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  visible,
  onDismiss,
  onButtonPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  // Don't render anything if notification is null or if modal is not visible
  if (!notification || !visible) {
    return null;
  }

  const handleButtonPress = (button: NotificationButton) => {
    onButtonPress(notification.id, button.id);
    
    // For 'navigate' actions, we'll handle it in the parent component
    // This prevents errors when NotificationModal is rendered outside NavigationContainer
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => notification.dismissible && onDismiss(notification.id)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            {notification.dismissible && (
              <TouchableOpacity onPress={() => onDismiss(notification.id)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <ScrollView
            style={styles.contentScrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Image (if available) */}
            {notification.imageUrl && (
              <Image
                source={{ uri: notification.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            )}

            {/* HTML Content (if available) */}
            {notification.htmlContent ? (
              <View style={styles.htmlContainer}>
                <HTML
                  source={{ html: notification.htmlContent }}
                  contentWidth={windowWidth - 80}
                  tagsStyles={{
                    p: { color: COLORS.textPrimary, lineHeight: 22 },
                    h1: { color: COLORS.textPrimary },
                    h2: { color: COLORS.textPrimary },
                    h3: { color: COLORS.textPrimary },
                    a: { color: COLORS.primary }
                  }}
                />
              </View>
            ) : (
              <Text style={styles.message}>{notification.content}</Text>
            )}
          </ScrollView>

          {/* Buttons */}
          <View
            style={[
              styles.buttonContainer,
              notification.buttons.length > 2 && styles.buttonContainerColumn,
            ]}
          >
            {notification.buttons.map((button, index) => (
              <TouchableOpacity
                key={button.id}
                style={[
                  styles.button,
                  index === 0 ? styles.primaryButton : styles.secondaryButton,
                  notification.buttons.length > 2 && styles.fullWidthButton,
                ]}
                onPress={() => handleButtonPress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    index === 0 ? styles.primaryButtonText : styles.secondaryButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.opaqueBlack,
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  contentScrollView: {
    width: '100%',
    maxHeight: 400,
  },
  contentContainer: {
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  htmlContainer: {
    width: '100%',
    marginBottom: 20,
  },
  htmlBaseStyle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  buttonContainerColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  fullWidthButton: {
    width: '100%',
    marginVertical: 5,
    marginHorizontal: 0,
  },
  primaryButton: {
    backgroundColor: COLORS.blue,
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBackground2,
  },
  customButton: {
    backgroundColor: COLORS.buttonColor,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  customButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default NotificationModal; 