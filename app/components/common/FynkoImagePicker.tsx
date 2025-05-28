import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface FynkoImagePickerProps {
  selectedImage?: string | null;
  onImageSelected: (imageUri: string) => void;
  onImageRemoved?: () => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
  showNutritionHint?: boolean;
}

const FynkoImagePicker: React.FC<FynkoImagePickerProps> = ({
  selectedImage,
  onImageSelected,
  onImageRemoved,
  placeholder = "No image selected",
  style,
  disabled = false,
  showNutritionHint = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const debugCameraStatus = async () => {
    try {
      console.log('=== Camera Debug Info ===');
      
      const cameraPermissions = await ImagePicker.getCameraPermissionsAsync();
      console.log('Camera permissions:', cameraPermissions);
      
      const mediaPermissions = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('Media library permissions:', mediaPermissions);
      
      console.log('Platform:', Platform.OS);
      console.log('Platform version:', Platform.Version);
      
      Alert.alert(
        'Camera Debug Info',
        `Camera Status: ${cameraPermissions.status}\nMedia Status: ${mediaPermissions.status}\nPlatform: ${Platform.OS}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Debug error:', error);
      Alert.alert('Debug Error', String(error));
    }
  };

  const openCamera = async () => {
    try {
      setIsLoading(true);

      // Check if camera is available (not on simulator)
      const cameraAvailable = await ImagePicker.getCameraPermissionsAsync();
      
      if (Platform.OS === 'ios' && !cameraAvailable.canAskAgain && cameraAvailable.status === 'denied') {
        Alert.alert(
          'Camera Not Available',
          'Camera access is not available. This might be because you\'re using a simulator or camera access was permanently denied. Please use a physical device or select from gallery.',
          [
            { text: 'Use Gallery', onPress: openGallery },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required', 
          'Please grant camera permissions to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Gallery', onPress: openGallery }
          ]
        );
        return;
      }

      // Add a small delay to ensure permissions are properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      
      let errorMessage = 'Failed to open camera. ';
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes('Camera not available')) {
        errorMessage += 'Camera is not available on this device. Please use the gallery option instead.';
      } else if (errorMsg?.includes('permission')) {
        errorMessage += 'Camera permission was denied. Please enable camera access in settings or use the gallery option.';
      } else {
        errorMessage += 'Please try again or use the gallery option.';
      }
      
      Alert.alert(
        'Camera Error', 
        errorMessage,
        [
          { text: 'Use Gallery', onPress: openGallery },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    try {
      setIsLoading(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission Required', 
          'Please grant photo library permissions to select images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Gallery Error', 'Failed to open photo library. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    if (disabled) return;

    Alert.alert(
      'Select Image',
      showNutritionHint 
        ? 'Choose how you want to add the image. For nutrition labels, ensure the label is clearly visible.'
        : 'Choose how you want to add the image',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Gallery',
          onPress: openGallery,
        },
        ...(Platform.OS === 'ios' ? [{
          text: 'Debug Info',
          onPress: debugCameraStatus,
        }] : []),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRemoveImage = () => {
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.imageContainer}>
        {selectedImage ? (
          <>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={handleRemoveImage}
              disabled={disabled}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.uploadArea, disabled && styles.disabledArea]} 
            onPress={showImagePickerOptions}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons 
                  name="camera-outline" 
                  size={48} 
                  color={disabled ? COLORS.grey3 : COLORS.primary} 
                />
                <Text style={[styles.placeholderText, disabled && styles.disabledText]}>
                  {placeholder}
                </Text>
                <Text style={[styles.instructionText, disabled && styles.disabledText]}>
                  Tap to take photo or select from gallery
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {showNutritionHint && !selectedImage && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.orange} />
          <Text style={styles.hintText}>
            For best results with nutrition labels, ensure the label is well-lit and clearly visible
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.cardBackground2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
  },
  disabledArea: {
    borderColor: COLORS.grey3,
    backgroundColor: COLORS.grey4,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  disabledText: {
    color: COLORS.grey3,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});

export default FynkoImagePicker; 