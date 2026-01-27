import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProvider, useSearchProviders } from '@/hooks/queries';

interface PhysicianCardProps {
  name: string;
  specialty: string;
  email: string;
  isConnected?: boolean;
}

const PhysicianCard: React.FC<PhysicianCardProps> = ({ name, specialty, email, isConnected = false }) => {
  return (
    <View style={styles.physicianCard}>
      <View style={styles.physicianAvatar}>
        <Ionicons name="person" size={28} color="#fff" />
      </View>
      <View style={styles.physicianInfo}>
        <Text style={styles.physicianName}>{name}</Text>
        <Text style={styles.physicianSpecialty}>{specialty}</Text>
        <Text style={styles.physicianEmail}>{email}</Text>
      </View>
      {isConnected && (
        <View style={styles.connectedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      )}
    </View>
  );
};

function PhysiciansScreen(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: connectedProvider, isLoading: isLoadingProvider } = usePatientProvider();
  const { data: searchResults, isLoading: isSearching } = useSearchProviders(searchQuery);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton route="/(patient)/profile" />
        <Text style={styles.headerTitle}>Physicians</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search physicians..."
            placeholderTextColor="#7F8C8D"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>

        {/* Connected Provider Section */}
        {connectedProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY PHYSICIAN</Text>
            <PhysicianCard
              name={`Dr. ${connectedProvider.firstName} ${connectedProvider.lastName}`}
              specialty="Healthcare Provider"
              email={connectedProvider.email}
              isConnected={true}
            />
          </View>
        )}

        {(isLoadingProvider || isSearching) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#041575" />
          </View>
        )}

        {/* Search Results Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'SEARCH RESULTS' : 'ALL PHYSICIANS'}
          </Text>
          {isSearching ? null : searchResults && searchResults.length > 0 ? (
            searchResults
              .filter((provider) => provider.id !== connectedProvider?.id)
              .map((provider) => (
                <PhysicianCard
                  key={provider.id}
                  name={`Dr. ${provider.firstName} ${provider.lastName}`}
                  specialty="Healthcare Provider"
                  email={provider.email}
                />
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#BDC3C7" />
              <Text style={styles.emptyStateText}>No physicians found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search' : 'No physicians available'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoBannerText}>
            Contact your healthcare provider to be connected with a physician on this platform.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
    fontFamily: 'Figtree_400Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  physicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  physicianAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  physicianInfo: {
    flex: 1,
  },
  physicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  physicianSpecialty: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
    fontFamily: 'Figtree_400Regular',
  },
  physicianEmail: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
    fontFamily: 'Figtree_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 12,
    fontFamily: 'Figtree_400Regular',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
    fontFamily: 'Figtree_400Regular',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function PhysiciansWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <PhysiciansScreen />
    </ProtectedRoute>
  );
}
