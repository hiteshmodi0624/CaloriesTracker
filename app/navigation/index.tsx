import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            paddingBottom: 5,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={require('../screens/Home').default}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="CreateMeal" 
          component={require('../screens/CreateMeal').default} 
          options={{ 
            title: 'Create Meal',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Upload" 
          component={require('../screens/Upload').default} 
          options={{ 
            title: 'Upload Meal',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera" size={size} color={color} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Ingredients" 
          component={require('../screens/Ingredients').default} 
          options={{ 
            title: 'Ingredients',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="nutrition" size={size} color={color} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Dashboard" 
          component={require('../screens/Dashboard').default}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation; 