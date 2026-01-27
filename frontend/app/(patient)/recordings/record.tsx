import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from "@/components/auth/AuthContext";
import NameRecordingModal from '@/components/patient/NameRecordingModal';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';

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

  // Refs to track current state for cleanup
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const params = useLocalSearchParams();

  // Parse patient from URL params
  const parsePatient = (): Patient | null => {
    const patientParam = Array.isArray(params.patient) ? params.patient[0] : params.patient;
    if (!patientParam) return null;

    try {
      const parsed = JSON.parse(patientParam);
      return parsed as Patient;
    } catch (error) {
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

  // Keep refs in sync with state
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    mediaRecorderRef.current = mediaRecorder;
  }, [mediaRecorder]);

  useEffect(() => {
    audioStreamRef.current = audioStream;
  }, [audioStream]);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | number | undefined;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Cleanup recording objects on component unmount
      if (Platform.OS === 'web') {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch (error) {
            console.log('Error stopping media recorder:', error);
          }
        }
      } else {
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(error => {
            console.log('Error cleaning up recording:', error);
          });
        }
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
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
          mediaRecorderRef.current = recorder;
          audioStreamRef.current = stream;
          setMediaRecorder(recorder);
          setAudioChunks(chunks);
          setIsRecording(true);
          setRecordingDuration(0);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          Alert.alert('Permission Error', 'Please allow microphone access to record.');
        }
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please grant microphone access to record.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync({
          isMeteringEnabled: true,
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 44100,
            numberOfChannels: 2,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
            bitRate: 128000,
          },
          web: {
            mimeType: 'audio/wav',
            bitsPerSecond: 128000,
          },
        });

        recordingRef.current = newRecording;
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
        const currentMediaRecorder = mediaRecorderRef.current;
        const currentAudioStream = audioStreamRef.current;

        if (!currentMediaRecorder || currentMediaRecorder.state === 'inactive') {
          console.log('No active media recorder to stop');
          return;
        }

        const stopPromise = new Promise<void>(resolve => {
          currentMediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

            if (currentAudioStream) {
              currentAudioStream.getTracks().forEach(track => track.stop());
            }

            setTempRecordingUri(audioBlob);
            setAudioStream(null);
            setMediaRecorder(null);
            setAudioChunks([]);
            setIsRecording(false);
            resolve();
          };
        });

        currentMediaRecorder.stop();
        await stopPromise;
        setShowNameModal(true);
      } else {
        const currentRecording = recordingRef.current;

        if (!currentRecording) {
          console.log('No active recording to stop');
          return;
        }

        // Clear refs first to prevent double-unload from cleanup
        recordingRef.current = null;
        setRecording(null);
        setIsRecording(false);

        // Stop and unload the recording
        await currentRecording.stopAndUnloadAsync();

        // Get URI after stopping
        const uri = currentRecording.getURI();
        setTempRecordingUri(uri);
        setShowNameModal(true);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      // Reset state on error
      setRecording(null);
      recordingRef.current = null;
      setIsRecording(false);
      Alert.alert('Error', 'Could not save recording');
    }
  };

  const handleSave = async (recordingName: string): Promise<void> => {
    console.log('Recording saved with name:', recordingName);
    setShowNameModal(false);
    setTempRecordingUri(null);
    setRecordingDuration(0);
  };

  const handleCancel = (): void => {
    console.log('Recording cancelled');
    setShowNameModal(false);
    setTempRecordingUri(null);
    setRecordingDuration(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton route="/(patient)/recordings" />
        <Text style={styles.headerTitle}>Record Audio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Request Info Card */}
        {request && (
          <View style={styles.requestCard}>
            <View style={styles.requestIconContainer}>
              <Ionicons name="document-text" size={24} color="#041575" />
            </View>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>{request.title}</Text>
              {request.description && (
                <Text style={styles.requestDescription} numberOfLines={2}>
                  {request.description}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Main Recording Area */}
        <View style={styles.mainContent}>
          {/* Waveform Visualization Placeholder */}
          <View style={styles.waveformContainer}>
            <View style={styles.waveformPlaceholder}>
              {isRecording ? (
                <View style={styles.waveformBars}>
                  {[...Array(12)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveformBar,
                        { height: 20 + Math.sin(i * 0.8) * 15 + (isRecording ? Math.random() * 20 : 0) }
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <Ionicons name="pulse" size={40} color="#BDC3C7" />
              )}
            </View>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timer, isRecording && styles.timerRecording]}>
              {formatTime(recordingDuration)}
            </Text>
            <Text style={styles.timerLabel}>
              {isRecording ? 'Recording in progress' : 'Ready to record'}
            </Text>
          </View>

          {/* Record Button */}
          <View style={styles.recordButtonWrapper}>
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              activeOpacity={0.7}
            >
              <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]}>
                {isRecording ? (
                  <Ionicons name="stop" size={36} color="#fff" />
                ) : (
                  <Ionicons name="mic" size={36} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.recordButtonLabel}>
              {isRecording ? 'Tap to stop' : 'Tap to start recording'}
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="volume-high" size={18} color="#041575" />
              </View>
              <Text style={styles.instructionText}>Speak clearly into your device</Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="ban" size={18} color="#041575" />
              </View>
              <Text style={styles.instructionText}>Avoid background noise</Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="time" size={18} color="#041575" />
              </View>
              <Text style={styles.instructionText}>Record for at least 10 seconds</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Name Recording Modal */}
      <NameRecordingModal
        visible={showNameModal}
        recordingUri={tempRecordingUri}
        patient={patient}
        request={request}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  requestDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  waveformContainer: {
    width: '100%',
    height: 100,
    marginBottom: 24,
  },
  waveformPlaceholder: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waveformBar: {
    width: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timer: {
    fontSize: 64,
    fontWeight: '200',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
    letterSpacing: 2,
  },
  timerRecording: {
    color: '#E74C3C',
  },
  timerLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
    fontFamily: 'Figtree_400Regular',
  },
  recordButtonWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(4, 21, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  recordButtonInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#041575',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonInnerActive: {
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
  },
  recordButtonLabel: {
    fontSize: 15,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: 'Figtree_400Regular',
  },
});

export default function AudioRecorderWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <AudioRecorder />
    </ProtectedRoute>
  );
}
