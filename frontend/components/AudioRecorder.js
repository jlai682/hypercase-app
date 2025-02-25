import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Web-compatible storage solution using browser localStorage for web
const STORAGE_KEY = 'audio_recordings';

// Storage utility functions for cross-platform compatibility
const storage = {
  getItem: async (key) => {
    try {
      // Use localStorage for web
      if (Platform.OS === 'web') {
        const item = localStorage.getItem(key);
        return item ? item : null;
      } 
      // For native platforms, we'll just use in-memory storage for now
      // You can implement a more persistent storage later
      return null;
    } catch (e) {
      console.error('Error getting data from storage:', e);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      // Use localStorage for web
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      }
      // For native platforms, we'll just use in-memory storage
      // You can implement a more persistent storage later
    } catch (e) {
      console.error('Error storing data:', e);
    }
  }
};

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [tempRecordingUri, setTempRecordingUri] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newRecordingName, setNewRecordingName] = useState('');

  useEffect(() => {
    loadRecordings();

    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [isRecording]);

  const loadRecordings = async () => {
    try {
      const storedRecordings = await storage.getItem(STORAGE_KEY);
      if (storedRecordings) {
        // Parse stored recordings and convert date strings back to Date objects
        const parsedRecordings = JSON.parse(storedRecordings).map(item => ({
          ...item,
          date: new Date(item.date)
        }));
        setRecordings(parsedRecordings);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const saveRecordingsToStorage = async (updatedRecordings) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(updatedRecordings));
    } catch (error) {
      console.error('Failed to save recordings to storage:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  const startRecording = async () => {
    try {
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
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setTempRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);
      setShowNameModal(true);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Could not save recording');
    }
  };

  const saveRecording = async () => {
    if (!tempRecordingUri || !newRecordingName.trim()) {
      Alert.alert('Error', 'Please enter a name for your recording');
      return;
    }
    
    try {
      const newRecording = {
        name: newRecordingName.trim(),
        uri: tempRecordingUri,
        date: new Date()
      };
      
      const updatedRecordings = [newRecording, ...recordings];
      setRecordings(updatedRecordings);
      await saveRecordingsToStorage(updatedRecordings);
      
      setShowNameModal(false);
      setNewRecordingName('');
      setTempRecordingUri(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to save recording:', error);
      Alert.alert('Error', 'Could not save recording');
    }
  };

  const playRecording = async (uri) => {
    try {
      // Stop currently playing recording if any
      if (currentlyPlaying) {
        await currentlyPlaying.sound.stopAsync();
        setCurrentlyPlaying(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setCurrentlyPlaying({ uri, sound: newSound });
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });
    } catch (err) {
      console.error('Failed to play recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  const deleteRecording = async (uri) => {
    try {
      const updatedRecordings = recordings.filter(item => item.uri !== uri);
      setRecordings(updatedRecordings);
      await saveRecordingsToStorage(updatedRecordings);
      
      // If the deleted recording is currently playing, stop it
      if (currentlyPlaying?.uri === uri) {
        await currentlyPlaying.sound.stopAsync();
        setCurrentlyPlaying(null);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      Alert.alert('Error', 'Could not delete recording');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Timer Display */}
        <Text style={styles.timer}>
          {formatTime(recordingDuration)}
        </Text>

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={[styles.recordButton, isRecording && styles.recordingActive]}
          >
            <Ionicons 
              name="mic"
              size={40} 
              color={isRecording ? "#ff4444" : "#4A90E2"}
            />
          </TouchableOpacity>
          <Text style={styles.recordingStatus}>
            {isRecording ? "Recording..." : "Tap microphone to start recording"}
          </Text>
        </View>

        {/* Previous Recordings */}
        <View style={styles.previousRecordings}>
          <Text style={styles.sectionTitle}>Previous Recordings</Text>
          <ScrollView>
            {recordings.map((item, index) => (
              <View key={index} style={styles.recordingItem}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => playRecording(item.uri)}
                >
                  <Ionicons 
                    name={currentlyPlaying?.uri === item.uri ? "pause" : "play"} 
                    size={24} 
                    color="#4A90E2"
                  />
                </TouchableOpacity>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingName}>{item.name}</Text>
                  <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => deleteRecording(item.uri)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
            {recordings.length === 0 && (
              <Text style={styles.noRecordings}>No recordings yet</Text>
            )}
          </ScrollView>
        </View>

        {/* Name Recording Modal */}
        <Modal
          visible={showNameModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Name your recording</Text>
              <TextInput
                style={styles.input}
                value={newRecordingName}
                onChangeText={setNewRecordingName}
                placeholder="Enter recording name"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowNameModal(false);
                    setNewRecordingName('');
                    setTempRecordingUri(null);
                    setRecordingDuration(0);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveRecording}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    textAlign: 'center',
    color: '#4A90E2',
    marginBottom: 30,
    marginTop: 20,
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginBottom: 16,
  },
  recordingActive: {
    borderColor: '#ff4444',
    backgroundColor: '#fff1f1',
  },
  recordingStatus: {
    color: '#666',
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1db954',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});