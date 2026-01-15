import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from "expo-router";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/components/auth/AuthContext";
import config from '@/config';

import { NameRecordingModalProps } from '@/types/components';

interface UploadResponse {
  id: number;
}

const NameRecordingModal: React.FC<NameRecordingModalProps> = ({
  visible,
  recordingUri,
  patient,
  request,
  onSave,
  onCancel
}) => {
  const { authState, isTokenExpired } = useAuth();
  const token = authState?.token;
  const [recordingName, setRecordingName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const API_URL = `${config.BACKEND_URL}/api/recordings/upload/`;

  // Function to upload recording to Django backend with JWT
  const uploadRecordingToServer = async (uri: string | Blob, name: string): Promise<number | null> => {
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
        const formData = new FormData();

        let fileBlob: Blob;
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
        formData.append('file', fileBlob, `${name}.wav`);
        formData.append('title', name);
        formData.append('description', `Recorded on ${new Date().toLocaleString()}`);

        // Handle patient ID for web upload
        if (patient?.id) {
          formData.append('patient_id', patient.id.toString());
          console.log('Adding patient ID to web recording:', patient.id);
        } else {
          console.warn('WARNING: No patient ID - upload will fail!');
        }

        console.log('Uploading web recording with token:', token.substring(0, 10) + '...');

        // Send the request with JWT token
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
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

        const responseData: UploadResponse = await response.json();
        console.log('Upload success, received ID:', responseData.id);
        return responseData.id;
      } else {
        // Native implementation
        try {
          const formData = new FormData();

          const uriStr = uri as string;
          // Get file extension
          const fileExtension = uriStr.split('.').pop();
          console.log('File extension:', fileExtension);

          // Add file to form data
          formData.append('file', {
            uri: Platform.OS === 'ios' ? uriStr.replace('file://', '') : uriStr,
            name: `${name}.${fileExtension}`,
            type: `audio/${fileExtension === 'mp4' ? 'm4a' : fileExtension}`
          } as any);

          // Add metadata
          formData.append('title', name);
          formData.append('description', `Recorded on ${new Date().toLocaleString()}`);

          // Handle patient ID
          if (patient?.id) {
            formData.append('patient_id', patient.id.toString());
            console.log('Native - Adding patient ID to recording:', patient.id);
          } else {
            console.warn('WARNING: No patient ID - upload will fail!');
          }

          console.log('Uploading native recording with token:', token.substring(0, 10) + '...');

          // Upload to server with JWT token
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
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
            } catch {
              // If the response isn't valid JSON, use the raw text
              errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
          }

          const responseData: UploadResponse = await response.json();
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
      if (error instanceof Error && error.message && error.message.includes('Unauthorized')) {
        Alert.alert('Authentication Error', error.message);
      } else {
        Alert.alert('Upload Failed', (error as Error).message || 'Could not upload recording to server');
      }

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!recordingUri || !recordingName.trim()) {
      Alert.alert('Error', 'Please enter a name for your recording');
      return;
    }

    try {
      // First upload to server with JWT
      const serverId = await uploadRecordingToServer(recordingUri, recordingName.trim());

      if (serverId) {
        // Handle request completion if we have a request
        if (request?.id) {
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
                request_id: request.id,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Error completing request:', errorText);
              Alert.alert('Failed to complete request', 'The recording was uploaded but the request could not be marked as complete.');
            } else {
              console.log('Request marked as completed!');
              // Invalidate the recording-requests cache so the UI updates
              queryClient.invalidateQueries({ queryKey: ['recording-requests'] });
              Alert.alert('Success', 'Recording uploaded and request completed.');
            }
          } catch (error) {
            console.error('Error in complete-request:', error);
            Alert.alert('Error', 'Could not complete the recording request.');
          }
        } else {
          // If no request but upload succeeded
          Alert.alert('Success', 'Recording uploaded successfully.');
        }

        // Reset form and call parent's onSave callback
        setRecordingName('');
        await onSave(recordingName.trim());

        // Navigate to recordings page
        router.push('/(patient)/recordings');
      }
    } catch (error) {
      console.error('Failed to save recording:', error);
      Alert.alert('Error', 'Could not save recording');
    }
  };

  const handleCancel = (): void => {
    setRecordingName('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Name your recording</Text>
          <TextInput
            style={styles.input}
            value={recordingName}
            onChangeText={setRecordingName}
            placeholder="Enter recording name"
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    borderColor: 'blue',
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
    backgroundColor: '#041575',
  },
  cancelButton: {
    color: 'black',
    backgroundColor: '#cae7ff',
  },
  cancelButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NameRecordingModal;
