import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import { useRecordingsByPatient, useRecordingAnalytics } from '@/hooks/queries';
import { Recording } from '@/types';

function RecordingDetail() {
  const params = useLocalSearchParams<{ id: string; recordingId: string }>();
  const patientId = params.id;
  const recordingId = params.recordingId;
  const router = useRouter();

  // Tanstack Query hooks
  const { data: recordings = [], isLoading: loadingRecordings, error: recordingsError } = useRecordingsByPatient(patientId);
  const recording = recordings.find((r: Recording) => r.id === parseInt(recordingId || '0')) || null;
  const { data: analytics } = useRecordingAnalytics(recording ? recordingId : undefined);

  const loading = loadingRecordings;
  const error = recordingsError?.message || (!loading && !recording ? 'Recording not found' : null);

  /**
   * Format date for display
   */
  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `Recorded on ${month} ${day}, ${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
  };

  /**
   * Render a metric row
   */
  const renderMetricRow = (label: string, value: number | undefined, unit: string = '') => {
    if (value === undefined || value === null) return null;
    const formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
    return (
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{formattedValue}{unit}</Text>
      </View>
    );
  };

  /**
   * Get quality color based on status
   */
  const getQualityColor = (quality: string | undefined): string => {
    if (!quality) return '#7F8C8D';
    const q = quality.toLowerCase();
    if (q === 'good' || q === 'excellent') return '#27AE60';
    if (q === 'fair') return '#E67E22';
    if (q === 'poor') return '#E74C3C';
    return '#3B82F6';
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    if (analytics.status === 'pending' || analytics.status === 'processing') {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.processingText}>Processing voice analytics...</Text>
          <Text style={styles.processingSubtext}>This may take a moment</Text>
        </View>
      );
    }

    if (analytics.status === 'failed') {
      return (
        <View style={styles.card}>
          <Ionicons name="alert-circle" size={48} color="#E74C3C" />
          <Text style={styles.errorTitle}>Analytics Failed</Text>
          {analytics.error_message && (
            <Text style={styles.errorMessage}>{analytics.error_message}</Text>
          )}
        </View>
      );
    }

    if (analytics.status === 'completed') {
      return (
        <View style={styles.analyticsContainer}>
          {/* AVQI Score Card */}
          <View style={styles.avqiCard}>
            <View style={styles.avqiDecoCircle} />
            <Text style={styles.avqiLabel}>AVQI SCORE</Text>
            <Text style={styles.avqiScore}>{analytics.avqi_score?.toFixed(2) || '--'}</Text>
            <View style={styles.avqiBadge}>
              <Text style={styles.avqiBadgeText}>
                {analytics.avqi_interpretation?.toUpperCase() || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Recording Quality Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bar-chart" size={20} color="#041575" />
              <Text style={styles.cardTitle}>Recording Quality</Text>
            </View>
            <Text style={[styles.qualityStatus, { color: getQualityColor(analytics.recording_quality) }]}>
              {analytics.recording_quality?.toUpperCase() || 'N/A'}
            </Text>
            {analytics.quality_warnings && analytics.quality_warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                {analytics.quality_warnings.map((warning: string, idx: number) => (
                  <View key={idx} style={styles.warningItem}>
                    <View style={styles.warningDot} />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Jitter Parameters Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="pulse" size={20} color="#041575" />
              <Text style={styles.cardTitle}>Jitter Parameters</Text>
            </View>
            {renderMetricRow('Local', analytics.jitter_local, '%')}
            {renderMetricRow('Absolute', analytics.jitter_absolute, ' s')}
            {renderMetricRow('RAP', analytics.jitter_rap)}
            {renderMetricRow('PPQ5', analytics.jitter_ppq5)}
            {renderMetricRow('DDP', analytics.jitter_ddp)}
          </View>

          {/* Shimmer Parameters Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={20} color="#041575" />
              <Text style={styles.cardTitle}>Shimmer Parameters</Text>
            </View>
            {renderMetricRow('Local', analytics.shimmer_local, '%')}
            {renderMetricRow('dB', analytics.shimmer_db, ' dB')}
            {renderMetricRow('APQ11', analytics.shimmer_apq11)}
            {renderMetricRow('DDA', analytics.shimmer_dda)}
          </View>

          {/* F0 (Pitch) Parameters Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="musical-note" size={20} color="#041575" />
              <Text style={styles.cardTitle}>F0 (Pitch) Parameters</Text>
            </View>
            {renderMetricRow('Mean', analytics.f0_mean, ' Hz')}
            {renderMetricRow('Min', analytics.f0_min, ' Hz')}
            {renderMetricRow('Max', analytics.f0_max, ' Hz')}
          </View>

          {/* HNR Card */}
          {(analytics.hnr_mean !== undefined || analytics.cpp_mean !== undefined) && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="analytics" size={20} color="#041575" />
                <Text style={styles.cardTitle}>Additional Metrics</Text>
              </View>
              {renderMetricRow('CPP Mean', analytics.cpp_mean, ' dB')}
              {renderMetricRow('HNR Mean', analytics.hnr_mean, ' dB')}
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <BackButton />
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.loadingText}>Loading recording...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recording) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <BackButton />
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Recording not found'}</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerBar}>
          <BackButton />
          <View style={{ width: 40 }} />
        </View>

        {/* Recording Info Section */}
        <View style={styles.recordingInfoSection}>
          <Text style={styles.recordingTitle}>{recording.title}</Text>
          <Text style={styles.recordingSubtitle}>
            {formatFullDate(recording.created_at)}
          </Text> 
        </View>

        {/* Voice Analytics */}
        {renderAnalytics()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recordingInfoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  micIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#041575',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Figtree_700Bold',
  },
  recordingSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Figtree_400Regular',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#041575',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  analyticsContainer: {
    gap: 16,
  },
  avqiCard: {
    backgroundColor: '#041575',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avqiDecoCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avqiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'Figtree_400Regular',
  },
  avqiScore: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Figtree_700Bold',
  },
  avqiBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  avqiBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
  },
  qualityStatus: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Figtree_700Bold',
  },
  warningsContainer: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 16,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E67E22',
    marginTop: 6,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontFamily: 'Figtree_400Regular',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricLabel: {
    fontSize: 15,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
  },
  processingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E74C3C',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Figtree_700Bold',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
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
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
  },
  goBackButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#041575',
    borderRadius: 12,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
});

export default function RecordingDetailWrapper() {
  return (
    <ProtectedRoute>
      <RecordingDetail />
    </ProtectedRoute>
  );
}
