import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetOnboardingStatus } from '../services/onboardingService';

/**
 * Reset all onboarding state for testing
 */
export const resetOnboardingForTesting = async (): Promise<void> => {
  try {
    // Reset onboarding flags
    await resetOnboardingStatus();
    
    // Clear user profile data
    await AsyncStorage.removeItem('user_name');
    await AsyncStorage.removeItem('user_email');
    
    // Clear goals data
    await AsyncStorage.removeItem('goals');
    
    console.log('Onboarding state has been reset for testing');
  } catch (error) {
    console.error('Error resetting onboarding state:', error);
  }
}; 