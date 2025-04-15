import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, TextInput, Button } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import config from "../config";
import { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "./context/AuthContext";

import { SafeAreaView } from 'react-native';

import { useRouter, useLocalSearchParams } from "expo-router";



export default function ProviderDash() {
  const router = useRouter();

  //State for email search input
  const [email, setEmail] = useState('');

  // holds a single patient search result
  const [patient, setPatient] = useState(null);

  // Error messages
  const [error, setError] = useState(null);

  //list of patients associated with this provider
  const [patients, setPatients] = useState([]);

  // Provider's name
  const [providerFirstName, setProviderFirstName] = useState('');
  const [providerLastName, setProviderLastName] = useState('');

  // Access the token from AuthContext - SURAJ
  const { authState } = useAuth();
  const token = authState.token;

  const { onLogout } = useAuth();

  // Check if JWT is expired
  const isTokenExpired = (token) => {
    if (!token || !isValidJWT(token)) {
      return true
    };  // Return true if token is invalid
    if (!token) return true;

    const { exp } = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    return exp < currentTime;
  }



  // Check if token has a valid JWT format
  const isValidJWT = (token) => {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
  };


  // Handle the search functionality for searching for a patient by email
  const handleSearch = async () => {
    if (!isValidJWT(token)) {
      console.log("bad token")
    }
    else {
      console.log("token is valid")
    }
    if (isTokenExpired(token)) {
      console.error("Token is expired");
      console.log("LSDKFJLDSKFJLSD")
      return;
    }
    else {
      console.log("token is not expired")
    }
    try {
      if (!token) {
        console.error("No token found, authentication required.");
        return;
      }

      const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/search_patient/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`  // Include JWT token - SURAJ
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

  // Fetch provider's list of connected patients on component mount
  useEffect(() => {
    fetchProviderPatients();
    fetchProviderInfo();
  }, [token]);

  // Connect to a patient returned by the search
  const handleConnect = async () => {
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/connect/`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`  // Include JWT token - SURAJ
        },
        body: JSON.stringify({ patient_email: patient.email })
      });

      const data = await response.json();
      console.log('Connection Response:', data);

      if (response.ok) {
        alert(data.message);
      } else {
        alert(data.error || 'Failed to connect');
      }
      fetchProviderPatients();
    } catch (error) {
      console.error('Error connecting to patient:', error);
      alert('An error occurred while connection.');
    }
  }

  // Fetch all patients associated with the current provider 
  const fetchProviderPatients = async () => {
    if (!isValidJWT(token)) {
      console.log("bad token")
      return;
    }
    else {
      console.log("token is valid")
    }
    if (isTokenExpired(token)) {
      console.log("Token is expired");
      return;
    }
    else {
      console.log("token is not expired")
    }
    try {
      if (!token) {
        console.error("No token found, authentication required.");
        return;
      }

      console.log("tokkkkken: ", token);

      const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/myPatients/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`  // Include JWT token - SURAJ
        }
      });

      if (response.status === 401) {
        console.error("Unauthorized: Token might be invalid or expired.");
        alert("Session expired. Please log in again.");
        // Optionally, you can redirect the user to the login page or clear the stored token
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setPatients(data.patients || []);
      } else {
        console.error("Error fetching patients:", data.error);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  //Fetch the provider's personal information 
  const fetchProviderInfo = async () => {
    if (!token) {
      console.log("No token found, authentication required.");
      return;
    }
    if (isTokenExpired(token)) {
      console.log("token is expired");
      return;
    }

    try {
      const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/providerInfo/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // Include JWT token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProviderFirstName(data.provider.firstName);
        setProviderLastName(data.provider.lastName);
      } else {
        console.error("Failed to fetch provider info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching provider info:", error);
    }
  };




  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content} >

        <ThemedText style={styles.title}>Welcome back, </ThemedText>
        <ThemedText style={styles.doctorName}>Doctor {providerLastName}</ThemedText>

        <View style={styles.horizontalLine} />


        <ThemedText style={styles.sectionTitle}>Your Patients</ThemedText>
        {patients.length > 0 ? (
          patients.map((p, index) => (
            <Pressable key={index} style={styles.patientInfo} onPress={() => router.push({ pathname: '/patientProfile', params: { patientEmail: p.patient.email } })}>
              <ThemedText>{p.patient.firstName} {p.patient.lastName}</ThemedText>
              <ThemedText>{p.patient.email}</ThemedText>
            </Pressable>
          ))
        ) : (
          <ThemedText>No patients found</ThemedText>
        )}

        <View style={styles.horizontalLine} />

        {/* Patient Search Section */}
        <View style={styles.searchContainer}>
          <ThemedText style={styles.sectionTitle}>Search for Patients</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Patient by Email"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Search" onPress={handleSearch} />
        </View>
        <Button title="Log Out" onPress={onLogout} />



        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        {patient && (
          <View style={styles.patientInfo}>
            <ThemedText>Name: {patient.firstName + " " + patient.lastName}</ThemedText>
            <ThemedText>Email: {patient.email}</ThemedText>

            {/* Connect to Patient Button */}
            <Pressable style={styles.connectButton} onPress={handleConnect}>
              <ThemedText style={styles.buttonText}>Connect to Patient</ThemedText>
            </Pressable>

          </View>
        )}






        {/* Info sections */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },

  // container: {
  //   flex: 1,
  //   justifyContent: 'flex-start',
  //   alignItems: 'flex-start',
  //   backgroundColor: '#cae7ff',
  //   width: '100%',
  // },
  content: {
    flexGrow: 1,         // Instead of flex: 1
    alignItems: 'stretch', // Ensures children stretch fully
    width: '100%',
    padding: 20,
  },
  title: {
    fontSize: 27,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 20,
    color: '#041575',
    paddingTop: 20
  },
  doctorName: {
    fontSize: 30,
    fontFamily: 'Figtree_400Regular',
    color: '#041575',
    paddingTop: 10
  },
  horizontalLine: {
    height: 1,
    backgroundColor: '#A9A9A9', // or any color you like
    width: '100%',
    marginVertical: 16, // spacing above and below the line
    alignSelf: 'stretch',
  },
  searchContainer: {
    marginBottom: 16,
    width: '100%'

  },
  patientInfo: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 0,
    margin: 0,
    width: '100%'
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 10,
    color: '#041575'
  },
  searchInput: {
    height: 40,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    width: '100%'

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
    padding: 7,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
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
