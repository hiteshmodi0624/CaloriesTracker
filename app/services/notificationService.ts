import { Notification } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { URLS } from '../constants/urls';

// API URL for fetching notifications
const NOTIFICATIONS_API_URL = URLS.NOTIFICATIONS_URL;

// Time to cache notifications in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Key for storing dismissed notification IDs in AsyncStorage
const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications';

/**
 * Fetches notifications from the API
 * @returns Promise<Notification[]>
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    // Check if we've recently fetched notifications to prevent excessive API calls
    const cachedData = await AsyncStorage.getItem('notifications_cache');
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is still valid, return cached data
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('Using cached notifications data');
        return data;
      }
    }
    
    // Fetch fresh data from API
    console.log('Fetching notifications from API');
    const response = await fetch(NOTIFICATIONS_API_URL);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Create notification objects from API response
    const notifications: Notification[] = data.notifications.map((item: any) => ({
      id: item.id || uuidv4(),
      title: item.title || 'Notification',
      content: item.content || '',
      type: item.blocking ? 'blocking' : 'non-blocking',
      htmlContent: item.htmlContent,
      imageUrl: item.imageUrl,
      buttons: item.buttons || [
        {
          id: 'dismiss',
          text: 'Dismiss',
          action: 'dismiss'
        }
      ],
      expiry: item.expiry ? new Date(item.expiry) : undefined,
      dismissible: item.type !== 'blocking'
    }));
    
    // Filter out expired notifications
    const validNotifications = notifications.filter(notification => 
      !notification.expiry || new Date(notification.expiry) > new Date()
    );
    
    // Cache the results
    await AsyncStorage.setItem(
      'notifications_cache', 
      JSON.stringify({
        data: validNotifications,
        timestamp: Date.now()
      })
    );
    
    return validNotifications;
  } catch (error) {
    console.log('Error fetching notifications:', error);
    // Dummy update now message blocking notification with html content
    return [];
  }
};

/**
 * Saves a dismissed notification ID to prevent showing it again
 * @param notificationId 
 */
export const dismissNotification = async (notificationId: string): Promise<void> => {
  try {
    // Get current list of dismissed notifications
    const dismissedJson = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    const dismissed = dismissedJson ? JSON.parse(dismissedJson) : [];
    
    // Add this notification ID if not already present
    if (!dismissed.includes(notificationId)) {
      dismissed.push(notificationId);
      await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissed));
    }
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
};

/**
 * Gets the list of dismissed notification IDs
 * @returns Promise<string[]>
 */
export const getDismissedNotifications = async (): Promise<string[]> => {
  try {
    const dismissedJson = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    return dismissedJson ? JSON.parse(dismissedJson) : [];
  } catch (error) {
    console.error('Error getting dismissed notifications:', error);
    return [];
  }
};

/**
 * Clears all dismissed notifications from storage
 */
export const clearDismissedNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DISMISSED_NOTIFICATIONS_KEY);
  } catch (error) {
    console.error('Error clearing dismissed notifications:', error);
  }
};

/**
 * Checks if a notification has been dismissed
 * @param notificationId 
 * @returns Promise<boolean>
 */
export const isNotificationDismissed = async (notificationId: string): Promise<boolean> => {
  try {
    const dismissed = await getDismissedNotifications();
    return dismissed.includes(notificationId);
  } catch (error) {
    console.error('Error checking if notification is dismissed:', error);
    return false;
  }
};

/**
 * Gets custom onboarding notifications stored locally
 * @returns Promise<Notification[]>
 */
export const getCustomNotifications = async (): Promise<Notification[]> => {
  try {
    const customNotificationsJson = await AsyncStorage.getItem('custom_notifications');
    if (customNotificationsJson) {
      return JSON.parse(customNotificationsJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting custom notifications:', error);
    return [];
  }
};

/**
 * Gets active (non-dismissed) notifications
 * @returns Promise<Notification[]>
 */
export const getActiveNotifications = async (): Promise<Notification[]> => {
  try {
    // Fetch all notifications from API
    const allNotifications = await fetchNotifications();
    
    // Get custom notifications (like onboarding)
    const customNotifications = await getCustomNotifications();
    
    // Combine API and custom notifications
    const combinedNotifications = [...allNotifications, ...customNotifications];
    
    // Get list of dismissed notification IDs
    const dismissedIds = await getDismissedNotifications();
    
    // Filter out dismissed notifications that are dismissible (non-blocking)
    // Blocking notifications are always shown regardless of dismissed status
    return combinedNotifications.filter(notification => 
      notification.type === 'blocking' || !dismissedIds.includes(notification.id)
    );
  } catch (error) {
    console.error('Error getting active notifications:', error);
    return [];
  }
}; 