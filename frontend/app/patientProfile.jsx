import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import config from '../config';

export default function PatientProfile() {
  const { patientEmail } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/search_patient/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: patientEmail }),
        });

        const data = await response.json();
        if (response.ok) {
          setPatient(data.patient);
        } else {
          setError(data.error || 'Patient not found');
        }
      } catch (error) {
        setError('An error occurred while fetching patient data');
      }
    };

    if (patientEmail) fetchPatient();
  }, [patientEmail]);

  return (
    <View>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : 
        patient && (
          <>
            <Text>Name: {patient.firstName} {patient.lastName}</Text>
            <Text>Email: {patient.email}</Text>
          </>
        )
      }
    </View>
  );
}
