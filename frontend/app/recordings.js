import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Alert, Button, Text, StyleSheet } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from './context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecordingRequests from '../components/RecordingRequests';
import PreviousRecordings from '../components/PreviousRecordings';
import config from '../config';

export default function RecordScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState(null);


  const { patient } = useLocalSearchParams();


  // Access auth context to check for valid JWT token
  const { authState } = useAuth();
  const token = authState.token;

  const [recordingRequests, setRecordingRequests] = useState(null);
  const [sentRecordings, setSentRecordings] = useState([]);
  const [completedRecordings, setCompletedRecordings] = useState([]);


  useEffect(() => {
    const fetchRecordingInfo = async () => {
      try {
        const recordingResponse = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/my-requests/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!recordingResponse.ok) throw new Error('Failed to fetch recording requests');
        const recordingData = await recordingResponse.json();
        setRecordingRequests(recordingData);
        console.log("Recording Requests received: ", recordingData);
      } catch (error) {
        console.error('Error fetching recordings:', error);
      }
    };
    if (token) {
      fetchRecordingInfo();
    } else {
      console.log("no token found");
    }
  }, [token])

  useEffect(() => {
    if (!recordingRequests) return;

    const sent = recordingRequests.filter(req => req.status === 'sent');
    const completed = recordingRequests.filter(req => req.status === 'completed');

    setSentRecordings(sent);
    setCompletedRecordings(completed);
  }, [recordingRequests]);



  // Check if JWT is expired
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return exp < currentTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  };

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
  if (!token || isTokenExpired(token)) {
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

  const handleSelectRequest = (request) => {
    // If the request is clicked again, reset to null
    if (selectedRequest && selectedRequest.id === request.id) {
      setSelectedRequest(null);
    } else {
      setSelectedRequest(request);
    }
  };

  return (
    <SafeAreaProvider>
      <RecordingRequests
        sentRequests={JSON.stringify(sentRecordings)}
        completedRequests={JSON.stringify(completedRecordings)}
        onSelectRequest={handleSelectRequest}
        patient={patient}
      />
      <PreviousRecordings />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
  }
});