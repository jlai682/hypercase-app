import { StyleSheet, View, Pressable, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React from 'react';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientSurveys } from '@/hooks/queries';
import { Survey } from '@/types';

function SurveysScreen() {
  const router = useRouter();

  // React Query hook with pull-to-refresh support
  const { data: surveys = [], isLoading: loading, refetch, isRefetching } = usePatientSurveys();

  const handleSurveyPress = (survey: Survey): void => {
    router.push(`/(patient)/surveys/respond/${survey.id}` as any);
  };

  const handleCompletedSurveyPress = (survey: Survey): void => {
    router.push(`/(patient)/surveys/view/${survey.id}` as any);
  };

  const sentSurveys: Survey[] = surveys.filter((survey: Survey) => survey.status === 'sent');
  const completedSurveys: Survey[] = surveys.filter((survey: Survey) => survey.status === 'completed');

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#041575" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Sent Surveys Section */}
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

            {/* Completed Surveys Section */}
            <View style={styles.surveysContainer}>
              <Text style={styles.sectionTitle}>Completed Surveys:</Text>
              {completedSurveys.length > 0 ? (
                completedSurveys.map((survey: Survey) => (
                  <Pressable
                    key={survey.id}
                    style={styles.surveyButton}
                    onPress={() => handleCompletedSurveyPress(survey)}
                  >
                    <View style={styles.surveyItem}>
                      <Text style={styles.surveyTitle}>{survey.title}</Text>
                      <Text style={styles.surveyDate}>{new Date(survey.issue_date).toLocaleDateString()}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Text>No completed surveys found for this patient.</Text>
              )}
            </View>
          </>
        )}
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
});

export default function SurveysScreenWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <SurveysScreen />
    </ProtectedRoute>
  );
}
