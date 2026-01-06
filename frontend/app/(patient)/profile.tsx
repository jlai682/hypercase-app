import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Patient } from '@/types';

import config from "@/config";


interface SectionItemProps {
  title: string;
  hasChevron?: boolean;
  onPress: () => void;
}

const SectionItem: React.FC<SectionItemProps> = ({ title, hasChevron = true, onPress }) => {
  return (
    <TouchableOpacity style={styles.sectionItem} onPress={onPress}>
      <Text style={styles.sectionItemText}>{title}</Text>
      {hasChevron && <Ionicons name="chevron-forward" size={20} color="#888" />}
    </TouchableOpacity>
  );
};

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

function ProfileScreen(): React.JSX.Element | null {
  const { authState, onLogout } = useAuth();
  const token = authState?.token;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientProfile = async (): Promise<void> => {
      if (!token) return;
      
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/patientManagement/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch patient data');

        const patientData: Patient = await response.json();
        setPatient(patientData);
      } catch (error) {
        console.error('Error fetching patient profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, [token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No patient data available</Text>
      </SafeAreaView>
    );
  }

  console.log("patient: ", patient);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
            />
          </View>
          <Text>{patient.firstName} {patient.lastName}</Text>
          <Text>age: {patient.age}</Text>
          <Text>email: {patient.email}</Text>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Section title="My Health">
          <SectionItem title="Medical History" onPress={() => console.log('Medical History')} />
          <SectionItem title="Physicians" onPress={() => console.log('Physicians')} />
        </Section>

        <Section title="Settings">
          <SectionItem title="Terms & Conditions" onPress={() => console.log('Terms & Conditions')} />
          <SectionItem title="Consent Form" onPress={() => console.log('Consent Form')} />
        </Section>

        <Section title="Others">
          <SectionItem title="Log Out" onPress={onLogout} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    tintColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
    marginVertical: 16,
  },
  editButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    color: '#666',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionItemText: {
    fontSize: 16,
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#d6e6ff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});

export default function PatientProfileViewWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}