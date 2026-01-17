import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Pressable,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import config from '@/config';
import { useAuth } from '@/components/auth/AuthContext';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import profile from '@/assets/images/profile.png';
import { Patient, Survey, Recording, RecordingRequest } from '@/types';

interface SoundWrapper {
  stopAsync: () => Promise<void>;
  unloadAsync: () => Promise<void>;
}

interface PlayingAudio {
  uri: string;
  sound: SoundWrapper | Audio.Sound;
}

function PatientDetailsScreen(): React.JSX.Element {
  const { authState } = useAuth();
  const token = authState?.token;
  const router = useRouter();
  const { id, email } = useLocalSearchParams<{ id: string; email: string }>();

  // Patient and data states
  const [patient, setPatient] = useState<Patient | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [recordingRequests, setRecordingRequests] = useState<RecordingRequest[]>([]);
  const [previousRecordings, setPreviousRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio playback states
  const currentlyPlayingRef = useRef<PlayingAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [requestTitle, setRequestTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>(new Date());

  /**
   * Play audio recording
   */
  const playRecording = async (uri: string): Promise<void> => {
    try {
      console.log("🔊 Attempting to play URI:", uri);
      await stopPlayback();

      const fullUrl = uri.startsWith('http') ? uri : `${config.BACKEND_URL}${uri}`;
      console.log("🌐 Full URL to play:", fullUrl);

      if (Platform.OS === 'web') {
        const newSound = new window.Audio(fullUrl);
        console.log("🎧 Created Audio element:", newSound);

        const canPlayMp3 = newSound.canPlayType('audio/mpeg');
        const canPlayWav = newSound.canPlayType('audio/wav');
        console.log(`🧪 canPlayType('audio/mpeg'): ${canPlayMp3}`);
        console.log(`🧪 canPlayType('audio/wav'): ${canPlayWav}`);

        newSound.onerror = (e) => {
          console.error("❌ Audio load/play error:", e);
        };

        const soundWrapper: SoundWrapper = {
          stopAsync: () => {
            newSound.pause();
            newSound.currentTime = 0;
            return Promise.resolve();
          },
          unloadAsync: () => {
            newSound.pause();
            newSound.currentTime = 0;
            newSound.src = '';
            return Promise.resolve();
          },
        };

        newSound.onended = () => {
          console.log("✅ Finished playing audio");
          currentlyPlayingRef.current = null;
          setIsPlaying(false);
        };

        const playPromise = newSound.play();

        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("❌ Failed to play audio:", err);
          });
        }

        currentlyPlayingRef.current = { uri: fullUrl, sound: soundWrapper };
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        console.log("📱 Playing sound natively");
        currentlyPlayingRef.current = { uri: fullUrl, sound: newSound };
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log("✅ Native audio finished");
            currentlyPlayingRef.current = null;
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('🚨 Failed to play recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  /**
   * Stop current playback
   */
  const stopPlayback = async (): Promise<void> => {
    if (currentlyPlayingRef.current) {
      try {
        await currentlyPlayingRef.current.sound.stopAsync();
        if ('unloadAsync' in currentlyPlayingRef.current.sound) {
          await currentlyPlayingRef.current.sound.unloadAsync();
        }
      } catch (err) {
        console.error('Error stopping playback:', err);
      }
      currentlyPlayingRef.current = null;
      setIsPlaying(false);
    }
  };

  /**
   * Fetch patient details using email
   */
  const fetchPatient = useCallback(async (): Promise<void> => {
    if (!token || !email) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/search_patient/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setPatient(data.patient || data);
        console.log("PATIENT DATA:", data.patient || data);
      } else {
        setError(data.error || 'Patient not found');
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      setError('An error occurred while fetching patient data');
    }
  }, [email, token]);

  /**
   * Fetch surveys for this patient
   */
  const fetchSurveys = useCallback(async (): Promise<void> => {
    if (!patient || !token) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/surveyManagement/get_surveys/${patient.id}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSurveys(data);
      } else {
        console.error('Error fetching surveys:', data.error);
        setError(data.error || 'Failed to fetch surveys');
      }
    } catch (error) {
      console.error('Request failed:', error);
      setError('Something went wrong while fetching surveys.');
    }
  }, [patient, token]);

  /**
   * Fetch previous recordings for this patient
   */
  const fetchPreviousRecordings = useCallback(async (): Promise<void> => {
    if (!patient || !token) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/recordings/patient/${patient.id}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recordings');
      }

      const data = await response.json();
      console.log('Recordings:', data);
      setPreviousRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  }, [patient, token]);

  /**
   * Fetch recording requests for this patient
   */
  const fetchRecordingRequests = useCallback(async (): Promise<void> => {
    if (!patient || !token) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/recordings/recording-requests/patient/${patient.id}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setRecordingRequests(data);
      } else {
        console.error('Error fetching recording requests:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  }, [patient, token]);

  /**
   * Create a new survey for this patient
   */
  const createSurvey = (): void => {
    router.push({
      pathname: `/(provider)/patients/${patient.id}/survey/selectQuestions`,
      params: {
        patient: JSON.stringify(patient),
      },
    } as any);
  };

  /**
   * Delete patient-provider connection
   */
  const confirmDeleteConnection = async (): Promise<void> => {
    if (!patient || !token) return;

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/delete_patient_provider_connection/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: patient.id,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setDeleteModalVisible(false);
        Alert.alert('Success', 'Patient connection removed successfully!');
        router.push('/(provider)/dashboard' as any);
      } else {
        setDeleteModalVisible(false);
        Alert.alert('Error', data.error || 'Failed to remove patient connection');
      }
    } catch {
      setDeleteModalVisible(false);
      Alert.alert('Error', 'An error occurred while removing the patient connection');
    }
  };

  /**
   * Submit new recording request
   */
  const submitRecordingRequest = async (): Promise<void> => {
    if (!patient || !token) return;

    if (!requestTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/recordings/recording-requests/create/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: patient.id,
            title: requestTitle,
            description: 'Please record your voice and submit it.',
            due_date: dueDate.toISOString(),
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Recording request sent successfully!');
        fetchRecordingRequests();
        setRequestTitle('');
        setDueDate(new Date());
        setModalVisible(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to send recording request');
      }
    } catch {
      Alert.alert('Error', 'An error occurred while sending the recording request');
    }
  };

  /**
   * Handle completed survey press
   */
  const handleCompletedSurveyPress = (survey: Survey): void => {
    router.push({
      pathname: `/(provider)/patients/${id}/survey/view/${survey.id}`,
      params: {
        patientId: id,
      },
    } as any);
  };

  /**
   * Handle previous recording press
   */
  const handlePreviousRecordingPress = (recording: Recording): void => {
    router.push({
      pathname: `/(provider)/patients/${id}/recordings/${recording.id}`,
    } as any);
  };

  // Filter surveys and recordings
  const pendingSurveys = surveys.filter((survey) => survey.status === 'sent');
  const completedSurveys = surveys
    .filter((survey) => survey.status === 'completed')
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  const pendingRecordings = recordingRequests.filter((req) => req.status === 'sent');

  /**
   * Render recording item
   */
  const renderRecordingItem = ({ item }: { item: Recording }): React.JSX.Element => {
    const fileUrl = item.file_url || (item as any).recording_file || (item as any).audio_file;
    const itemIsPlaying =
      isPlaying &&
      currentlyPlayingRef.current?.uri !== undefined &&
      fileUrl !== undefined &&
      currentlyPlayingRef.current.uri.includes(fileUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePreviousRecordingPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <TouchableOpacity
          style={styles.playIconButton}
          onPress={(e) => {
            e.stopPropagation();
            if (itemIsPlaying) {
              stopPlayback();
            } else {
              if (!fileUrl) {
                Alert.alert('Error', 'No audio file available for this recording');
                return;
              }
              playRecording(fileUrl);
            }
          }}
        >
          <Ionicons
            name={itemIsPlaying ? 'stop-circle' : 'play-circle'}
            size={46}
            color="#041575"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Fetch data when page comes into focus (e.g., after creating survey or recording request)
  useFocusEffect(
    useCallback(() => {
      if (email) {
        fetchPatient();
      }
    }, [email, fetchPatient])
  );

  useFocusEffect(
    useCallback(() => {
      if (patient) {
        fetchSurveys();
        fetchRecordingRequests();
        fetchPreviousRecordings();
      }
    }, [patient, fetchSurveys, fetchRecordingRequests, fetchPreviousRecordings])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <BackButton route="/(provider)/dashboard" />
        <Text style={{ color: 'red', padding: 20 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10, marginBottom: 10 }}>
          <BackButton route="/(provider)/dashboard" />
        </View>

        {/* Patient Header */}
        <View style={styles.header}>
          <Image source={profile} style={styles.profileImage} />
          {patient ? (
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        {/* Pending Surveys */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Surveys:</Text>
          {pendingSurveys.length > 0 ? (
            <FlatList
              data={pendingSurveys}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.surveyItem}
                  onPress={() => console.log(`Pending survey clicked: ${item.title}`)}
                >
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>
                    {new Date(item.issue_date).toLocaleDateString()}
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <Text>No pending surveys.</Text>
          )}
        </View>

        {/* Completed Surveys */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Completed Surveys:</Text>
          {completedSurveys.length > 0 ? (
            <FlatList
              data={completedSurveys}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.surveyItem} onPress={() => handleCompletedSurveyPress(item)}>
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>
                    {new Date(item.issue_date).toLocaleDateString()}
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <Text>No completed surveys found.</Text>
          )}
        </View>

        {/* Pending Recordings */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Recordings:</Text>
          {pendingRecordings.length > 0 ? (
            <FlatList
              data={pendingRecordings}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.surveyItem} onPress={() => console.log("Clicked Pending Recording")}>
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>
                    Issued: {new Date(item.issue_date).toLocaleDateString()}
                  </Text>
                  {item.due_date && (
                    <Text style={styles.dueDateText}>
                      Due: {new Date(item.due_date).toLocaleDateString()} at{' '}
                      {new Date(item.due_date).toLocaleTimeString()}
                    </Text>
                  )}
                </Pressable>
              )}
            />
          ) : (
            <Text>No pending recordings.</Text>
          )}
        </View>

        {/* Previous Recordings */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Previous Recordings:</Text>
          <FlatList
            data={previousRecordings}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No Recordings yet</Text>}
            renderItem={renderRecordingItem}
          />
        </View>

        {/* Action Buttons */}
        <Pressable style={styles.surveyButton} onPress={createSurvey}>
          <Text style={styles.surveyButtonText}>Send a New Survey</Text>
        </Pressable>

        <Pressable
          style={[styles.surveyButton, styles.recordingButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.surveyButtonText}>Send a New Recording Request</Text>
        </Pressable>

        <Pressable
          style={[styles.surveyButton, styles.deleteConnectionButton]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Text style={styles.surveyButtonText}>Remove this patient</Text>
        </Pressable>

        {/* Recording Request Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>New Recording Request</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter recording title"
                value={requestTitle}
                onChangeText={setRequestTitle}
              />
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Due Date:</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate.toLocaleString()}
                  editable={false}
                />
                <View style={styles.dateButtonsRow}>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(dueDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setDueDate(newDate);
                    }}
                  >
                    <Text style={styles.dateButtonText}>+1 Day</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(dueDate);
                      newDate.setDate(newDate.getDate() + 7);
                      setDueDate(newDate);
                    }}
                  >
                    <Text style={styles.dateButtonText}>+1 Week</Text>
                  </Pressable>
                  <Pressable style={styles.dateButton} onPress={() => setDueDate(new Date())}>
                    <Text style={styles.dateButtonText}>Reset</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setModalVisible(false);
                    setRequestTitle('');
                    setDueDate(new Date());
                  }}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.button, styles.buttonSubmit]} onPress={submitRecordingRequest}>
                  <Text style={styles.textStyle}>Submit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Remove Patient Connection</Text>
              <Text style={styles.deleteWarningText}>
                Are you sure you want to remove this patient connection? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonDelete]}
                  onPress={confirmDeleteConnection}
                >
                  <Text style={styles.textStyle}>Yes, Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    paddingRight: 15,
    marginBottom: 16,
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.05)',
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Figtree_400Regular',
  },
  playIconButton: {
    padding: 8,
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    width: '100%',
    padding: 20,
    fontFamily: 'Figtree_400Regular',
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  patientName: {
    fontSize: 35,
    fontFamily: 'Figtree_400Regular',
    color: '#041575',
    paddingRight: 10,
  },
  surveysContainer: {
    marginTop: 20,
  },
  surveyItem: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#041575',
  },
  surveyDate: {
    marginTop: 5,
    color: '#666',
  },
  dueDateText: {
    marginTop: 5,
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  surveyButton: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#1565C0',
    marginTop: 15,
  },
  deleteConnectionButton: {
    backgroundColor: '#DC2626',
    marginTop: 15,
  },
  surveyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#041575',
    marginBottom: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#041575',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 8,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#888',
  },
  buttonSubmit: {
    backgroundColor: '#041575',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  deleteWarningText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonDelete: {
    backgroundColor: '#DC2626',
  },
});

export default function PatientDetailsWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <PatientDetailsScreen />
    </ProtectedRoute>
  );
}
