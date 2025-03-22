import React, { useState } from 'react';
import { StyleSheet, View, Pressable, TextInput, Button } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import config from "../config";
import { ScrollView } from 'react-native';


export default function ProviderDash() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);

  // Handle the search functionality
  const handleSearch = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/search_patient/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });
  
      console.log('Response Status:', response.status);
      const data = await response.json();
      console.log('Response Body:', data);
  
      if (response.ok) {
        if (data.patient) {
          setPatient(data.patient);
          setError(null);
        } else {
          setPatient(null);
          setError('Patient not found');
        }
      } else {
        setPatient(null);
        setError(data.error || 'An error occurred while searching');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while searching');
      setPatient(null);
    }
  };
  

  // Set the status bar style
  React.useEffect(() => {
    // You may need to implement status bar color changing here
    // depending on your navigation setup
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        headerBackgroundColor={{ light: '#87CEFA', dark: '#87CEFA' }}
        backgroundColor="#FFFFFF"
        style={{backgroundColor: '#FFFFFF'}}
        contentContainerStyle={styles.container}
      >
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="title" style={styles.mainTitle}>
            AcoustiCare
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Contributing to voice health research through patient participation
          </ThemedText>
        </ThemedView>

        {/* Patient Search Section */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Patient by Email"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Search" onPress={handleSearch} />
        </View>

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        {patient && (
          <View style={styles.patientInfo}>
            <ThemedText>Name: {patient.firstName + " " + patient.lastName}</ThemedText>
            <ThemedText>Email: {patient.email}</ThemedText>
            
            {/* Connect to Patient Button */}
            <Pressable style={styles.connectButton} onPress={() => console.log("Connecting to patient", patient.email)}>
              <ThemedText style={styles.buttonText}>Connect to Patient</ThemedText>
            </Pressable>
          </View>
        )}


        

        {/* Info sections */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Existing styles...
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  headerContainer: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  patientInfo: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 16,
    borderRadius: 8,
  },
  connectButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
});
