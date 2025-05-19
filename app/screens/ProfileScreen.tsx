import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Platform, 
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import Header from '../components/Header';
import { COLORS } from '../constants';
const ProfileScreen = () => {
  const navigation = useNavigation();
  const { goals, setGoals } = useContext(AppContext);
  
  // User profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weight, setWeight] = useState(goals?.weight ? goals.weight.toString() : '');
  const [height, setHeight] = useState(goals?.height ? goals.height.toString() : '');
  const [age, setAge] = useState(goals?.age ? goals.age.toString() : '');
  const [gender, setGender] = useState<'male' | 'female'>(goals?.gender || 'male');
  const [isSaving, setIsSaving] = useState(false);
  
  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const storedName = await AsyncStorage.getItem('user_name');
        const storedEmail = await AsyncStorage.getItem('user_email');
        
        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);
  
  const saveProfile = async () => {
    setIsSaving(true);
    
    try {
      // Save basic user info
      await AsyncStorage.setItem('user_name', name);
      await AsyncStorage.setItem('user_email', email);
      
      // Update goals with user metrics
      if (goals) {
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);
        const ageNum = parseFloat(age);
        
        if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
          Alert.alert('Input Error', 'Please enter valid numbers for weight, height, and age');
          setIsSaving(false);
          return;
        }
        
        const updatedGoals = {
          ...goals,
          weight: weightNum,
          height: heightNum,
          age: ageNum,
          gender
        };
        
        await setGoals(updatedGoals);
      }
      
      Alert.alert('Success', 'Your profile has been updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const navigateToFeedback = () => {
    // @ts-ignore - TypeScript might complain about the navigate params
    navigation.navigate('Feedback');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Header title="Profile" showBackButton={true} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeaderSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color={COLORS.white} />
            </View>
          </View>
          
          <Text style={styles.headerText}>Your Profile</Text>
          <Text style={styles.headerSubText}>Manage your personal information</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Weight in kg"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={[styles.inputGroup, {flex: 1}]}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="Height in cm"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Your age"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={[styles.inputGroup, {flex: 1}]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity 
                  style={[
                    styles.segmentedOption, 
                    gender === 'male' && styles.segmentedOptionSelected
                  ]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[
                    styles.segmentedOptionText,
                    gender === 'male' && styles.segmentedOptionTextSelected
                  ]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.segmentedOption, 
                    gender === 'female' && styles.segmentedOptionSelected
                  ]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[
                    styles.segmentedOptionText,
                    gender === 'female' && styles.segmentedOptionTextSelected
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={navigateToFeedback}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Send Feedback</Text>
              <Text style={styles.menuSubText}>Help us improve the app</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.grey3} />
          </TouchableOpacity>
          
          {/* <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color=COLORS.primary style={styles.menuIcon} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Help Center</Text>
              <Text style={styles.menuSubText}>Frequently asked questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color=COLORS.grey3 />
          </TouchableOpacity> */}
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 60, // Account for header + status bar on iOS
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeaderSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  headerSubText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: .8,
    borderColor: COLORS.grey3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentedOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  segmentedOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  segmentedOptionTextSelected: {
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: .2,
    borderBottomColor: COLORS.lightBluegrey4,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuSubText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen; 