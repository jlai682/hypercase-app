import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Pressable, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const displayedPatients = connectedPatients.slice(0, 2); // Show only first 2 on dashboard

  return (
    <KeyboardAvoidingView
          style={styles.mainContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.doctorName}>Dr. {providerLastName}</Text>
              <View style={styles.underline} />
            </View>
          </View>

          {/* Your Patients Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Patients</Text>
            <Text style={styles.totalCount}>{connectedPatients.length} Total</Text>
          </View>

          {connectedPatients.length > 0 ? (
            <>
              {displayedPatients.map((connection, index) => {
                return (
                  <Pressable
                    key={`patient-${connection.patient.id}-${index}`}
                    style={styles.patientCard}
                    onPress={() => navigateToPatientProfile(connection.patient)}
                  >
                    <View style={styles.patientCardContent}>
                      <View style={styles.avatarContainer}>
                        <Ionicons name="person-outline" size={24} color="#7F8C8D" />
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>
                          {connection.patient.firstName} {connection.patient.lastName}
                        </Text>
                        <Text style={styles.patientEmail}>
                          {connection.patient.email}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
                    </View>
                  </Pressable>
                );
              })}

              {connectedPatients.length > 2 && (
                <Pressable style={styles.viewAllButton} onPress={() => router.push('/(provider)/patients' as any)}>
                  <Text style={styles.viewAllText}>View All Patients</Text>
                  <Ionicons name="arrow-forward" size={16} color="#041575" />
                </Pressable>
              )}
            </>
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

          {/* Patient Search Section */}
          <View style={styles.searchCard}>
            <Text style={styles.searchTitle}>Search for Patients</Text>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
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
            </View>
            <Pressable
              style={[
                styles.searchButton,
                searchMutation.isPending && styles.buttonDisabled
              ]}
              onPress={handleSearch}
              disabled={searchMutation.isPending}
            >
              <Text style={styles.searchButtonText}>
                {searchMutation.isPending ? 'Searching...' : 'Search Patient'}
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
                <View style={styles.patientCardContent}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person-outline" size={24} color="#7F8C8D" />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {searchedPatient.firstName} {searchedPatient.lastName}
                    </Text>
                    <Text style={styles.patientEmail}>
                      {searchedPatient.email}
                    </Text>
                    {searchedPatient.age && (
                      <Text style={styles.patientAge}>Age: {searchedPatient.age}</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.connectButton,
                    connectMutation.isPending && styles.buttonDisabled
                  ]}
                  onPress={handleConnect}
                  disabled={connectMutation.isPending}
                >
                  <Text style={styles.searchButtonText}>
                    {connectMutation.isPending ? 'Connecting...' : 'Connect to Patient'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#666" />
            <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 18,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  doctorName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginTop: 4,
  },
  underline: {
    width: 50,
    height: 3,
    backgroundColor: '#041575',
    borderRadius: 2,
    marginTop: 8,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
  },
  totalCount: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  patientAge: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 15,
    color: '#041575',
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
    marginRight: 6,
  },
  emptyState: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
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
  searchCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  searchIcon: {
    paddingLeft: 14,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontFamily: 'Figtree_400Regular',
    fontSize: 15,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#041575',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  connectButton: {
    marginTop: 16,
    backgroundColor: '#041575',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
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
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 10,
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
    marginLeft: 8,
  },
});

export default function ProviderDashboardWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <ProviderDashScreen />
    </ProtectedRoute>
  );
}
