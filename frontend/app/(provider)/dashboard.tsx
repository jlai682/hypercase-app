import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Pressable, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  useProviderProfile,
  useConnectedPatients,
  useSearchPatient,
  useConnectToPatient,
} from '@/hooks/queries';
import { Patient } from '@/types/';


function ProviderDashScreen(): React.JSX.Element {
  const { onLogout } = useAuth();
  const router = useRouter();

  // Tanstack Query hooks
  const { data: provider } = useProviderProfile();
  const { data: connectedPatients = [] } = useConnectedPatients();
  const searchMutation = useSearchPatient();
  const connectMutation = useConnectToPatient();

  // Local state for search input
  const [email, setEmail] = useState<string>('');

  /**
   * Search for a patient by email
   */
  const handleSearch = (): void => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    searchMutation.mutate(email, {
      onError: (error) => {
        Alert.alert('Error', error.message || 'Patient not found');
      },
    });
  };

  /**
   * Connect to a searched patient
   */
  const handleConnect = (): void => {
    const searchedPatient = searchMutation.data?.patient;
    if (!searchedPatient) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    connectMutation.mutate(searchedPatient.email, {
      onSuccess: () => {
        Alert.alert('Success', 'Successfully connected to patient');
        // Reset search state
        setEmail('');
        searchMutation.reset();
      },
      onError: (error) => {
        Alert.alert('Error', error.message || 'Failed to connect to patient');
      },
    });
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

  const searchedPatient = searchMutation.data?.patient;
  const searchError = searchMutation.error?.message;
  const providerLastName = provider?.lastName || '';

  return (
    <KeyboardAvoidingView
          style={styles.mainContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.mainContainer}>
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
              editable={!searchMutation.isPending}
            />
            <Pressable
              style={[
                styles.searchButton,
                searchMutation.isPending && styles.buttonDisabled
              ]}
              onPress={handleSearch}
              disabled={searchMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {searchMutation.isPending ? 'Searching...' : 'Search'}
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
                    connectMutation.isPending && styles.buttonDisabled
                  ]}
                  onPress={handleConnect}
                  disabled={connectMutation.isPending}
                >
                  <Text style={styles.buttonText}>
                    {connectMutation.isPending ? 'Connecting...' : 'Connect to Patient'}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
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