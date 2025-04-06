import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import config from '../config';
import { useAuth } from "./context/AuthContext";
import { SafeAreaView } from 'react-native';
import { StyleSheet, View, Pressable, TextInput, Button, Text } from 'react-native';
import { ScrollView } from 'react-native';
import profile from '../assets/images/profile.png';
import { Image } from 'react-native';





export default function PatientProfile() {
  const { patientEmail } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  // Access the token from AuthContext - SURAJ
  const { authState } = useAuth();
  const token = authState.token;

  useEffect(() => {
    const fetchPatient = async () => {
      console.log("RUNNING");
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/search_patient/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`, // Include JWT token - SURAJ
          },
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

    console.log("patientEmail:", patientEmail);

    if (patientEmail) {
      fetchPatient();
    } else {
      console.log("No patient email provided");
    }
  }, [patientEmail, token]);

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={profile} style={styles.profileImage} />
          {patient ? (
            <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        {patient ? (
          <>
            <Text>Name: {patient.firstName} {patient.lastName}</Text>
            <Text>Email: {patient.email}</Text>
          </>
        ) : (
          <Text>Loading patient information...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  content: {
    flexGrow: 1,         // Instead of flex: 1
    alignItems: 'stretch', // Ensures children stretch fully
    width: '100%',
    padding: 20,
  },  
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center', // vertical alignment
    gap: 20,              // spacing between image and text (React Native 0.71+)
    marginBottom: 20,
  },
  patientName: {
    fontSize: 30,
    fontFamily: 'Figtree_400Regular',
    color: '#041575',
    paddingRight: 10
  }
  
});
