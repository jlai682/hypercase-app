import { StyleSheet, View, Pressable, ScrollView, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React from 'react';

import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile, usePatientSurveys, usePatientProvider } from '@/hooks/queries';

import { Survey } from '@/types';

function HomeScreen() {
  const { onLogout } = useAuth();
  const router = useRouter();

  // Tanstack Query hooks - fetches run in parallel automatically
  const { data: patient, isLoading: loadingPatient } = usePatientProfile();
  const { data: surveys = [], isLoading: loadingSurveys } = usePatientSurveys();
  const { data: provider, isLoading: loadingProvider } = usePatientProvider();

  const loading = loadingPatient || loadingSurveys || loadingProvider;

  const handleSurveyPress = (survey: Survey): void => {
      router.push(`/(patient)/surveys/respond/${survey.id}` as any);
  };

  const sentSurveys: Survey[] = surveys.filter((survey: Survey) => survey.status === 'sent');

  console.log("Provider State in JSX: ", provider);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>

        {loading ? (
          <ActivityIndicator size="large" color="#041575" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.title}>Welcome back, {patient?.firstName}</Text>

            <View style={styles.horizontalLine} />
          </>
        )}

        {provider && (
          <View style={styles.providerCard}>
            <Text style={styles.sectionTitle}>Your Provider:</Text>
            <Text style={styles.providerName}>Dr. {provider.lastName}</Text>
          </View>
        )}

        {/* Pending Surveys Section */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Surveys:</Text>
          {sentSurveys.length > 0 ? (
            sentSurveys.map((survey: Survey) => (
              <Pressable
                key={survey.id}
                style={styles.surveyButton}
                onPress={() => handleSurveyPress(survey)}
              >
                <View style={styles.surveyItem}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(survey.issue_date).toLocaleDateString()}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.surveyDate}>No pending surveys found for this patient.</Text>
          )}
        </View>
        
        <Pressable style={styles.button} onPress={onLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#041575',
    marginTop: 10,
    fontFamily: 'Figtree_400Regular',
  },
  patientName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#87CFE9',
    marginVertical: 15,
    borderRadius: 5,
  },
  surveysContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  surveyButton: {
    backgroundColor: '#e8f4ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  surveyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  surveyDate: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
    boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#f0f8ff',
  },
  iconContainer: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Bold',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  providerCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
  },
});

export default function HomeScreenWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}