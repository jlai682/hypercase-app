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
    ActivityIndicator,
    FlatList,
    Button,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useAuth } from "../app/context/AuthContext";
import RecordButton from '../components/recordButton';
import config from '../config';
import { useRouter, useLocalSearchParams } from "expo-router";



const NameRecordingModal = ({ showNameModal, setShowNameModal, setRecordingDuration, newRecordingName, setNewRecordingName, isTokenExpired, patient, tempRecordingUri, setTempRecordingUri, request}) => {

    const { authState } = useAuth();
    const token = authState?.token;
    const [isUploading, setIsUploading] = useState(false);

    const router = useRouter();


    const API_URL = `${config.BACKEND_URL}/api/recordings/upload/`;

    console.log("patient:", patient);
    console.log("request raw:", request);

    // Safely parse the request
    let requestObject = null;
    try {
        if (request) {
            requestObject = JSON.parse(request);
            console.log("request parsed:", requestObject);
        }
    } catch (error) {
        console.error("Error parsing request:", error);
    }

    

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
                
                // Handle patient ID for web upload
                try {
                    let patientId = null;
                    if (typeof patient === 'string') {
                        try {
                            // Try to parse if it's a JSON string
                            const parsedPatient = JSON.parse(patient);
                            patientId = parsedPatient.id;
                        } catch (e) {
                            // If not a JSON object, might be a direct ID
                            patientId = patient;
                        }
                    } else if (typeof patient === 'object' && patient !== null) {
                        // If it's already an object
                        patientId = patient.id;
                    } else {
                        // If patient is the ID directly
                        patientId = patient;
                    }

                    if (patientId) {
                        formData.append('patient_id', patientId);
                        console.log('Adding patient ID to web recording:', patientId);
                    } else {
                        console.log('No valid patient ID found for web upload');
                    }
                } catch (error) {
                    console.log('Error processing patient ID for web upload:', error);
                }

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

                    try {
                        // Handle patient ID - safely parse if needed
                        let patientId = null;
                        if (typeof patient === 'string') {
                            try {
                                // Try to parse if it's a JSON string
                                const parsedPatient = JSON.parse(patient);
                                patientId = parsedPatient.id;
                            } catch (e) {
                                // If not a JSON object, might be a direct ID
                                patientId = patient;
                            }
                        } else if (typeof patient === 'object' && patient !== null) {
                            // If it's already an object
                            patientId = patient.id;
                        } else {
                            // If patient is the ID directly
                            patientId = patient;
                        }

                        if (patientId) {
                            formData.append('patient_id', patientId);
                            console.log('Adding patient ID to recording:', patientId);
                        } else {
                            console.log('No valid patient ID found');
                        }
                    } catch (error) {
                        console.log('Error processing patient ID:', error);
                    }

                    console.log('Uploading native recording with token:', token.substring(0, 10) + '...');

                    // Upload to server with JWT token
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`  // Include JWT token
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

            // // Then save locally with server reference
            // const newRecording = {
            //     name: newRecordingName.trim(),
            //     uri: uriForStorage,
            //     serverId: serverId, // Store the server ID reference
            //     date: new Date(),
            //     uploaded: !!serverId, // Track upload status
            //     isBlob: Platform.OS === 'web' && tempRecordingUri instanceof Blob
            // };

            // const updatedRecordings = [newRecording, ...recordings];
            // setRecordings(updatedRecordings);
            // await saveRecordingsToStorage(updatedRecordings);

            setShowNameModal(false);
            setNewRecordingName('');
            setTempRecordingUri(null);
            setRecordingDuration(0);


            // Handle request completion if we have a server ID and valid request object
            if (serverId) {
                if (requestObject && requestObject.id) {
                    console.log("Completing recording request");
                    const completeRequestUrl = `${config.BACKEND_URL}/api/recordings/${serverId}/complete-request/`;
                
                    try {
                        const response = await fetch(completeRequestUrl, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                request_id: requestObject.id,
                            }),
                        });
                
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Error completing request:', errorText);
                            Alert.alert('Failed to complete request', 'The recording was uploaded but the request could not be marked as complete.');
                        } else {
                            console.log('Request marked as completed!');
                            Alert.alert('Success', 'Recording uploaded and request completed.');
                            router.push('/recordings');
                        }
                    } catch (error) {
                        console.error('Error in complete-request:', error);
                        Alert.alert('Error', 'Could not complete the recording request.');
                    }
                } else {
                    // If no request object but upload succeeded
                    console.log('Recording uploaded successfully');
                    Alert.alert('Success', 'Recording uploaded successfully.');
                    router.push('/recordings');
                }
            }
            
        } catch (error) {
            console.error('Failed to save recording:', error);
            Alert.alert('Error', 'Could not save recording');
        }
    };




    return (
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
                                <Text style={styles.buttonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </Modal>
    )

}

const styles = StyleSheet.create({
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
})

export default NameRecordingModal;