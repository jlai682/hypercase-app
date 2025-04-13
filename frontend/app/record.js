import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Alert, Button, Text, StyleSheet, SafeAreaView } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from './context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from '@/components/navigation/NavBar';

export default function RecordScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const router = useRouter();
  
  // Access auth context to check for valid JWT token
  const { authState } = useAuth();
  const isAuthenticated = authState?.authenticated;
  const token = authState?.token;

  // Check if JWT is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const {exp} = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return exp < currentTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  };

  // Check authentication when component mounts or when auth state changes
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !token || isTokenExpired(token)) {
        Alert.alert(
          "Authentication Required", 
          "You need to be logged in to record voice samples.",
          [
            {
              text: "Login",
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        // Try to get patient ID from AsyncStorage
        try {
          const storedPatientId = await AsyncStorage.getItem('patientId');
          if (storedPatientId) {
            setPatientId(storedPatientId);
            console.log('Found patient ID in storage:', storedPatientId);
          }
        } catch (error) {
          console.error('Error retrieving patient ID:', error);
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, token, router]);

  // Check audio permission when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (hasPermission === null) {
        checkPermission();
      }
    }, [hasPermission])
  );

  const checkPermission = () => {
    if (Platform.OS === 'web') {
      // For web, we'll check permissions when the user tries to record
      setHasPermission(true);
      return;
    }

    Alert.alert(
      "Voice Recording Permission",
      "Do you allow this app to record your voice?",
      [
        {
          text: "No",
          onPress: () => setHasPermission(false),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const { status } = await Audio.requestPermissionsAsync();
              setHasPermission(status === 'granted');
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Denied',
                  'You need to grant audio recording permissions to use this feature.'
                );
              }
            } catch (error) {
              console.error('Error requesting permission:', error);
              setHasPermission(false);
            }
          }
        }
      ]
    );
  };

  // Show appropriate UI based on authentication and permissions
  if (!isAuthenticated || !token || isTokenExpired(token)) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to access the recording feature</Text>
        <Button title="Go to Login" onPress={() => router.push('/login')} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Microphone permission is required to record</Text>
        <Button title="I allow this app to record my voice" onPress={checkPermission} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <AudioRecorder />
      <NavBar style={styles.nav}></NavBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  nav: {
    marginBottom: 20,
  },
});