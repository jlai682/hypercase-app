import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/components/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BackButton from '@/components/ui/BackButton';
import config from '@/config';

interface VoiceAnalytics {
  status: string;
  error_message?: string;
  processing_duration?: number;
  recording_quality?: string;
  quality_warnings?: string[];
  // Jitter
  jitter_local?: number;
  jitter_absolute?: number;
  jitter_rap?: number;
  jitter_ppq5?: number;
  jitter_ddp?: number;
  // Shimmer
  shimmer_local?: number;
  shimmer_db?: number;
  shimmer_apq3?: number;
  shimmer_apq5?: number;
  shimmer_apq11?: number;
  shimmer_dda?: number;
  // F0
  f0_mean?: number;
  f0_min?: number;
  f0_max?: number;
  f0_std?: number;
  f0_voiced_frames?: number;
  // CPP
  cpp_mean?: number;
  // HNR
  hnr_mean?: number;
  hnr_min?: number;
  hnr_max?: number;
  // LTAS
  ltas_slope?: number;
  ltas_tilt?: number;
  // AVQI
  avqi_score?: number;
  avqi_interpretation?: string;
}

interface Recording {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  created_at: string;
  analytics_status?: string;
}

function RecordingDetail() {
  const params = useLocalSearchParams<{ id: string; recordingId: string }>();
  const patientId = params.id; // Patient ID from first [id] segment
  const recordingId = params.recordingId; // Recording ID from [recordingId] segment
  const { authState } = useAuth();
  const router = useRouter();
  const token = authState?.token;

  const [recording, setRecording] = useState<Recording | null>(null);
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Poll for analytics status
  useEffect(() => {
    // Fetch recording details
    const fetchRecording = async () => {
      if (!recordingId || !token || !patientId) return;

      try {
        const response = await fetch(`${config.BACKEND_URL}/api/recordings/patient/${patientId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recordings');
        }

        const data = await response.json();
        const rec = data.find((r: Recording) => r.id === parseInt(recordingId));
        if (rec) {
          setRecording(rec);
        } else {
          throw new Error('Recording not found');
        }
      } catch (err) {
        console.error('Error fetching recording:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recording');
      } finally {
        setLoading(false);
      }
    };

    fetchRecording()
  }, [recordingId, token, patientId]);

  useEffect(() => {
    if (!recording) return;

    // Fetch analytics
    const fetchAnalytics = async () => {
      if (!recordingId || !token) return;

      try {
        const response = await fetch(`${config.BACKEND_URL}/api/recordings/${recordingId}/analytics/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    };

    fetchAnalytics();

    // Poll every 3 seconds if processing
    const interval = setInterval(() => {
      if (recording.analytics_status === 'pending' || recording.analytics_status === 'processing') {
        fetchAnalytics();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [recording, recordingId, token]);

  const renderMetric = (label: string, value: number | undefined, unit: string = '') => {
    if (value === undefined || value === null) return null;
    return (
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{label}:</Text>
        <Text style={styles.metricValue}>{value.toFixed(3)}{unit}</Text>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    if (analytics.status === 'pending' || analytics.status === 'processing') {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.processingText}>Processing voice analytics...</Text>
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
          {/* AVQI Score - Most Important */}
          <View style={[styles.card, styles.avqiCard]}>
            <Text style={[styles.sectionTitle, { color: '#FFF' }]}>AVQI Score</Text>
            <Text style={styles.avqiScore}>{analytics.avqi_score?.toFixed(2) || 'N/A'}</Text>
            <Text style={styles.avqiInterpretation}>
              {analytics.avqi_interpretation?.toUpperCase() || 'N/A'}
            </Text>
          </View>

          {/* Quality Metrics */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recording Quality</Text>
            <Text style={styles.qualityBadge}>{analytics.recording_quality?.toUpperCase() || 'N/A'}</Text>
            {analytics.quality_warnings && analytics.quality_warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                {analytics.quality_warnings.map((warning, idx) => (
                  <Text key={idx} style={styles.warningText}>• {warning}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Jitter Parameters */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Jitter Parameters</Text>
            {renderMetric('Local', analytics.jitter_local, '%')}
            {renderMetric('Absolute', analytics.jitter_absolute, ' s')}
            {renderMetric('RAP', analytics.jitter_rap)}
            {renderMetric('PPQ5', analytics.jitter_ppq5)}
            {renderMetric('DDP', analytics.jitter_ddp)}
          </View>

          {/* Shimmer Parameters */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shimmer Parameters</Text>
            {renderMetric('Local', analytics.shimmer_local, '%')}
            {renderMetric('dB', analytics.shimmer_db, ' dB')}
            {renderMetric('APQ3', analytics.shimmer_apq3)}
            {renderMetric('APQ5', analytics.shimmer_apq5)}
            {renderMetric('APQ11', analytics.shimmer_apq11)}
            {renderMetric('DDA', analytics.shimmer_dda)}
          </View>

          {/* F0 Parameters */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>F0 (Pitch) Parameters</Text>
            {renderMetric('Mean', analytics.f0_mean, ' Hz')}
            {renderMetric('Min', analytics.f0_min, ' Hz')}
            {renderMetric('Max', analytics.f0_max, ' Hz')}
            {renderMetric('Std Dev', analytics.f0_std, ' Hz')}
            {analytics.f0_voiced_frames && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Voiced Frames:</Text>
                <Text style={styles.metricValue}>{analytics.f0_voiced_frames}</Text>
              </View>
            )}
          </View>

          {/* CPP */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CPP (Cepstral Peak Prominence)</Text>
            {renderMetric('Mean', analytics.cpp_mean, ' dB')}
          </View>

          {/* HNR */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>HNR (Harmonics-to-Noise Ratio)</Text>
            {renderMetric('Mean', analytics.hnr_mean, ' dB')}
            {renderMetric('Min', analytics.hnr_min, ' dB')}
            {renderMetric('Max', analytics.hnr_max, ' dB')}
          </View>

          {/* LTAS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>LTAS (Long-Term Average Spectrum)</Text>
            {renderMetric('Slope', analytics.ltas_slope)}
            {renderMetric('Tilt', analytics.ltas_tilt, ' dB')}
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BackButton />
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
        <BackButton />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Recording not found'}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Recording Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Recording Info Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="mic-circle" size={80} color="#041575" />
          </View>

          <Text style={styles.title}>{recording.title}</Text>

          {recording.description && (
            <Text style={styles.description}>{recording.description}</Text>
          )}

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.metadataText}>
                {new Date(recording.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.metadataText}>
                {new Date(recording.created_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
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
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#041575',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    justifyContent: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  playButton: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginTop: 12,
  },
  analyticsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#041575',
    marginBottom: 12,
  },
  avqiCard: {
    alignItems: 'center',
    backgroundColor: '#041575',
  },
  avqiScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 8,
  },
  avqiInterpretation: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  qualityBadge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#041575',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#041575',
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function RecordingDetailWrapper() {
  return (
    <ProtectedRoute>
      <RecordingDetail />
    </ProtectedRoute>
  );
}
