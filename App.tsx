import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useContext, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider } from './app/context/ThemeContext';
import { AppProvider } from './app/context/AppContext';
import { NotificationProvider, NotificationContext } from './app/context/NotificationContext';
import Navigation from './app/navigation';
import NotificationModal from './app/components/NotificationModal';
import OnboardingNotification from './app/components/OnboardingNotification';

const AppWithNotifications: React.FC = () => {
  const { 
    currentNotification, 
    showNotification, 
    handleDismissNotification, 
    handleNotificationButtonPress
  } = useContext(NotificationContext);

  // Use a ref to store navigation instance
  const navigationRef = useRef<any>(null);

  // Custom button press handler with navigation support
  const handleButtonPress = async (notificationId: string, buttonId: string) => {
    // Find the button in the current notification
    const button = currentNotification?.buttons.find(b => b.id === buttonId);
    
    // Handle navigation actions
    if (button?.action === 'navigate' && button.link && navigationRef.current) {
      try {
        // Call the regular button handler first
        await handleNotificationButtonPress(notificationId, buttonId);
        
        // Then navigate with params if available
        if (button.params) {
          navigationRef.current.navigate(button.link, button.params);
        } else {
          navigationRef.current.navigate(button.link);
        }
        await handleDismissNotification(notificationId);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      // For non-navigation actions, just use the regular handler
      handleNotificationButtonPress(notificationId, buttonId);
    }
  };

  return (
    <>
      <Navigation navigationRef={navigationRef} />
      <NotificationModal
        notification={currentNotification}
        visible={showNotification}
        onDismiss={handleDismissNotification}
        onButtonPress={handleButtonPress}
      />
      <OnboardingNotification />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppWithNotifications />
        </NotificationProvider>
      </ThemeProvider>
    </AppProvider>
  );
}
