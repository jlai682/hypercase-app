import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile } from '@/hooks/queries';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  onPress: () => void;
  textColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconColor = '#041575',
  iconBgColor = '#F0F0F0',
  title,
  onPress,
  textColor = '#333'
}) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.menuItemText, { color: textColor }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
    </TouchableOpacity>
  );
};

function ProfileScreen(): React.JSX.Element {
  const { onLogout } = useAuth();
  const router = useRouter();
  const { data: patient, isLoading: loading } = usePatientProfile();

  /**
   * Get member year from date_joined or current year
   */
  const getMemberYear = (): number => {
    if (patient?.date_joined) {
      return new Date(patient.date_joined).getFullYear();
    }
    return new Date().getFullYear();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>No patient data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color="#fff" />
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
          <Text style={styles.patientInfo}>
            Age: {patient.age} • Member since {getMemberYear()}
          </Text>
          <Text style={styles.patientEmail}>{patient.email}</Text>

          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Health Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>MY HEALTH</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="medical"
              iconColor="#041575"
              iconBgColor="#EEF2FF"
              title="Medical History"
              onPress={() => router.push('/(patient)/profile/medical-history' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="medkit"
              iconColor="#27AE60"
              iconBgColor="#E8F8F0"
              title="Physicians"
              onPress={() => router.push('/(patient)/profile/physicians' as any)}
            />
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="document-text"
              iconColor="#041575"
              iconBgColor="#EEF2FF"
              title="Terms & Conditions"
              onPress={() => router.push('/(patient)/profile/terms' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="checkbox"
              iconColor="#041575"
              iconBgColor="#EEF2FF"
              title="Consent Form"
              onPress={() => router.push('/(patient)/profile/consent-view' as any)}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications"
              iconColor="#041575"
              iconBgColor="#EEF2FF"
              title="Notifications"
              onPress={() => console.log('Notifications')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.sectionContainer}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              iconColor="#E74C3C"
              iconBgColor="#FDEDEC"
              title="Log Out"
              textColor="#E74C3C"
              onPress={onLogout}
            />
          </View>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Version 2.4.0 (Build 1082)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Figtree_400Regular',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E74C3C',
    fontFamily: 'Figtree_400Regular',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#cae7ff',
  },
  patientName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 8,
    fontFamily: 'Figtree_700Bold',
  },
  patientInfo: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  patientEmail: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 20,
    fontFamily: 'Figtree_400Regular',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  sectionContainer: {
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
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 70,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#BDC3C7',
    marginTop: 20,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function PatientProfileViewWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
