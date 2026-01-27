import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function MedicalHistoryScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton route="/(patient)/profile" />
        <Text style={styles.headerTitle}>Medical History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Coming Soon Card */}
        <View style={styles.comingSoonCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>
            Your medical history will be available here
          </Text>
        </View>

        {/* Feature Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT TO EXPECT</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Voice Recordings</Text>
                <Text style={styles.featureDescription}>
                  View all your past voice recordings and analysis results
                </Text>
              </View>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#E8F8F0' }]}>
                <Ionicons name="analytics-outline" size={24} color="#27AE60" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>AVQI Trends</Text>
                <Text style={styles.featureDescription}>
                  Track your voice quality scores over time
                </Text>
              </View>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEF3E2' }]}>
                <Ionicons name="clipboard-outline" size={24} color="#E67E22" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Survey History</Text>
                <Text style={styles.featureDescription}>
                  Review all completed health surveys and responses
                </Text>
              </View>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FDEDEC' }]}>
                <Ionicons name="calendar-outline" size={24} color="#E74C3C" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Timeline View</Text>
                <Text style={styles.featureDescription}>
                  See your complete healthcare journey chronologically
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoBannerText}>
            We are working hard to bring you a comprehensive medical history feature.
            Stay tuned for updates!
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
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 8,
    fontFamily: 'Figtree_400Regular',
  },
  comingSoonSubtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
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
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  featureDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    fontFamily: 'Figtree_400Regular',
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 78,
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

export default function MedicalHistoryWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <MedicalHistoryScreen />
    </ProtectedRoute>
  );
}
