import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';

import { useAuth } from '@/components/auth/AuthContext';
import RecordingRequests from '@/components/patient/RecordingRequests';
import PreviousRecordings from '@/components/patient/PreviousRecordings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Patient, RecordingRequest } from '@/types';
import config from '@/config';


function RecordScreen(): React.JSX.Element {

    const { authState } = useAuth();
    const token = authState?.token;

    const [recordingRequests, setRecordingRequests] = useState<RecordingRequest[] | null>(null);
    const [sentRecordings, setSentRecordings] = useState<RecordingRequest[]>([]);
    const [patientProfile, setPatientProfile] = useState<Patient | null>(null);

    const { patient: patientParam } = useLocalSearchParams();

    useEffect(() => {
        const fetchPatientProfile = async (): Promise<void> => {
            if (patientParam || !token) return; // Skip if patient already provided or no token

            try {
                const response = await fetch(`${config.BACKEND_URL}/api/patientManagement/profile/`, {
                    method: 'GET',
                    headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    },
                });

                // If 403, this user is not a patient (likely a provider), silently skip
                if (response.status === 403) {
                    return;
                }

                if (response.ok) {
                    const data: Patient = await response.json();
                    console.log("Fetched patient profile:", data);
                    setPatientProfile(data);
                } else {
                    console.error('Failed to fetch patient profile');
                }
            } catch (error) {
                console.error('Error fetching patient profile:', error);
            }
        };

        fetchPatientProfile();
    }, [token, patientParam]);

    useFocusEffect(
        useCallback(() => {
            const fetchRecordingInfo = async (): Promise<void> => {
                try {
                    const recordingResponse = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/my-requests/`, {
                        method: 'GET',
                        headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        },
                    })

                    // If 403, this user is not a patient (likely a provider), silently skip
                    if (recordingResponse.status === 403) {
                        return;
                    }

                    if (!recordingResponse.ok) {
                        throw new Error('Failed to fetch recording requests');
                    }

                    const recordingData: RecordingRequest[] = await recordingResponse.json();
                    setRecordingRequests(recordingData);
                    console.log("Recording Requests received: ", recordingData);
                } catch (error) {
                    console.error('Error fetching recordings:', error);
                }
            };

            if (token) {
                fetchRecordingInfo();
            } else {
                console.log("no token found");
            }
        }, [token])
    );

    useEffect(() => {
        if (!recordingRequests) return;

        const sent = recordingRequests.filter((req: RecordingRequest) => req.status === 'sent');

        setSentRecordings(sent);
    }, [recordingRequests]);

    const patientForComponents: Patient = patientProfile;

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
            </View>
            <RecordingRequests
                sentRequests={JSON.stringify(sentRecordings)}
                patient={JSON.stringify(patientForComponents)}
            />
            <PreviousRecordings patient={JSON.stringify(patientForComponents)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
    color: '#1F2937',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 4px 10px 0px rgba(0, 0, 0, 0.08)',
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    maxWidth: 300,
    boxShadow: '0px 3px 4px 0px rgba(37, 99, 235, 0.2)',
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default function RecordingsList(): React.JSX.Element {
    return (
        <ProtectedRoute>
            <RecordScreen />
        </ProtectedRoute>
    );
}