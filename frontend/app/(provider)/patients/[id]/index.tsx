import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Pressable,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import config from '@/config';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Recording } from '@/types';
import {
  usePatientByEmail,
  useSurveysByPatient,
  useRecordingsByPatient,
  useRecordingRequestsByPatient,
  useCreateRecordingRequest,
  useDeletePatientConnection,
  useDeleteRecording,
} from '@/hooks/queries';

interface SoundWrapper {
  stopAsync: () => Promise<void>;
  unloadAsync: () => Promise<void>;
}

interface PlayingAudio {
  uri: string;
  sound: SoundWrapper | Audio.Sound;
}

function PatientDetailsScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, email } = useLocalSearchParams<{ id: string; email: string }>();

  // Tanstack Query hooks for data fetching
  const { data: patient, error: patientError } = usePatientByEmail(email);
  const { data: surveys = [] } = useSurveysByPatient(patient?.id);
  const { data: previousRecordings = [] } = useRecordingsByPatient(patient?.id);
  const { data: recordingRequests = [] } = useRecordingRequestsByPatient(patient?.id);

  // Mutations
  const createRecordingRequestMutation = useCreateRecordingRequest();
  const deleteConnectionMutation = useDeletePatientConnection();
  const deleteRecordingMutation = useDeleteRecording();

  // Audio playback states
  const currentlyPlayingRef = useRef<PlayingAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [requestTitle, setRequestTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>(new Date());

  /**
   * Get patient initials for avatar
   */
  const getInitials = (): string => {
    if (!patient) return '?';
    const first = patient.firstName?.charAt(0)?.toUpperCase() || '';
    const last = patient.lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  /**
   * Get recordings from this week
   */
  const getRecordingsThisWeek = (): number => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return previousRecordings.filter(
      (r) => new Date(r.created_at) > oneWeekAgo
    ).length;
  };

  /**
   * Play audio recording
   */
  const playRecording = async (uri: string): Promise<void> => {
    try {
      await stopPlayback();

      const fullUrl = uri.startsWith('http') ? uri : `${config.BACKEND_URL}${uri}`;

      if (Platform.OS === 'web') {
        const newSound = new window.Audio(fullUrl);

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
          currentlyPlayingRef.current = null;
          setIsPlaying(false);
        };

        newSound.onerror = () => {
          Alert.alert('Error', 'Could not play recording');
        };

        newSound.play().catch(() => {
          Alert.alert('Error', 'Could not play recording');
        });

        currentlyPlayingRef.current = { uri: fullUrl, sound: soundWrapper };
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        currentlyPlayingRef.current = { uri: fullUrl, sound: newSound };
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            currentlyPlayingRef.current = null;
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Failed to play recording:', err);
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
  const confirmDeleteConnection = (): void => {
    if (!patient) return;

    deleteConnectionMutation.mutate(patient.id, {
      onSuccess: () => {
        setDeleteModalVisible(false);
        Alert.alert('Success', 'Patient connection removed successfully!');
        router.push('/(provider)/dashboard' as any);
      },
      onError: (error) => {
        setDeleteModalVisible(false);
        Alert.alert('Error', error.message || 'Failed to remove patient connection');
      },
    });
  };

  /**
   * Delete a recording with confirmation
   */
  const confirmDeleteRecording = (recording: Recording): void => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecordingMutation.mutate(recording.id, {
              onSuccess: () => {
                Alert.alert('Success', 'Recording deleted successfully.');
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'Failed to delete recording.');
              },
            });
          },
        },
      ]
    );
  };

  /**
   * Submit new recording request
   */
  const submitRecordingRequest = (): void => {
    if (!patient) return;

    if (!requestTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    createRecordingRequestMutation.mutate(
      {
        patientId: patient.id,
        title: requestTitle,
        description: 'Please record your voice and submit it.',
        dueDate: dueDate.toISOString(),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Recording request sent successfully!');
          setRequestTitle('');
          setDueDate(new Date());
          setModalVisible(false);
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to send recording request');
        },
      }
    );
  };

  /**
   * Handle previous recording press
   */
  const handlePreviousRecordingPress = (recording: Recording): void => {
    router.push({
      pathname: `/(provider)/patients/${id}/recordings/${recording.id}`,
    } as any);
  };

  /**
   * Format date for display
   */
  const formatRecordingDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${month} ${day}, ${year} • ${displayHours}:${minutes} ${ampm}`;
  };

  // Filter and sort surveys and recordings (most recent first)
  const pendingSurveys = surveys
    .filter((survey) => survey.status === 'sent')
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  const completedSurveys = surveys
    .filter((survey) => survey.status === 'completed')
    .sort((a, b) => new Date(b.response_date || b.issue_date).getTime() - new Date(a.response_date || a.issue_date).getTime());
  const pendingRecordings = recordingRequests
    .filter((req) => req.status === 'sent')
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  const completedRecordings = previousRecordings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const recordingsThisWeek = getRecordingsThisWeek();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  if (patientError) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerBar}>
          <BackButton route="/(provider)/dashboard" />
          <Text style={styles.headerTitle}>Patient Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ color: 'red', padding: 20 }}>{patientError.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <BackButton route="/(provider)/dashboard" />
          <Text style={styles.headerTitle}>Patient Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Patient Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
            <View style={styles.statusDot} />
          </View>
          {patient ? (
            <>
              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={styles.patientEmail}>{patient.email}</Text>
            </>
          ) : (
            <Text style={styles.patientName}>Loading...</Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RECORDINGS</Text>
            <Text style={styles.statValue}>{previousRecordings.length}</Text>
            <Text style={[styles.statStatus, { color: '#27AE60' }]}>
              +{recordingsThisWeek} this week
            </Text>
          </View>
        </View>

        {/* Pending Surveys Section */}
        <Text style={styles.sectionTitle}>Pending Surveys</Text>
        <View style={styles.surveysCard}>
          {pendingSurveys.length > 0 ? (
            pendingSurveys.map((survey) => (
              <View key={survey.id} style={styles.surveyItem}>
                <Ionicons name="document-text-outline" size={20} color="#041575" />
                <View style={styles.surveyInfo}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <Text style={styles.surveyDate}>
                    Sent: {new Date(survey.issue_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={40} color="#BDC3C7" />
              <Text style={styles.emptyText}>No pending surveys for this patient.</Text>
            </View>
          )}
        </View>

        {/* Pending Recordings Section */}
        <Text style={styles.sectionTitle}>Pending Recordings</Text>
        <View style={styles.surveysCard}>
          {pendingRecordings.length > 0 ? (
            pendingRecordings.map((request) => (
              <View key={request.id} style={styles.surveyItem}>
                <Ionicons name="mic-outline" size={20} color="#E67E22" />
                <View style={styles.surveyInfo}>
                  <Text style={styles.surveyTitle}>{request.title}</Text>
                  <Text style={styles.surveyDate}>
                    Sent: {new Date(request.issue_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="mic-off-outline" size={40} color="#BDC3C7" />
              <Text style={styles.emptyText}>No pending recording requests.</Text>
            </View>
          )}
        </View>

        {/* Completed Surveys Section */}
        <Text style={styles.sectionTitle}>Completed Surveys</Text>
        <View style={styles.surveysCard}>
          {completedSurveys.length > 0 ? (
            completedSurveys.map((survey) => (
              <Pressable
                key={survey.id}
                style={styles.surveyItem}
                onPress={() => router.push(`/(provider)/patients/${id}/survey/view/${survey.id}?patientId=${patient?.id}` as any)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                <View style={styles.surveyInfo}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <Text style={styles.surveyDate}>
                    Completed: {survey.response_date ? new Date(survey.response_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color="#BDC3C7" />
              <Text style={styles.emptyText}>No completed surveys yet.</Text>
            </View>
          )}
        </View>

        {/* Completed Recordings Section */}
        <Text style={styles.sectionTitle}>Completed Recordings</Text>
        {completedRecordings.length > 0 ? (
          completedRecordings.map((recording) => {
            const fileUrl = recording.file_url || (recording as any).recording_file || (recording as any).audio_file;
            const itemIsPlaying =
              isPlaying &&
              currentlyPlayingRef.current?.uri !== undefined &&
              fileUrl !== undefined &&
              currentlyPlayingRef.current.uri.includes(fileUrl);

            return (
              <Pressable
                key={recording.id}
                style={styles.recordingCard}
                onPress={() => handlePreviousRecordingPress(recording)}
              >
                <View style={styles.recordingIconContainer}>
                  <Ionicons name="mic" size={20} color="#6B7AED" />
                </View>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTitle}>{recording.title}</Text>
                  <Text style={styles.recordingDate}>
                    {formatRecordingDate(recording.created_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    confirmDeleteRecording(recording);
                  }}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (itemIsPlaying) {
                      stopPlayback();
                    } else {
                      if (!fileUrl) {
                        Alert.alert('Error', 'No audio file available');
                        return;
                      }
                      playRecording(fileUrl);
                    }
                  }}
                >
                  <Ionicons
                    name={itemIsPlaying ? 'stop' : 'play'}
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.surveysCard}>
            <View style={styles.emptyState}>
              <Ionicons name="mic-off-outline" size={40} color="#BDC3C7" />
              <Text style={styles.emptyText}>No recordings yet.</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.primaryButton} onPress={createSurvey}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Send New Survey</Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="pulse" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Request New Recording</Text>
          </Pressable>

          <Pressable
            style={styles.dangerButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Ionicons name="person-remove-outline" size={18} color="#DC2626" />
            <Text style={styles.dangerButtonText}>Remove Patient</Text>
          </Pressable>
        </View>

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
  content: {
    flexGrow: 1,
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Figtree_700Bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27AE60',
    borderWidth: 3,
    borderColor: '#cae7ff',
  },
  patientName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 15,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F8C8D',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: 'Figtree_400Regular',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
  },
  statStatus: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Figtree_400Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
  },
  surveysCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  surveyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  surveyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  surveyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  surveyDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: 'Figtree_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 12,
    fontFamily: 'Figtree_400Regular',
  },
  recordingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  recordingDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: 'Figtree_400Regular',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#041575',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  dangerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  dangerButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 15,
    fontFamily: 'Figtree_700Bold',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    fontFamily: 'Figtree_400Regular',
    fontSize: 15,
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
    fontFamily: 'Figtree_400Regular',
  },
  dateButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
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
    fontFamily: 'Figtree_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#6B7280',
  },
  buttonSubmit: {
    backgroundColor: '#041575',
  },
  buttonDelete: {
    backgroundColor: '#DC2626',
  },
  textStyle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Figtree_400Regular',
  },
  deleteWarningText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function PatientDetailsWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <PatientDetailsScreen />
    </ProtectedRoute>
  );
}
