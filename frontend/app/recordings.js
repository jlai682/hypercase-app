import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Alert, Text, StyleSheet, Platform, TouchableOpacity, SafeAreaView } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from './context/AuthContext';
import RecordingRequests from '../components/RecordingRequests';
import PreviousRecordings from '../components/PreviousRecordings';
import config from '../config';
import BackButton from '../components/BackButton';
import NavBar from '@/components/navigation/NavBar';
import LoggedOutView from '../components/LoggedOutView';

export default function RecordScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { patient: patientParam } = useLocalSearchParams();
  const { authState } = useAuth();
  const token = authState.token;

  const [recordingRequests, setRecordingRequests] = useState(null);
  const [sentRecordings, setSentRecordings] = useState([]);
  const [completedRecordings, setCompletedRecordings] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);

  console.log("Patient ID from params:", patientParam);

  // Parse patient ID if it's passed as a JSON string
  const getPatientId = () => {
    // First try to get from params
    if (patientParam) {
      try {
        // If patient is a JSON string, parse it and get the ID
        const parsedPatient = JSON.parse(patientParam);
        return parsedPatient.id;
      } catch (e) {
        // If it's already a number/string, use it directly
        return patientParam;
      }
    }

    // If not in params, try to get from fetched profile
    if (patientProfile && patientProfile.id) {
      return patientProfile.id;
    }

    return null;
  };

  const patientId = getPatientId();

  // Fetch patient profile if not provided in params
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (patientParam || !token) return; // Skip if patient already provided or no token

      try {
        const response = await fetch(`${config.BACKEND_URL}/api/patientManagement/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched patient profile:", data);
          setPatientProfile(data);
        } else {
          console.error('Failed to fetch patient profile');
        }
      } catch (error) {
        console.error('Error fetching patient profile:', error);
      }
    };

    fetchPatientProfile();
  }, [token, patientParam]);

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
  }, [token]);

  useEffect(() => {
    if (!recordingRequests) return;

    const sent = recordingRequests.filter(req => req.status === 'sent');
    const completed = recordingRequests.filter(req => req.status === 'completed');

    setSentRecordings(sent);
    setCompletedRecordings(completed);
  }, [recordingRequests]);

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

  useFocusEffect(
    React.useCallback(() => {
      if (hasPermission === null) {
        checkPermission();
      }
    }, [hasPermission])
  );

  const checkPermission = () => {
    if (Platform.OS === 'web') {
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

  if (!token || isTokenExpired(token)) {
    return <LoggedOutView loginRoute="/login" />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Microphone permission is required to record</Text>
        <TouchableOpacity style={styles.button} onPress={checkPermission}>
          <Text style={styles.buttonText}>I allow this app to record my voice</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSelectRequest = (request) => {
    if (selectedRequest && selectedRequest.id === request.id) {
      setSelectedRequest(null);
    } else {
      setSelectedRequest(request);
    }
  };

  // Determine which patient data to pass to components
  const patientForComponents = patientParam || (patientProfile ? patientProfile.id.toString() : null);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
        <BackButton route="patientDash"/>
      </View>
      <RecordingRequests
        sentRequests={JSON.stringify(sentRecordings)}
        completedRequests={JSON.stringify(completedRecordings)}
        onSelectRequest={handleSelectRequest}
        patient={patientForComponents}
      />
      {/* Pass the patient ID directly to PreviousRecordings */}
      <PreviousRecordings patient={patientForComponents} />
      <NavBar />
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
    color: '#1F2937',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
