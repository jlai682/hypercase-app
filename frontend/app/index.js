import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const FeatureCard = ({ iconName, title, description, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    styles.card,
    pressed && styles.cardPressed
  ]}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={iconName} size={32} color="#4A90E2" />
    </View>
    <View style={styles.cardContent}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardDescription}>{description}</ThemedText>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#4A90E2" />
  </Pressable>
);

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4A90E2', dark: '#2C5282' }}
      contentContainerStyle={styles.container}
    >
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title" style={styles.mainTitle}>
          Voice Health Study
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Contributing to voice health research through patient participation
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featuresContainer}>
        <FeatureCard
          iconName="file-sign"
          title="Consent Management"
          description="Secure digital consent process for study participation"
          onPress={() => router.push('/consent')}
        />
        <FeatureCard
          iconName="file-document-outline"
          title="Patient Survey"
          description="Complete a comprehensive survey about your voice health history"
          onPress={() => router.push('/survey')}
        />
        <FeatureCard
          iconName="microphone"
          title="Voice Recording"
          description="Record voice samples in a controlled environment for research purposes"
          onPress={() => router.push('/record')}
        />
      </ThemedView>

      <View style={styles.infoContainer}>
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={24} color="#4A90E2" />
            <ThemedText style={styles.sectionTitle}>About This Study</ThemedText>
          </View>
          <ThemedText style={styles.sectionText}>
            This application is designed to collect voice samples and relevant health information 
            from participants. Your contribution helps advance our understanding of voice-related 
            health conditions and potential treatments.
          </ThemedText>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="play-circle" size={24} color="#4A90E2" />
            <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
          </View>
          <ThemedText style={styles.sectionText}>
            Begin by reviewing and signing the consent form. Then complete the voice health survey 
            before proceeding to record your voice samples.
          </ThemedText>
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerContainer: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C5282',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C5282',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  infoContainer: {
    gap: 16,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C5282',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#64748B',
  },
});