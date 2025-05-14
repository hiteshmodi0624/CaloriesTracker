import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { ThemeProvider } from './app/context/ThemeContext';
import { AppProvider } from './app/context/AppContext';
import Navigation from './app/navigation';

export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <Navigation />
      </ThemeProvider>
    </AppProvider>
  );
}
