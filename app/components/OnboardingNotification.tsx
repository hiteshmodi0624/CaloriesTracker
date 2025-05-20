import React, { useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { NotificationContext } from '../context/NotificationContext';
import { v4 as uuidv4 } from 'uuid';
import { COLORS } from '../constants';

const OnboardingNotification: React.FC = () => {
  const { isFirstTimeUser, hasCompletedProfile, hasSetGoals, checkOnboardingStatus } = useContext(AppContext);
  const [isProfileNotificationShown, setIsProfileNotificationShown] = useState(false);
  const [isGoalsNotificationShown, setIsGoalsNotificationShown] = useState(false);
  const { checkForNotifications } = useContext(NotificationContext);
  // Check onboarding status and show notifications when needed
  useEffect(() => {
    const checkStatus = async () => {
      // First check if we need to show onboarding notifications
      const { profileCompleted, goalsCompleted } = await checkOnboardingStatus();
      
      // If the user hasn't completed the profile setup, show that notification first
      if (isFirstTimeUser && !profileCompleted && !isProfileNotificationShown) {
        console.log('Showing profile notification');
        showProfileNotification();
        setIsProfileNotificationShown(true);
      } 
      // If profile is completed but goals aren't, show the goals notification
      else if (isFirstTimeUser && profileCompleted && !goalsCompleted && !isGoalsNotificationShown) {
        console.log('Showing goals notification');
        showGoalsNotification();
        setIsGoalsNotificationShown(true);
      }
    };
    
    checkStatus();
  }, [isFirstTimeUser, hasCompletedProfile, hasSetGoals, checkOnboardingStatus, checkForNotifications]);
  
  // Create and store a profile setup notification
  const showProfileNotification = async () => {
    try {
      // Store a custom notification for profile setup
      const notification = {
        id: 'onboarding-profile-' + uuidv4(),
        title: 'Welcome to Calories Tracker!',
        content: 'To get started, let\'s set up your profile with some basic information.',
        type: 'non-blocking',
        htmlContent: `
          <div style="text-align: center;">
            <h2 style="color: ${COLORS.primary};">Welcome!</h2>
            <p style="font-size: 16px; margin: 10px 0;">
              To provide personalized nutrition recommendations, we need some information about you.
            </p>
            <p style="font-size: 16px; margin: 10px 0;">
              Let's set up your profile now!
            </p>
          </div>
        `,
        buttons: [
          {
            id: 'setup-profile',
            text: 'Set Up Profile',
            action: 'navigate',
            link: 'ProfileStack'
          }
        ],
        dismissible: false
      };
      
      // Store this notification temporarily in AsyncStorage
      const customNotifications = [notification];
      await AsyncStorage.setItem('custom_notifications', JSON.stringify(customNotifications));
      
      // Trigger notification check
      checkForNotifications();
    } catch (error) {
      console.error('Error showing profile notification:', error);
    }
  };
  
  // Create and store a goals setup notification
  const showGoalsNotification = async () => {
    try {
      // Store a custom notification for goals setup
      const notification = {
        id: 'onboarding-goals-' + uuidv4(),
        title: 'Set Your Nutrition Goals',
        content: 'Now that your profile is set up, let\'s define your nutrition goals.',
        type: 'non-blocking',
        htmlContent: `
          <div style="text-align: center;">
            <h2 style="color: ${COLORS.primary};">Almost Done!</h2>
            <p style="font-size: 16px; margin: 10px 0;">
              Setting your nutrition goals will help us track your progress.
            </p>
            <p style="font-size: 16px; margin: 10px 0;">
              Let's define your calorie and macronutrient targets.
            </p>
          </div>
        `,
        buttons: [
          {
            id: 'setup-goals',
            text: 'Set Nutrition Goals',
            action: 'navigate',
            link: 'Dashboard'
          }
        ],
        dismissible: false
      };
      
      // Store this notification temporarily in AsyncStorage
      const customNotifications = [notification];
      await AsyncStorage.setItem('custom_notifications', JSON.stringify(customNotifications));
      
      // Trigger notification check
      checkForNotifications();
    } catch (error) {
      console.error('Error showing goals notification:', error);
    }
  };
  
  // This component doesn't render anything visible
  return null;
};

export default OnboardingNotification; 