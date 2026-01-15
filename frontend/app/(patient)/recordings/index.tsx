import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RecordingRequests from '@/components/patient/RecordingRequests';
import PreviousRecordings from '@/components/patient/PreviousRecordings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile, useRecordingRequests } from '@/hooks/queries';


function RecordScreen(): React.JSX.Element {
    // React Query hooks
    const { data: patient } = usePatientProfile();
    const { data: recordingRequests = [] } = useRecordingRequests();

    // Filter sent recordings
    const sentRecordings = useMemo(() =>
        recordingRequests.filter((req) => req.status === 'sent'),
        [recordingRequests]
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
            </View>
            <RecordingRequests
                sentRequests={JSON.stringify(sentRecordings)}
                patient={JSON.stringify(patient)}
            />
            <PreviousRecordings patient={JSON.stringify(patient)} />
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