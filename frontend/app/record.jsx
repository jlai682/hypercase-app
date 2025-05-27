import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Alert,
    SafeAreaView,
    Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from "../app/context/AuthContext";
import RecordButton from '../components/recordButton';
import NameRecordingModal from '../components/NameRecordingModal';
import { useLocalSearchParams } from 'expo-router';


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
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [tempRecordingUri, setTempRecordingUri] = useState(null);
    const [showNameModal, setShowNameModal] = useState(false);
    const [newRecordingName, setNewRecordingName] = useState('');
    // Web-specific state
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audioStream, setAudioStream] = useState(null);


    const { patient, request } = useLocalSearchParams();

    console.log("request: ", request);


    // Access the token from AuthContext
    const { authState } = useAuth();
    const token = authState?.token;

    // Check if JWT is expired
    const isTokenExpired = (token) => {
        if (!token || !isValidJWT(token)) {
            return true;
        }

        try {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return exp < currentTime;
        } catch (error) {
            console.error("Error parsing token:", error);
            return true;
        }
    };

    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log(payload);


    // Check if token has a valid JWT format
    const isValidJWT = (token) => {
        if (typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
    };

    useEffect(() => {
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
    
            // Cleanup sound playback - use unloadAsync for both platforms
            if (currentlyPlaying?.sound) {
                try {
                    currentlyPlaying.sound.unloadAsync();
                } catch (error) {
                    console.log('Error unloading sound:', error);
                }
            }
        };
    }, [isRecording, currentlyPlaying, audioStream, mediaRecorder, recording]);

    //   const loadRecordings = async () => {
    //     try {
    //       const storedRecordings = await storage.getItem(STORAGE_KEY);
    //       if (storedRecordings) {
    //         // Parse stored recordings and convert date strings back to Date objects
    //         const parsedRecordings = JSON.parse(storedRecordings).map(item => ({
    //           ...item,
    //           date: new Date(item.date)
    //         }));
    //         setRecordings(parsedRecordings);
    //       }
    //     } catch (error) {
    //       console.error('Failed to load recordings:', error);
    //     }
    //   };

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
                    },
                    // Add unloadAsync for compatibility with cleanup code
                    unloadAsync: () => {
                        newSound.pause();
                        newSound.currentTime = 0;
                        newSound.src = ''; // Clear the source
                        return Promise.resolve();
                    }
                };
    
                // Set up ended event
                newSound.onended = () => {
                    setCurrentlyPlaying(null);
                };
    
                // Set up error event
                newSound.onerror = (error) => {
                    console.error('Audio playback error:', error);
                    setCurrentlyPlaying(null);
                    Alert.alert('Error', 'Could not play recording');
                };
    
                // Start playing
                await newSound.play();
    
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

    // const deleteRecording = async (uri) => {
    //     try {
    //         // Find the recording to check if it has a server ID
    //         const recordingToDelete = recordings.find(item => item.uri === uri);

    //         // If the recording has a server ID and token is valid, also delete from server (optional)
    //         if (recordingToDelete?.serverId && token && !isTokenExpired(token)) {
    //             try {
    //                 // Add server deletion logic here if your API supports it
    //                 // const deleteURL = `${API_URL}/${recordingToDelete.serverId}/`;
    //                 // await fetch(deleteURL, {
    //                 //   method: 'DELETE',
    //                 //   headers: {
    //                 //     'Authorization': `Bearer ${token}`
    //                 //   }
    //                 // });
    //             } catch (serverError) {
    //                 console.error('Failed to delete from server:', serverError);
    //                 // Continue with local deletion even if server deletion fails
    //             }
    //         }

    //         // If on web and the recording is stored as a blob URL, revoke it
    //         if (Platform.OS === 'web' && recordingToDelete?.isBlob) {
    //             try {
    //                 URL.revokeObjectURL(uri);
    //             } catch (error) {
    //                 console.error('Error revoking object URL:', error);
    //             }
    //         }

    //         const updatedRecordings = recordings.filter(item => item.uri !== uri);
    //         setRecordings(updatedRecordings);
    //         await saveRecordingsToStorage(updatedRecordings);

    //         // If the deleted recording is currently playing, stop it
    //         if (currentlyPlaying?.uri === uri) {
    //             await currentlyPlaying.sound.stopAsync();
    //             setCurrentlyPlaying(null);
    //         }
    //     } catch (error) {
    //         console.error('Failed to delete recording:', error);
    //         Alert.alert('Error', 'Could not delete recording');
    //     }
    //};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainContent}>
                {/* Timer Display */}
                <Text style={styles.timer}>
                    {formatTime(recordingDuration)}
                </Text>

                {/* Record Button */}
                <RecordButton
                    isRecording={isRecording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                />
 
                {/* Name Recording Modal */}
                <NameRecordingModal
                    showNameModal={showNameModal}
                    setShowNameModal={setShowNameModal}
                    tempRecordingUri={tempRecordingUri}
                    setTempRecordingUri={setTempRecordingUri}
                    setRecordingDuration={setRecordingDuration}
                    newRecordingName={newRecordingName}
                    setNewRecordingName={setNewRecordingName}
                    isTokenExpired={isTokenExpired}
                    patient={patient}
                    request = {request}
                />
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    timer: {
        fontSize: 60,
        fontWeight: '300',
        textAlign: 'center',
        color: '#4A90E2',
        marginBottom: 30,
        marginTop: 20,
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
});