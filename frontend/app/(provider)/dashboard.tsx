import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';

import config from "@/config";
import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Patient,
  ConnectedPatient,
  ProviderPatientsResponse,
  ProviderInfoResponse,
  SearchPatientResponse,
  ApiResponse,
} from '@/types/';


function ProviderDashScreen(): React.JSX.Element {
  const { authState, onLogout } = useAuth();
  const token = authState.token;
  const router = useRouter();

  // Search state
  const [email, setEmail] = useState<string>('');
  const [searchedPatient, setSearchedPatient] = useState<Patient | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Provider state
  const [connectedPatients, setConnectedPatients] = useState<ConnectedPatient[]>([]);
  const [providerLastName, setProviderLastName] = useState<string>('');

  // Loading states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  /**
   * Search for a patient by email
   */
  const handleSearch = async (): Promise<void> => {
    if (!email.trim()) {
      setSearchError('Please enter an email address');
      return;
    }

    if (!token) {
      console.error("No token found, authentication required.");
      Alert.alert('Error', 'You must be logged in to search for patients');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchedPatient(null);

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/search_patient/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: email.trim() })
        }
      );

      const data: SearchPatientResponse = await response.json();

      if (response.ok) {
        if (data.patient) {
          setSearchedPatient(data.patient);
          setSearchError(null);
        } else {
          setSearchedPatient(null);
          setSearchError('Patient not found');
        }
      } else {
        setSearchedPatient(null);
        setSearchError(data.error || 'An error occurred while searching');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Network error. Please check your connection and try again.');
      setSearchedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Connect to a searched patient
   */
  const handleConnect = async (): Promise<void> => {
    if (!searchedPatient) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/connect/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ patient_email: searchedPatient.email })
        }
      );

      const data: ApiResponse<null> = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          data.message || 'Successfully connected to patient'
        );

        // Reset search state
        setEmail('');
        setSearchedPatient(null);
        setSearchError(null);
        await fetchProviderPatients();
      } else {
        setSearchError(data.error || 'Failed to connect to patient');
        Alert.alert('Error', data.error || 'Failed to connect to patient');
      }
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = 'Network error occurred. Please try again.';
      setSearchError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Navigate to patient profile
   */
  const navigateToPatientProfile = (patient: Patient): void => {
    router.push({
      pathname: `/(provider)/patients/${patient.id}` as any,
      params: { email: patient.email }
    });
  };

  /**
   * Fetch list of patients connected to this provider
   */
  const fetchProviderPatients = useCallback(async (): Promise<void> => {
    if (!token) {
      console.error("No token found, authentication required.");
      return;
    }

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/myPatients/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        console.error("Unauthorized: Token might be invalid or expired.");
        Alert.alert(
          'Session Expired',
          'Please log in again.',
          [{ text: 'OK', onPress: () => onLogout() }]
        );
        return;
      }

      const data: ProviderPatientsResponse = await response.json();

      if (response.ok) {
        setConnectedPatients(data.patients || []);
      } else {
        console.error("Error fetching patients:", data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      Alert.alert('Error', 'Failed to load your patients. Please try again.');
    }
  }, [token, onLogout]);

  /**
   * Fetch current provider's information
   */
  const fetchProviderInfo = useCallback(async (): Promise<void> => {
    if (!token) {
      console.log("No token found, authentication required.");
      return;
    }

    try {
      const response = await fetch(
        `${config.BACKEND_URL}/api/providerManagement/providerInfo/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.ok) {
        const data: ProviderInfoResponse = await response.json();
        setProviderLastName(data.provider.lastName);
      } else {
        console.error("Failed to fetch provider info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching provider info:", error);
    }
  }, [token]);

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    if (token) {
      fetchProviderPatients();
      fetchProviderInfo();
    }
  }, [token, fetchProviderPatients, fetchProviderInfo]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Welcome back,</Text>
        <Text style={styles.doctorName}>
          Dr. {providerLastName}
        </Text>

        <View style={styles.horizontalLine} />

        {/* Connected Patients Section */}
        <Text style={styles.sectionTitle}>Your Patients</Text>
        {connectedPatients.length > 0 ? (
          connectedPatients.map((connection, index) => (
            <Pressable
              key={`patient-${connection.patient.id}-${index}`}
              style={styles.patientCard}
              onPress={() => navigateToPatientProfile(connection.patient)}
            >
              <Text style={styles.patientName}>
                {connection.patient.firstName} {connection.patient.lastName}
              </Text>
              <Text style={styles.patientEmail}>
                {connection.patient.email}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No connected patients yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Search for patients below to get started
            </Text>
          </View>
        )}

        <View style={styles.horizontalLine} />

        {/* Patient Search Section */}
        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>Search for Patients</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter patient email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSearching}
          />
          <Pressable
            style={[
              styles.searchButton,
              isSearching && styles.buttonDisabled
            ]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Text style={styles.buttonText}>
              {isSearching ? 'Searching...' : 'Search'}
            </Text>
          </Pressable>
        </View>

        {/* Search Error */}
        {searchError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        )}

        {/* Search Results */}
        {searchedPatient && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <View style={styles.patientCard}>
              <Text style={styles.searchResultLabel}>Name:</Text>
              <Text style={styles.searchResultValue}>
                {searchedPatient.firstName} {searchedPatient.lastName}
              </Text>

              <Text style={styles.searchResultLabel}>Email:</Text>
              <Text style={styles.searchResultValue}>
                {searchedPatient.email}
              </Text>

              {searchedPatient.age && (
                <>
                  <Text style={styles.searchResultLabel}>Age:</Text>
                  <Text style={styles.searchResultValue}>
                    {searchedPatient.age}
                  </Text>
                </>
              )}

              <Pressable
                style={[
                  styles.connectButton,
                  isConnecting && styles.buttonDisabled
                ]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                <Text style={styles.buttonText}>
                  {isConnecting ? 'Connecting...' : 'Connect to Patient'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>
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
    flexGrow: 1,
    alignItems: 'stretch',
    width: '100%',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#041575',
    marginTop: 10,
    fontFamily: 'Figtree_400Regular',
  },
  doctorName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 20,
    fontFamily: 'Figtree_400Regular',
    marginTop: 20,
    paddingTop: 10,
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#87CFE9',
    marginVertical: 15,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Figtree_400Regular',
  },
  emptyState: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Figtree_400Regular',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Figtree_400Regular',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  searchInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    fontFamily: 'Figtree_400Regular',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectButton: {
    marginTop: 15,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontFamily: 'Figtree_400Regular',
  },
  searchResultsContainer: {
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  searchResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    fontFamily: 'Figtree_400Regular',
  },
  searchResultValue: {
    fontSize: 16,
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function ProviderDashboardWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <ProviderDashScreen />
    </ProtectedRoute>
  );
}