import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { useAuth } from '@/components/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import config from '@/config';
import { Recording } from '@types/index';

function RecordingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const router = useRouter();
  const token = authState?.token;

  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Fetch recording details
  useEffect(() => {
    const fetchRecording = async () => {
      if (!id || !token) return;

      try {
        setLoading(true);
        const response = await fetch(`${config.BACKEND_URL}/api/recordings/patient/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log(response)

        if (!response.ok) {
          throw new Error('Failed to fetch recording');
        }

        const data: Recording = await response.json();
        setRecording(data);
      } catch (err) {
        console.error('Error fetching recording:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recording');
      } finally {
        setLoading(false);
      }
    };

    fetchRecording();
  }, [id, token]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playRecording = async () => {
    if (!recording?.file_url) return;

    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: `${config.BACKEND_URL}${recording.file_url}` },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Error playing recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };

  const deleteRecording = async () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${config.BACKEND_URL}/api/recordings/${id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete recording');
              }

              Alert.alert('Success', 'Recording deleted successfully');
              router.back();
            } catch (err) {
              console.error('Error deleting recording:', err);
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#041575" />
          </TouchableOpacity>
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

        {/* Play Button */}
        <TouchableOpacity style={styles.playButton} onPress={playRecording}>
          <Ionicons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={80}
            color="#041575"
          />
          <Text style={styles.playButtonText}>
            {isPlaying ? 'Pause' : 'Play Recording'}
          </Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={deleteRecording}>
            <Ionicons name="trash-outline" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
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
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
