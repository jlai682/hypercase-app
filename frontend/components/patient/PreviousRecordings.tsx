import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from "expo-router";
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import config from '@/config';
import { useRecordingsByPatient } from '@/hooks/queries';


const PreviousRecordings = ({ patient }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const router = useRouter();

  const getPatientId = () => {
    if (!patient) return null;

    try {
      const parsedPatient = JSON.parse(patient);
      return parsedPatient.id;
    } catch {
      return parseInt(patient);
    }
  };

  const patientId = getPatientId();

  const { data: recordings = [], isLoading: loading, error: queryError } = useRecordingsByPatient(patientId);
  const error = queryError?.message || null;

  const playRecording = async (uri, recordingId) => {
    try {
      console.log("🔊 Attempting to play URI:", uri);

      // Stop currently playing recording if any
      if (currentlyPlaying) {
        console.log("⏹️ Stopping currently playing audio");
        await currentlyPlaying.sound.stopAsync();
        if (currentlyPlaying.sound.unloadAsync) {
          await currentlyPlaying.sound.unloadAsync();
        }
        setCurrentlyPlaying(null);
      }

      // Create full URL if it's a relative path
      const fullUrl = uri.startsWith('http') ? uri : `${config.BACKEND_URL}${uri}`;
      console.log("🌐 Full URL to play:", fullUrl);

      // Check if file is WebM (unsupported on iOS)
      if (Platform.OS === 'ios' && fullUrl.toLowerCase().includes('.webm')) {
        console.error("❌ WebM format not supported on iOS");
        Alert.alert(
          'Unsupported Format',
          'This recording is in WebM format which is not supported on iOS. Please use recordings made on iOS devices.'
        );
        return;
      }

      if (Platform.OS === 'web') {
        // Web implementation
        const newSound = new window.Audio(fullUrl);
        console.log("🎧 Created Audio element:", newSound);

        newSound.onerror = (e) => {
          console.error("❌ Audio load/play error:", e);
          Alert.alert('Error', 'Could not play this recording format');
        };

        // Create a wrapper object with compatible interface for our state
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

        newSound.onended = () => {
          console.log("✅ Finished playing audio");
          setCurrentlyPlaying(null);
        };

        const playPromise = newSound.play();

        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("❌ Failed to play audio:", err);
            Alert.alert('Error', 'Could not play recording');
          });
        }

        setCurrentlyPlaying({ id: recordingId, sound: soundWrapper });
      } else {
        // Native (mobile) implementation using Expo AV
        // Set audio mode for iOS playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        console.log("📱 Playing sound natively");
        setCurrentlyPlaying({ id: recordingId, sound: newSound });

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log("✅ Native audio finished");
            setCurrentlyPlaying(null);
          }
        });
      }
    } catch (err) {
      console.error('🚨 Failed to play recording:', err);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderItem = ({ item }) => {
      
    console.log("🎵 Rendering recording item:", item);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(patient)/recordings/${item.id}`)}   
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {item.name || item.title || `Recording ${item.id}`}
          </Text>
          <Text style={styles.description}>
            {item.description || `Recorded on ${formatDate(item.created_at || item.upload_date)}`}
          </Text>
          {item.request_title && (
            <Text style={styles.requestInfo}>
              Request: {item.request_title}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.playIconButton}
          onPress={(e) => {   
            e.stopPropagation();  

            const fileUrl = item.file_url || item.recording_file || item.audio_file;
            if (!fileUrl) {
              Alert.alert('Error', 'No audio file available for this recording');
              return;
            }

            if (currentlyPlaying?.id === item.id) {
              stopPlayback();
            } else {
              playRecording(fileUrl, item.id);
            }
          }}
        >
          <Ionicons
            name={currentlyPlaying?.id === item.id ? "stop-circle" : "play-circle"}
            size={46}
            color="#041575"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Previous Recordings</Text>
        <Text style={styles.loadingText}>Loading recordings...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Previous Recordings</Text>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.debugText}>Patient ID: {patientId}</Text>
      </View>
    );
  }

  // Show message if no patient is selected
  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Previous Recordings</Text>
        <Text style={styles.emptyText}>Select a recording request to view previous recordings</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={recordings}
      keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
      ListHeaderComponent={
        <Text style={styles.header}>
          Previous Recordings ({recordings.length} found)
        </Text>
      }
      ListEmptyComponent={
        <View>
          <Text style={styles.emptyText}>
            No recordings found for this patient
          </Text>
          <Text style={styles.debugText}>
            Patient ID: {patientId}
          </Text>
        </View>
      }
      renderItem={renderItem}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#041575',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
  },
  debugText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  playIconButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#041575',
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 6,
    lineHeight: 15,
  },
  requestInfo: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PreviousRecordings;