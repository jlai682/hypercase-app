import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function TermsScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton route="/(patient)/profile" />
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using the HyperCASE application, you accept and agree to be bound by the terms
              and provisions of this agreement. If you do not agree to abide by these terms, please do not
              use this application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.paragraph}>
              HyperCASE is a healthcare application designed to facilitate voice recording analysis and
              communication between patients and healthcare providers. The service includes but is not
              limited to voice recording, analysis, survey completion, and secure data storage.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.paragraph}>
              As a user of this application, you agree to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Provide accurate and complete information during registration</Text>
              <Text style={styles.bulletItem}>• Maintain the confidentiality of your account credentials</Text>
              <Text style={styles.bulletItem}>• Use the application only for its intended healthcare purposes</Text>
              <Text style={styles.bulletItem}>• Not share your account with unauthorized individuals</Text>
              <Text style={styles.bulletItem}>• Report any security breaches or unauthorized access immediately</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Privacy and Data Protection</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. All personal health information collected through this
              application is handled in accordance with HIPAA regulations and applicable data protection
              laws. Voice recordings and health data are encrypted and stored securely. We do not sell
              or share your personal information with third parties without your explicit consent, except
              as required by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Voice Recordings</Text>
            <Text style={styles.paragraph}>
              By using this application, you consent to have your voice recorded for healthcare analysis
              purposes. These recordings will be:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Stored securely in HIPAA-compliant systems</Text>
              <Text style={styles.bulletItem}>• Accessible only to authorized healthcare providers</Text>
              <Text style={styles.bulletItem}>• Used solely for voice analysis and healthcare purposes</Text>
              <Text style={styles.bulletItem}>• Retained according to applicable medical record retention laws</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Medical Disclaimer</Text>
            <Text style={styles.paragraph}>
              This application is not intended to replace professional medical advice, diagnosis, or
              treatment. Always seek the advice of your physician or other qualified health provider
              with any questions you may have regarding a medical condition. Never disregard professional
              medical advice or delay in seeking it because of information obtained through this application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              To the fullest extent permitted by applicable law, HyperCASE and its affiliates shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages, or
              any loss of profits or revenues, whether incurred directly or indirectly, or any loss of
              data, use, goodwill, or other intangible losses.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes via the application or email. Your continued use of the application
              after such modifications constitutes your acceptance of the updated terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Information</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms & Conditions, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>acousticare@gmail.com</Text>
          </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 24,
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    marginTop: 12,
  },
  bulletItem: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 26,
    paddingLeft: 8,
    fontFamily: 'Figtree_400Regular',
  },
  contactInfo: {
    fontSize: 15,
    color: '#3B82F6',
    marginTop: 8,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function TermsWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <TermsScreen />
    </ProtectedRoute>
  );
}
