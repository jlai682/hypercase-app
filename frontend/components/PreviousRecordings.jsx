// Updated PreviousRecordings component with better debugging
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

const PreviousRecordings = ({ patient }) => {
  const [recordings, setRecordings] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useAuth();
  const token = authState.token;

  // Parse patient ID properly
  const getPatientId = () => {
    if (!patient) return null;
    
    try {
      // If patient is a JSON string, parse it and get the ID
      const parsedPatient = JSON.parse(patient);
      return parsedPatient.id;
    } catch (e) {
      // If it's already a number/string, use it directly
      return parseInt(patient);
    }
  };

  const patientId = getPatientId();

  console.log("🔍 PreviousRecordings Debug:");
  console.log("- Raw patient prop:", patient);
  console.log("- Parsed patientId:", patientId);
  console.log("- Token exists:", !!token);

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
      console.log("🚀 Starting fetchData...");
      
      if (!token || isTokenExpired(token)) {
        console.log("❌ Token invalid or expired");
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      if (!patientId) {
        console.log("❌ No patient ID available");
        setError("No patient selected");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Try multiple endpoints to see which one works
        const endpoints = [
          `/api/recordings/patient/${patientId}/`,
          `/api/recordings/provider-patient-recordings/?patient_id=${patientId}`,
          `/api/recordings/by_patient/?patient_id=${patientId}`
        ];
        
        let successfulData = null;
        let successfulEndpoint = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying endpoint: ${config.BACKEND_URL}${endpoint}`);
            
            const response = await fetch(`${config.BACKEND_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            console.log(`📡 Response status for ${endpoint}:`, response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`✅ Success with ${endpoint}:`, data);
              successfulData = data;
              successfulEndpoint = endpoint;
              break;
            } else {
              const errorText = await response.text();
              console.log(`❌ Error ${response.status} for ${endpoint}:`, errorText);
            }
          } catch (endpointError) {
            console.log(`❌ Network error for ${endpoint}:`, endpointError.message);
          }
        }
        
        if (successfulData) {
          console.log(`🎉 Using data from ${successfulEndpoint}:`, successfulData);
          setRecordings(successfulData);
        } else {
          console.log("❌ All endpoints failed");
          setError("Failed to fetch recordings from all endpoints");
          setRecordings([]);
        }

      } catch (e) {
        console.error('❌ Error fetching patient recordings:', e);
        setError(e.message);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, patientId]);

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

  const renderItem = ({ item }) => {
    console.log("🎵 Rendering recording item:", item);
    
    return (
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
      </View>
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
        <Text style={styles.debugText}>Token: {token ? "Present" : "Missing"}</Text>
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
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PreviousRecordings;