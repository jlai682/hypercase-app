import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile, useRecordingRequests, usePatientRecordings } from '@/hooks/queries';
import { RecordingRequest, Recording } from '@/types';
import config from '@/config';

function RecordingsScreen(): React.JSX.Element {
  const router = useRouter();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ id: string | number; sound: any } | null>(null);

  // Tanstack Query hooks
  const { data: patient } = usePatientProfile();
  const { data: recordingRequests = [], isLoading: loadingRequests } = useRecordingRequests();
  const { data: recordings = [], isLoading: loadingRecordings } = usePatientRecordings();

  const loading = loadingRequests || loadingRecordings;

  // Filter pending requests
  const pendingRequests = useMemo(() =>
    recordingRequests.filter((req: RecordingRequest) => req.status === 'sent'),
    [recordingRequests]
  );

  // Sort recordings from most recent to oldest
  const sortedRecordings = useMemo(() =>
    [...recordings].sort((a: Recording, b: Recording) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [recordings]
  );

  const formatDate = (dateString: string): string => {
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

  const playRecording = async (item: Recording) => {
    try {
      const fileUrl = item.file_url;
      console.log(fileUrl)
      if (!fileUrl) {
        Alert.alert('Error', 'No audio file available for this recording');
        return;
      }

      // Stop currently playing recording if any
      if (currentlyPlaying) {
        await currentlyPlaying.sound.stopAsync();
        if (currentlyPlaying.sound.unloadAsync) {
          await currentlyPlaying.sound.unloadAsync();
        }
        setCurrentlyPlaying(null);
      }

      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${config.BACKEND_URL}${fileUrl}`;

      if (Platform.OS === 'ios' && fullUrl.toLowerCase().includes('.webm')) {
        Alert.alert('Unsupported Format', 'This recording is in WebM format which is not supported on iOS.');
        return;
      }

      if (Platform.OS === 'web') {
        const newSound = new window.Audio(fullUrl);
        const soundWrapper = {
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
          }
        };

        newSound.onended = () => setCurrentlyPlaying(null);
        newSound.onerror = () => Alert.alert('Error', 'Could not play this recording');
        newSound.play().catch(() => Alert.alert('Error', 'Could not play recording'));
        setCurrentlyPlaying({ id: item.id, sound: soundWrapper });
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        setCurrentlyPlaying({ id: item.id, sound: newSound });

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setCurrentlyPlaying(null);
          }
        });
      }
    } catch (err) {
      console.error('Failed to play recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  const stopPlayback = async () => {
    if (currentlyPlaying) {
      await currentlyPlaying.sound.stopAsync();
      if (currentlyPlaying.sound.unloadAsync) {
        await currentlyPlaying.sound.unloadAsync();
      }
      setCurrentlyPlaying(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.loadingText}>Loading recordings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recordings</Text>
          <Text style={styles.headerSubtitle}>Track your voice health progress</Text>
        </View>

        {/* Pending Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pendingRequests.length}</Text>
            </View>
          </View>

          {pendingRequests.length > 0 ? (
            <View style={styles.requestsContainer}>
              {pendingRequests.map((request: RecordingRequest) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() => router.push({
                    pathname: '/(patient)/recordings/record',
                    params: {
                      request: JSON.stringify(request),
                      patient: JSON.stringify(patient),
                    },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestIconContainer}>
                    <Ionicons name="mic" size={24} color="#041575" />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    {request.due_date && (
                      <Text style={styles.requestDueDate}>
                        Due: {formatDate(request.due_date)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.recordNowButton}>
                    <Text style={styles.recordNowText}>Record</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="mic-off-outline" size={32} color="#041575" />
              </View>
              <Text style={styles.emptyStateText}>No sent requests</Text>
            </View>
          )}
        </View>

        {/* Previous Recordings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Previous Recordings</Text>
            <Text style={styles.foundText}>{sortedRecordings.length} found</Text>
          </View>

          {sortedRecordings.length > 0 ? (
            <View style={styles.recordingsContainer}>
              {sortedRecordings.map((recording: Recording) => (
                <TouchableOpacity
                  key={recording.id}
                  style={styles.recordingCard}
                  onPress={() => router.push(`/(patient)/recordings/${recording.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle}>
                      {recording.title || `Recording ${recording.id}`}
                    </Text>
                    <View style={styles.recordingDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#7F8C8D" />
                      <Text style={styles.recordingDate}>
                        {formatDate(recording.created_at)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (currentlyPlaying?.id === recording.id) {
                        stopPlayback();
                      } else {
                        playRecording(recording);
                      }
                    }}
                  >
                    <Ionicons
                      name={currentlyPlaying?.id === recording.id ? "stop" : "play"}
                      size={20}
                      color="#041575"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecordingsContainer}>
              <Ionicons name="musical-notes-outline" size={48} color="#BDC3C7" />
              <Text style={styles.emptyRecordingsText}>No recordings yet</Text>
              <Text style={styles.emptyRecordingsSubtext}>
                Complete a recording request to see your recordings here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
  },
  countBadge: {
    backgroundColor: '#041575',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  foundText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  requestsContainer: {
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  requestDueDate: {
    fontSize: 13,
    color: '#E67E22',
    fontFamily: 'Figtree_400Regular',
  },
  recordNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041575',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  recordNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  emptyStateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(4, 21, 117, 0.1)',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  recordingsContainer: {
    gap: 12,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 6,
    fontFamily: 'Figtree_400Regular',
  },
  recordingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDate: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRecordingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyRecordingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
    fontFamily: 'Figtree_400Regular',
  },
  emptyRecordingsSubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
  },
});

export default function RecordingsListWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <RecordingsScreen />
    </ProtectedRoute>
  );
}
