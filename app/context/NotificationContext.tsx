import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Linking, AppState, AppStateStatus } from 'react-native';
import { Notification, NotificationButton } from '../../types';
import {
  getActiveNotifications,
  dismissNotification,
} from '../services/notificationService';

interface NotificationContextData {
  currentNotification: Notification | null;
  showNotification: boolean;
  checkForNotifications: () => Promise<void>;
  handleDismissNotification: (notificationId: string) => Promise<void>;
  handleNotificationButtonPress: (notificationId: string, buttonId: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextData>({
  currentNotification: null,
  showNotification: false,
  checkForNotifications: async () => {},
  handleDismissNotification: async () => {},
  handleNotificationButtonPress: async () => {},
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // Check for notifications and update state
  const checkForNotifications = useCallback(async () => {
    try {
      console.log('Checking for notifications...');
      const activeNotifications = await getActiveNotifications();
      
      if (activeNotifications.length > 0) {
        console.log(`Found ${activeNotifications.length} notifications`);
        setNotifications(activeNotifications);
        
        // If no notification is currently showing, show the first one
        if (!currentNotification) {
          setCurrentNotification(activeNotifications[0]);
          setShowNotification(true);
        }
      } else {
        console.log('No active notifications found');
        setNotifications([]);
        setCurrentNotification(null);
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }, [currentNotification]);

  // Handle app state changes to check for notifications when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForNotifications();
      }
    });

    // Initial check
    checkForNotifications();

    // Set up interval to check for notifications (every 5 minutes)
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkForNotifications]);

  // Handle dismissing a notification
  const handleDismissNotification = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      
      // Remove from local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Hide current notification
      setShowNotification(false);
      setCurrentNotification(null);
      
      // If there are more notifications, show the next one after a short delay
      if (updatedNotifications.length > 0) {
        setTimeout(() => {
          setCurrentNotification(updatedNotifications[0]);
          setShowNotification(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Handle notification button press
  const handleNotificationButtonPress = async (notificationId: string, buttonId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const button = notification.buttons.find(b => b.id === buttonId);
    if (!button) return;

    // Handle button action
    if (button.action === 'dismiss') {
      await handleDismissNotification(notificationId);
    } else if (button.link && button.action !== 'navigate') {
      // Open link if provided and not a navigation action
      Linking.openURL(button.link).catch(err => {
        console.error('Failed to open URL:', err);
      });
      
      // If the notification is non-blocking, dismiss it after opening the link
      if (notification.type === 'non-blocking') {
        await handleDismissNotification(notificationId);
      }
    } else if (button.onPress) {
      // Execute custom action if provided
      button.onPress();
      
      // If the notification is non-blocking, dismiss it after the action
      if (notification.type === 'non-blocking') {
        await handleDismissNotification(notificationId);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        currentNotification,
        showNotification,
        checkForNotifications,
        handleDismissNotification,
        handleNotificationButtonPress,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 