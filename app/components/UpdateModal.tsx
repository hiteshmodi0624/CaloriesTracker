import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_VERSION, OPENAI_SERVICE_VERSION, resetFailureCounter } from '../services/openai';

interface UpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const APP_STORE_URL = 'https://apps.apple.com/app/calories-tracker/id123456789';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.caloriestracker';

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onDismiss }) => {
  const handleUpdate = () => {
    const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(storeUrl).catch(err => {
      console.error('Failed to open store URL:', err);
    });
    onDismiss();
  };

  const handleDismiss = () => {
    // Reset the failure counter when dismissed
    resetFailureCounter();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="refresh-circle" size={60} color="#5856D6" />
          </View>
          
          <Text style={styles.title}>Update Recommended</Text>
          
          <Text style={styles.message}>
            We've detected issues with our nutrition data service that might be 
            resolved in a newer version of the app.
          </Text>
          
          <Text style={styles.versionInfo}>
            Current version: {APP_VERSION} (Service: {OPENAI_SERVICE_VERSION})
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleDismiss}
            >
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleUpdate}
            >
              <Text style={styles.primaryButtonText}>Update Now</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  iconContainer: {
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22
  },
  versionInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  primaryButton: {
    backgroundColor: '#5856D6'
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5'
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16
  }
});

export default UpdateModal; 