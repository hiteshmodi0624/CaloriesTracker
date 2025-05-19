import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { ThemeProvider } from './app/context/ThemeContext';
import { AppProvider } from './app/context/AppContext';
import { NotificationProvider, NotificationContext } from './app/context/NotificationContext';
import Navigation from './app/navigation';
import NotificationModal from './app/components/NotificationModal';

const AppWithNotifications: React.FC = () => {
  const { 
    currentNotification, 
    showNotification, 
    handleDismissNotification, 
    handleNotificationButtonPress 
  } = useContext(NotificationContext);

  return (
    <>
      <Navigation />
      <NotificationModal
        notification={currentNotification}
        visible={showNotification}
        onDismiss={handleDismissNotification}
        onButtonPress={handleNotificationButtonPress}
      />
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
