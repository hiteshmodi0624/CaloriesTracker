import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppProvider } from './app/context/AppContext';
import Navigation from './app/navigation';

export default function App() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <Navigation />
        <StatusBar style="auto" />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
