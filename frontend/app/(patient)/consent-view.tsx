import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile } from '@/hooks/queries';

function ConsentViewScreen(): React.JSX.Element {
  const { data: patient, isLoading } = usePatientProfile();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton route="/(patient)/profile" />
          <Text style={styles.headerTitle}>Consent Form</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton route="/(patient)/profile" />
        <Text style={styles.headerTitle}>Consent Form</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Consent Submitted</Text>
            <Text style={styles.statusSubtitle}>
              Your consent form has been signed and submitted
            </Text>
          </View>
        </View>

        {/* Consent Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AUDIO RECORDING CONSENT FORM</Text>
          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agreement Summary</Text>
            <Text style={styles.paragraph}>
              By using this application, you have agreed to have your voice recorded for the purpose
              of healthcare analysis. These recordings are stored securely and may be used
              for physician analysis.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You Consented To:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Voice recording during appointments and interactions
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Secure storage as protected health information
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  Use for healthcare analysis and physician review
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  HIPAA-compliant data handling and storage
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.bulletText}>
                  Revoke consent at any time with written notice
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.bulletText}>
                  Request access to your recorded data
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.bulletText}>
                  Receive care regardless of consent status
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Signature Details */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Signed By</Text>
            <Text style={styles.signatureValue}>
              {patient?.firstName} {patient?.lastName}
            </Text>
            <Text style={styles.signatureLabel}>Email</Text>
            <Text style={styles.signatureValue}>{patient?.email}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            To revoke your consent or request changes, please contact your healthcare provider
            or reach out to acousticare@gmail.com
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
    fontFamily: 'Figtree_400Regular',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
    fontFamily: 'Figtree_400Regular',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Figtree_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  paragraph: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
    fontFamily: 'Figtree_400Regular',
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27AE60',
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
    fontFamily: 'Figtree_400Regular',
  },
  signatureSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  signatureValue: {
    fontSize: 16,
    color: '#041575',
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function ConsentViewWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <ConsentViewScreen />
    </ProtectedRoute>
  );
}
