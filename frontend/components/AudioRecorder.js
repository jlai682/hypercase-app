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
  Platform,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useAuth } from "../app/context/AuthContext";

// Backend API URL - Update this with your Django server address
import config from '../config';
const API_URL = `${config.BACKEND_URL}/api/recordings/upload/`;  

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
  const [isUploading, setIsUploading] = useState(false);
  // Web-specific state
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioStream, setAudioStream] = useState(null);
  
  // Access the token from AuthContext
  const { authState } = useAuth();
  const token = authState?.token;

  // Check if JWT is expired
  const isTokenExpired = (token) => {
    if (!token || !isValidJWT(token)) {
      return true;
    }

    try {
      const {exp} = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return exp < currentTime;
    } catch (error) {
      console.error("Error parsing token:", error);
      return true;
    }
  };

  // Check if token has a valid JWT format
  const isValidJWT = (token) => {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
  };

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
          try {
            recording.stopAndUnloadAsync();
          } catch (error) {
            console.log('Error cleaning up recording:', error);
          }
        }
      }
      
      // Cleanup sound playback
      if (sound) {
        try {
          sound.unloadAsync();
        } catch (error) {
          console.log('Error unloading sound:', error);
        }
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
      if (Platform.OS === 'web') {
        // Web implementation using MediaRecorder API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);
          
          const recorder = new MediaRecorder(stream);
          const chunks = [];
          
          recorder.ondataavailable = (e) => {
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

  const stopRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        if (!mediaRecorder) return;
        
        // Create a promise that resolves when the recording is stopped
        const stopPromise = new Promise(resolve => {
          mediaRecorder.onstop = () => {
            // Create a blob from the chunks
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
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

  // Function to upload recording to Django backend with JWT
  const uploadRecordingToServer = async (uri, name) => {
    if (!uri) return null;
    
    // Check token validity
    if (!token) {
      console.error("No token found, authentication required.");
      Alert.alert('Authentication Required', 'Please log in to upload recordings.');
      return null;
    }
    
    if (isTokenExpired(token)) {
      console.error("Token is expired");
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
      return null;
    }
    
    setIsUploading(true);
    console.log('Starting upload to server:', API_URL);
    
    try {
      // Web-specific implementation
      if (Platform.OS === 'web') {
        // For web, the uri might be a blob
        const formData = new FormData();
        
        let fileBlob;
        if (uri instanceof Blob) {
          fileBlob = uri;
        } else {
          // If it's a URL, fetch it as a blob
          try {
            const response = await fetch(uri);
            fileBlob = await response.blob();
          } catch (error) {
            console.error("Error converting URI to blob:", error);
            throw new Error("Could not process audio file");
          }
        }
        
        // Append the file to form data with a proper filename
        formData.append('file', fileBlob, `${name}.webm`);
        formData.append('title', name);
        formData.append('description', `Recorded on ${new Date().toLocaleString()}`);
        
        console.log('Uploading web recording with token:', token.substring(0, 10) + '...');
        
        // Send the request with JWT token
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`  // Include JWT token
          },
          body: formData,
        });
        
        console.log('Upload response status:', response.status);
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Session expired. Please log in again.');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          const errorData = JSON.parse(errorText || '{}');
          throw new Error(errorData.error || 'Failed to upload recording');
        }
        
        const responseData = await response.json();
        console.log('Upload success, received ID:', responseData.id);
        return responseData.id;
      } 
      else {
        // Native implementation
        try {
          // Get file info - wrapped in try/catch to handle potential errors
          const fileInfo = await FileSystem.getInfoAsync(uri);
          console.log('File info:', fileInfo);
          
          // Create form data for multipart/form-data request
          const formData = new FormData();
          
          // Get file extension
          const fileExtension = uri.split('.').pop();
          console.log('File extension:', fileExtension);
          
          // Add file to form data
          formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: `${name}.${fileExtension}`,
            type: `audio/${fileExtension === 'mp4' ? 'm4a' : fileExtension}`
          });
          
          // Add metadata
          formData.append('title', name);
          formData.append('description', `Recorded on ${new Date().toLocaleString()}`);
          
          // Try to get patient ID from AsyncStorage
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const patientId = await AsyncStorage.getItem('patientId');
            
            if (patientId) {
              formData.append('patient_id', patientId);
              console.log('Adding patient ID to recording:', patientId);
            } else {
              console.log('No patient ID found in AsyncStorage');
            }
          } catch (error) {
            console.log('AsyncStorage not available or patient ID not found:', error);
          }
          
          console.log('Uploading native recording with token:', token.substring(0, 10) + '...');
          
          // Upload to server with JWT token
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`  // Include JWT token
              // Note: Do NOT set Content-Type for multipart/form-data - the boundary will be set automatically
            },
            body: formData
          });
          
          console.log('Upload response status:', response.status);
          
          if (response.status === 401) {
            throw new Error('Unauthorized: Session expired. Please log in again.');
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            let errorMessage = 'Failed to upload recording';
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // If the response isn't valid JSON, use the raw text
              errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
          }
          
          const responseData = await response.json();
          console.log('Upload success, received data:', responseData);
          return responseData.id;
        } catch (error) {
          console.error('Native upload error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle authentication errors separately
      if (error.message && error.message.includes('Unauthorized')) {
        Alert.alert('Authentication Error', error.message);
      } else {
        Alert.alert('Upload Failed', error.message || 'Could not upload recording to server');
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const saveRecording = async () => {
    if (!tempRecordingUri || !newRecordingName.trim()) {
      Alert.alert('Error', 'Please enter a name for your recording');
      return;
    }
    
    try {
      // First upload to server with JWT
      const serverId = await uploadRecordingToServer(tempRecordingUri, newRecordingName.trim());
      
      // Create a URI for storage in the recordings list
      let uriForStorage;
      if (Platform.OS === 'web' && tempRecordingUri instanceof Blob) {
        // For web blobs, create a persistent URL
        uriForStorage = URL.createObjectURL(tempRecordingUri);
      } else {
        uriForStorage = tempRecordingUri;
      }
      
      // Then save locally with server reference
      const newRecording = {
        name: newRecordingName.trim(),
        uri: uriForStorage,
        serverId: serverId, // Store the server ID reference
        date: new Date(),
        uploaded: !!serverId, // Track upload status
        isBlob: Platform.OS === 'web' && tempRecordingUri instanceof Blob
      };
      
      const updatedRecordings = [newRecording, ...recordings];
      setRecordings(updatedRecordings);
      await saveRecordingsToStorage(updatedRecordings);
      
      setShowNameModal(false);
      setNewRecordingName('');
      setTempRecordingUri(null);
      setRecordingDuration(0);
      
      if (serverId) {
        Alert.alert('Success', 'Recording saved and uploaded to server');
      } else {
        Alert.alert('Partially Saved', 'Recording saved locally but failed to upload to server');
      }
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

      if (Platform.OS === 'web') {
        // Web implementation
        let audioUrl = uri;
        
        // Create a new HTML5 Audio element
        const newSound = new Audio(audioUrl);
        
        // Create a wrapper object with compatible interface for our state
        const soundWrapper = {
          stopAsync: () => {
            newSound.pause();
            newSound.currentTime = 0;
            return Promise.resolve();
          }
        };
        
        // Set up ended event
        newSound.onended = () => {
          setCurrentlyPlaying(null);
        };
        
        // Start playing
        newSound.play();
        
        setCurrentlyPlaying({ uri, sound: soundWrapper });
      } else {
        // Native implementation using Expo AV
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
      }
    } catch (err) {
      console.error('Failed to play recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  const deleteRecording = async (uri) => {
    try {
      // Find the recording to check if it has a server ID
      const recordingToDelete = recordings.find(item => item.uri === uri);
      
      // If the recording has a server ID and token is valid, also delete from server (optional)
      if (recordingToDelete?.serverId && token && !isTokenExpired(token)) {
        try {
          // Add server deletion logic here if your API supports it
          // const deleteURL = `${API_URL}/${recordingToDelete.serverId}/`;
          // await fetch(deleteURL, {
          //   method: 'DELETE',
          //   headers: {
          //     'Authorization': `Bearer ${token}`
          //   }
          // });
        } catch (serverError) {
          console.error('Failed to delete from server:', serverError);
          // Continue with local deletion even if server deletion fails
        }
      }
      
      // If on web and the recording is stored as a blob URL, revoke it
      if (Platform.OS === 'web' && recordingToDelete?.isBlob) {
        try {
          URL.revokeObjectURL(uri);
        } catch (error) {
          console.error('Error revoking object URL:', error);
        }
      }
      
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
            disabled={isUploading}
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
                  <Text style={styles.recordingName}>
                    {item.name}
                    {item.uploaded && (
                      <Text style={styles.uploadedTag}> (uploaded)</Text>
                    )}
                  </Text>
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
                  disabled={isUploading}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveRecording}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Save & Upload</Text>
                  )}
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