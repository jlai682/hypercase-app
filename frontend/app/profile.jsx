import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import NavBar from '@/components/navigation/NavBar'
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "./context/AuthContext";
import BackButton from '../components/BackButton';

// Remove TypeScript interfaces and convert to JSX

const SectionItem = ({ title, hasChevron = true, onPress }) => {
  return (
    <TouchableOpacity style={styles.sectionItem} onPress={onPress}>
      <Text style={styles.sectionItemText}>{title}</Text>
      {hasChevron && <Ionicons name="chevron-forward" size={20} color="#888" />}
    </TouchableOpacity>
  );
};

const Section = ({ title, children }) => {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { patient } = useLocalSearchParams();
  const parsedPatient = patient ? JSON.parse(patient) : null;
  const { onLogout } = useAuth();

  console.log("patient: ", patient);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileContainer}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
        <BackButton />
      </View>
          <View style={styles.avatarContainer}>
            <Image
              // source={require('./assets/profile-placeholder.png')}
              style={styles.avatar}
            />
          </View>
          <Text>{parsedPatient.firstName} {parsedPatient.lastName}</Text>
          <Text>age: {parsedPatient.age}</Text>
          <Text>email: {parsedPatient.email}</Text>
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

      <NavBar />
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
