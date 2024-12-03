import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Modal,
  TextInput
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const RECORDINGS_DIRECTORY = FileSystem.documentDirectory + 'recordings/';

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newRecordingName, setNewRecordingName] = useState('');
  const [tempRecordingUri, setTempRecordingUri] = useState(null);

  useEffect(() => {
    setupRecordingDirectory();
    loadRecordings();
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [isRecording]);

  const setupRecordingDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
    }
  };

  const loadRecordings = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIRECTORY);
      const recordingsInfo = await Promise.all(
        files.map(async (fileName) => {
          const fileInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY + fileName);
          return {
            name: fileName.replace('.m4a', ''),
            uri: fileInfo.uri,
            date: new Date(fileInfo.modificationTime * 1000) // Convert to JS date
          };
        })
      );
      setRecordings(recordingsInfo.sort((a, b) => b.date - a.date));
    } catch (error) {
      Alert.alert('Error', 'Failed to load recordings');
    }
  };

  const getPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissions required', 'Audio recording permissions are required to use this app.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to get recording permissions');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const startRecording = async () => {
    try {
      await getPermissions();
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
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setTempRecordingUri(uri);
      setShowNameModal(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };
  /*
  const saveRecording = async () => {
    if (!tempRecordingUri || !newRecordingName) return;
    
    const fileName = `${newRecordingName}.m4a`;
    const newUri = RECORDINGS_DIRECTORY + fileName;
    
    try {
      await FileSystem.moveAsync({
        from: tempRecordingUri,
        to: newUri
      });
      
      setShowNameModal(false);
      setNewRecordingName('');
      setTempRecordingUri(null);
      loadRecordings();
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording');
    }
  };
  */
  const API_URL = 'http://your-ip:8000/api/';

  const uploadRecording = async (uri, name, duration) => {
    try {
      console.log('Upload URL:', `${API_URL}recordings/`);
      console.log('File URI:', uri);
      console.log('Recording Name:', name);
      console.log('Duration:', duration);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('duration', Math.floor(duration));
      formData.append('audio_file', {
        uri: uri,
        type: 'audio/m4a',
        name: `${name}.m4a`
      });
      console.log('FormData contents:', {
        name: name,
        duration: Math.floor(duration),
        uri: uri
      });
      const response = await fetch(`${API_URL}recordings/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const responseData = await response.text(); // Get response body for debugging
      console.log('Server Response:', responseData);
  
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${responseData}`);
      }
      Alert.alert('Success', 'Recording uploaded successfully');
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', `Failed to upload recording: ${error.message}`);
    }
  };

  // Modify your saveRecording function to include the upload:
  const saveRecording = async () => {
    if (!tempRecordingUri || !newRecordingName) return;
    
    const fileName = `${newRecordingName}.m4a`;
    const newUri = RECORDINGS_DIRECTORY + fileName;
    
    try {
      await FileSystem.moveAsync({
        from: tempRecordingUri,
        to: newUri
      });
      // Upload to server
      await uploadRecording(newUri, newRecordingName, recordingDuration);
      setShowNameModal(false);
      setNewRecordingName('');
      setTempRecordingUri(null);
      loadRecordings();
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording');
    }
  };



  const playRecording = async (uri) => {
    try {
      if (currentlyPlaying) {
        await currentlyPlaying.sound.stopAsync();
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
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const deleteRecording = async (uri, name) => {
    try {
      await FileSystem.deleteAsync(uri);
      loadRecordings();
      Alert.alert('Success', `Deleted recording: ${name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete recording');
    }
  };

  return (
    <View style={styles.container}>
      {/* Recording Card */}
      <View style={styles.card}>
        <Text style={styles.title}>New Recording</Text>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(recordingDuration)}</Text>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={[
              styles.button,
              isRecording ? styles.buttonRed : styles.buttonBlue
            ]}
          >
            <Ionicons 
              name={isRecording ? "square" : "mic"} 
              size={32} 
              color={isRecording ? "#ff4444" : "#1db954"}
            />
          </TouchableOpacity>
        </View>

        {!isRecording && (
          <View style={styles.statusContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="#666" />
            <Text style={styles.statusText}>Tap microphone to start recording</Text>
          </View>
        )}
      </View>

      {/* Recordings List */}
      <View style={[styles.card, styles.listCard]}>
        <Text style={styles.title}>Recordings</Text>
        <ScrollView style={styles.recordingsList}>
          {recordings.map((item, index) => (
            <View key={index} style={styles.recordingItem}>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingName}>{item.name}</Text>
                <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.recordingActions}>
                <TouchableOpacity 
                  onPress={() => playRecording(item.uri)}
                  style={styles.actionButton}
                >
                  <Ionicons 
                    name={currentlyPlaying?.uri === item.uri ? "stop-circle" : "play-circle"} 
                    size={24} 
                    color="#1db954"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteRecording(item.uri, item.name)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  listCard: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timer: {
    fontSize: 48,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    backgroundColor: '#ff4444',
    borderRadius: 6,
    marginRight: 8,
  },
  recordingText: {
    color: '#ff4444',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBlue: {
    backgroundColor: '#e6f3ff',
  },
  buttonRed: {
    backgroundColor: '#ffe6e6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  statusText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
  },
  recordingsList: {
    flex: 1,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordingDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  noRecordings: {
    textAlign: 'center',
    color: '#666',
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