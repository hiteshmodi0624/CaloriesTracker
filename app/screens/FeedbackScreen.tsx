import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { COLORS } from '../constants';
const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [feedback, setFeedback] = useState('');
  const [subject, setSubject] = useState('Feedback for Calories Tracker App');
  
  const sendFeedback = async () => {
    const email = 'support@fynko.com'; // Replace with your support email
    
    try {
      let url = '';
      
      if (Platform.OS === 'ios') {
        // On iOS, we can try to include the body text
        url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(feedback)}`;
      } else {
        // On Android, some mail apps don't support body text, so just set the subject
        url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'No Email App',
          'We could not open your email app. Please send your feedback to support@fynko.com',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'There was a problem opening your email app. Please try again later.',
        [{ text: 'OK' }]
      );
      console.error('Failed to open mail app:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Header title="Send Feedback" showBackButton={true} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses" size={40} color={COLORS.secondary} />
          </View>
          <Text style={styles.headerText}>We Value Your Feedback</Text>
          <Text style={styles.headerSubText}>
            Your feedback helps us improve the app experience for everyone
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject"
          />
          
          <Text style={styles.inputLabel}>Your Feedback</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="What would you like to tell us?"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendFeedback}
          >
            <Text style={styles.sendButtonText}>Send via Email</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeText}>Alternatively, you can email us directly at:</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@fynko.com')}
          >
            <Text style={styles.emailLink}>support@fynko.com</Text>
          </TouchableOpacity>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  headerSubText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
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
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  alternativeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  alternativeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  emailLink: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '500',
  },
});

export default FeedbackScreen; 