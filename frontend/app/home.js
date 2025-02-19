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
      <MaterialCommunityIcons name={iconName} size={32} color="#87CEFA" />
    </View>
    <View style={styles.cardContent}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardDescription}>{description}</ThemedText>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#87CEFA" />
  </Pressable>
);

export default function HomeScreen() {
  const router = useRouter();
  // Set the status bar style
  React.useEffect(() => {
    // You may need to implement status bar color changing here
    // depending on your navigation setup
  }, []);

  return (
    <View style={styles.wrapper}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#87CEFA', dark: '#87CEFA' }}
        backgroundColor="#FFFFFF"
        style={{backgroundColor: '#FFFFFF'}}
        contentContainerStyle={styles.container}
      >
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title" style={styles.mainTitle}>
          AcoustiCare
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
            <MaterialCommunityIcons name="information" size={24} color="#87CEFA" />
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
            <MaterialCommunityIcons name="play-circle" size={24} color="#87CEFA" />
            <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
          </View>
          <ThemedText style={styles.sectionText}>
            Begin by reviewing and signing the consent form. Then complete the voice health survey 
            before proceeding to record your voice samples.
          </ThemedText>
        </View>
      </View>
    </ParallaxScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#87CEFA',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#A0AEC0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#87CEFA',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoContainer: {
    gap: 20,
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#A0AEC0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#87CEFA',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6B7280',
  },
});