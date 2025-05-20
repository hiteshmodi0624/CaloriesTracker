import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import UpdateModal from '../components/UpdateModal';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import ProfileStack from './ProfileStack';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();

// Modern floating tab bar with center button
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;

          const iconName = getIconName(route.name, isFocused);
          const isAddButton = route.name === 'CreateMeal';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isAddButton) {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={onPress}
                style={styles.addButton}
              >
                <Ionicons name="add" size={30} color={COLORS.white} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName as any}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? COLORS.primary : COLORS.textSecondary }
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getIconName = (routeName: string, isFocused: boolean): string => {
  let iconName: string;
  
  if (routeName === 'Home') {
    iconName = isFocused ? 'home' : 'home-outline';
  } else if (routeName === 'CreateMeal') {
    iconName = isFocused ? 'add-circle' : 'add-circle-outline';
  } else if (routeName === 'AIChat') {
    iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
  } else if (routeName === 'Upload') {
    iconName = isFocused ? 'camera' : 'camera-outline';
  } else if (routeName === 'Dashboard') {
    iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
  } else {
    iconName = 'help-circle';
  }

  return iconName;
};

// Screen wrapper to add bottom padding
const withBottomPadding = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <View style={styles.screenContainer}>
      <Component {...props} />
      <View style={styles.bottomSpacer} />
    </View>
  );
};

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          display: 'none' // Hide default tab bar since we're using a custom one
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={withBottomPadding(require('../screens/Home').default)}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={withBottomPadding(require('../screens/Upload').default)}
        options={{ 
          title: 'Upload',
        }} 
      />
      <Tab.Screen 
        name="CreateMeal" 
        component={withBottomPadding(require('../components/meals/CreateMealScreen').default)}
        options={{ 
          title: 'Add',
        }} 
      />
      <Tab.Screen 
        name="AIChat" 
        component={withBottomPadding(require('../screens/AIChatScreen').default)}
        options={{ 
          title: 'Chat',
        }} 
      />
      <Tab.Screen 
        name="Dashboard" 
        component={withBottomPadding(require('../screens/Dashboard').default)}
        options={{
          title: 'Stats',
        }}
      />
    </Tab.Navigator>
  );
};

interface NavigationProps {
  navigationRef?: React.RefObject<any>;
}

const Navigation: React.FC<NavigationProps> = ({ navigationRef }) => {
  const { showUpdateModal, setShowUpdateModal } = useContext(AppContext);
  
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
        <RootStack.Screen name="ProfileStack" component={ProfileStack} />
      </RootStack.Navigator>
      
      {/* Update Modal */}
      <UpdateModal 
        visible={showUpdateModal} 
        onDismiss={() => setShowUpdateModal(false)}
      />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomSpacer: {
    height: 100 // Add spacer at the bottom of all screens
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 30,
    width: '90%',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      }
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      }
    }),
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  }
});

export default Navigation; 