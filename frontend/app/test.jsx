import React, { useState } from 'react';
import { StyleSheet, View, Pressable, TextInput, Button } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import config from "../config";


const FeatureCard = ({ iconName, title, description, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    styles.card,
    pressed && styles.cardPressed
  ]}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={iconName} size={32} color="#87CEFA" />
    </View>
    <View style={styles.cardContent}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardDescription}>{description}</ThemedText>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#87CEFA" />
  </Pressable>
);

export default function HomeScreen() {
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
      <ParallaxScrollView
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
            {/* Add more patient info as needed */}
          </View>
        )}

        

        {/* Info sections */}
      </ParallaxScrollView>
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
});
