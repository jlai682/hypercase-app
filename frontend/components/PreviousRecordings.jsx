import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import config from '../config';
import { useAuth } from '../app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const PreviousRecordings = ({ patient }) => { // patient should be the patient ID
  const [recordings, setRecordings] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();
  const token = authState.token;

  // patient should already be the ID, but let's ensure it's a number
  const patientId = patient ? parseInt(patient) : null;

  const isTokenExpired = (token) => {
    if (!token || !isValidJWT(token)) return true;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return exp < currentTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  };

  const isValidJWT = (token) => {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || isTokenExpired(token) || !patientId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Updated endpoint to fetch recordings for specific patient
        const recordingRes = await fetch(`${config.BACKEND_URL}/api/recordings/patient/${patientId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!recordingRes.ok) {
          if (recordingRes.status === 404) {
            // No recordings found for this patient
            setRecordings([]);
            return;
          }
          throw new Error("Failed to get recordings");
        }

        const data = await recordingRes.json();
        setRecordings(data);
        console.log(`🎙️ Recordings fetched for patient ${patientId}:`, data);

      } catch (e) {
        console.error('Error fetching patient recordings:', e);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, patientId]); // Use patientId instead of patient

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

      if (Platform.OS === 'web') {
        // Web implementation
        const newSound = new window.Audio(fullUrl);
        console.log("🎧 Created Audio element:", newSound);

        // Check if browser supports the type
        const canPlayMp3 = newSound.canPlayType('audio/mpeg');
        const canPlayWav = newSound.canPlayType('audio/wav');
        const canPlayWebm = newSound.canPlayType('audio/webm');
        console.log(`🧪 canPlayType('audio/mpeg'): ${canPlayMp3}`);
        console.log(`🧪 canPlayType('audio/wav'): ${canPlayWav}`);
        console.log(`🧪 canPlayType('audio/webm'): ${canPlayWebm}`);

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
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );

        console.log("📱 Playing sound natively");
        setCurrentlyPlaying({ id: recordingId, sound: newSound });

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
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
        onPress={() => {
          if (currentlyPlaying?.id === item.id) {
            stopPlayback();
          } else {
            playRecording(item.file_url || item.recording_file, item.id);
          }
        }}
      >
        <Ionicons 
          name={currentlyPlaying?.id === item.id ? "stop-circle" : "play-circle"} 
          size={46} 
          color="#041575" 
        />
      </TouchableOpacity>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Previous Recordings</Text>
        <Text style={styles.loadingText}>Loading recordings...</Text>
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
          Previous Recordings
        </Text>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No recordings found for this patient
        </Text>
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
  playIconButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    paddingRight: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  button: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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