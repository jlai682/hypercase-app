import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { useAuth } from "@/components/auth/AuthContext";
import RecordButton from '@/components/patient/recordButton';
import NameRecordingModal from '@/components/patient/NameRecordingModal';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { useLocalSearchParams } from 'expo-router';
import { Patient, RecordingRequest } from '@/types';

function AudioRecorder(): React.JSX.Element {
  const { authState, isValidJWT } = useAuth();
  const token = authState?.token;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [tempRecordingUri, setTempRecordingUri] = useState<string | Blob | null>(null);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);

  // Web-specific state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const params = useLocalSearchParams();

  // Parse patient from URL params
  const parsePatient = (): Patient | null => {
    const patientParam = Array.isArray(params.patient) ? params.patient[0] : params.patient;
    if (!patientParam) return null;

    try {
      // If it's a JSON string, parse it
      const parsed = JSON.parse(patientParam);
      return parsed as Patient;
    } catch (error) {
      // If parsing fails, treat it as a patient ID
      console.log('Failed to parse patient param:', error);
      return {
        id: patientParam,
        firstName: '',
        lastName: '',
        email: ''
      } as Patient;
    }
  };

  // Parse request from URL params
  const parseRequest = (): RecordingRequest | undefined => {
    const requestParam = Array.isArray(params.request) ? params.request[0] : params.request;
    if (!requestParam) return undefined;

    try {
      const parsed = JSON.parse(requestParam);
      return parsed as RecordingRequest;
    } catch {
      console.error("Error parsing request:", requestParam);
      return undefined;
    }
  };

  const patient = parsePatient();
  const request = parseRequest();

  console.log("Parsed patient:", patient);
  console.log("Parsed request:", request);

  // Debug token payload only when token exists
  useEffect(() => {
    if (token && isValidJWT(token)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (error) {
        console.error('Error parsing token for debug:', error);
      }
    }
  }, [token, isValidJWT]);

  useEffect(() => {
    let interval: NodeJS.Timeout | number | undefined;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);

      // Safely cleanup recording objects
      if (Platform.OS === 'web') {
        if (audioStream) {
          // Stop all audio tracks
          audioStream.getTracks().forEach(track => track.stop());
        }

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          try {
            mediaRecorder.stop();
          } catch (error) {
            console.log('Error stopping media recorder:', error);
          }
        }
      } else {
        if (recording) {
          // Handle promise rejection since we can't use async/await in cleanup
          recording.stopAndUnloadAsync().catch(error => {
            console.log('Error cleaning up recording:', error);
          });
        }
      }

    };
  }, [isRecording, audioStream, mediaRecorder, recording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation using MediaRecorder API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);

          const recorder = new MediaRecorder(stream);
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.start();
          setMediaRecorder(recorder);
          setAudioChunks(chunks);
          setIsRecording(true);
          setRecordingDuration(0);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          Alert.alert('Permission Error', 'Please allow microphone access to record.');
        }
      } else {
        // Native implementation
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please grant microphone access to record.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);
        setRecordingDuration(0);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        if (!mediaRecorder) return;

        // Create a promise that resolves when the recording is stopped
        const stopPromise = new Promise<void>(resolve => {
          mediaRecorder.onstop = () => {
            // Create a blob from the chunks
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            // Stop all tracks
            if (audioStream) {
              audioStream.getTracks().forEach(track => track.stop());
              setAudioStream(null);
            }

            setTempRecordingUri(audioBlob); // Store the blob directly for web
            setMediaRecorder(null);
            setAudioChunks([]);
            setIsRecording(false);
            resolve();
          };
        });

        // Stop the media recorder
        mediaRecorder.stop();

        // Wait for the recording to stop
        await stopPromise;

        setShowNameModal(true);
      } else {
        // Native implementation
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setTempRecordingUri(uri);
        setRecording(null);
        setIsRecording(false);
        setShowNameModal(true);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Could not save recording');
    }
  };

  // Callback for when modal saves successfully
  const handleSave = async (recordingName: string): Promise<void> => {
    console.log('Recording saved with name:', recordingName);
    // Clean up state
    setShowNameModal(false);
    setTempRecordingUri(null);
    setRecordingDuration(0);
  };

  // Callback for when modal is cancelled
  const handleCancel = (): void => {
    console.log('Recording cancelled');
    setShowNameModal(false);
    setTempRecordingUri(null);
    setRecordingDuration(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Timer Display */}
        <Text style={styles.timer}>
          {formatTime(recordingDuration)}
        </Text>

        {/* Record Button */}
        <RecordButton
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />

        {/* Name Recording Modal */}
        <NameRecordingModal
          visible={showNameModal}
          recordingUri={tempRecordingUri}
          patient={patient}
          request={request}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  mainContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 60,
    fontWeight: '300',
    textAlign: 'center',
    color: '#4A90E2',
    marginBottom: 30,
    marginTop: 20,
  },
  previousRecordings: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2D3748',
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
  },
  playButton: {
    padding: 8,
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  uploadedTag: {
    fontSize: 12,
    color: '#38A169',
    fontStyle: 'italic',
  },
  recordingDate: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  noRecordings: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 20,
  },
});

export default function AudioRecorderWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <AudioRecorder />
    </ProtectedRoute>
  );
}
