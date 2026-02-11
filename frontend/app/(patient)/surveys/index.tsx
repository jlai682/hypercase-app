import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientSurveys } from '@/hooks/queries';
import { Survey } from '@/types';

function SurveysScreen() {
  const router = useRouter();

  // Tanstack Query hook with pull-to-refresh support
  const { data: surveys = [], isLoading: loading, refetch, isRefetching } = usePatientSurveys();

  const handleSurveyPress = (survey: Survey): void => {
    router.push(`/(patient)/surveys/respond/${survey.id}` as any);
  };

  const handleCompletedSurveyPress = (survey: Survey): void => {
    router.push(`/(patient)/surveys/view/${survey.id}` as any);
  };

  // Filter and sort surveys
  const pendingSurveys = useMemo(() =>
    surveys
      .filter((survey: Survey) => survey.status === 'sent')
      .sort((a: Survey, b: Survey) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()),
    [surveys]
  );

  const completedSurveys = useMemo(() =>
    surveys
      .filter((survey: Survey) => survey.status === 'completed')
      .sort((a: Survey, b: Survey) => new Date(b.response_date || b.issue_date).getTime() - new Date(a.response_date || a.issue_date).getTime()),
    [surveys]
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
          <Text style={styles.loadingText}>Loading surveys...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Surveys</Text>
          <Text style={styles.headerSubtitle}>Manage your health assessments</Text>
        </View>

        {/* Pending Surveys Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Surveys</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pendingSurveys.length}</Text>
            </View>
          </View>

          {pendingSurveys.length > 0 ? (
            <View style={styles.surveysContainer}>
              {pendingSurveys.map((survey: Survey) => (
                <TouchableOpacity
                  key={survey.id}
                  style={styles.pendingSurveyCard}
                  onPress={() => handleSurveyPress(survey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pendingIconContainer}>
                    <Ionicons name="clipboard" size={24} color="#E67E22" />
                  </View>
                  <View style={styles.surveyInfo}>
                    <Text style={styles.surveyTitle}>{survey.title}</Text>
                    <View style={styles.surveyDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#7F8C8D" />
                      <Text style={styles.surveyDate}>{formatDate(survey.issue_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>Start</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="checkbox" size={32} color="#041575" />
              </View>
              <Text style={styles.emptyStateTitle}>All caught up!</Text>
              <Text style={styles.emptyStateText}>
                No pending surveys found for your profile at this time.
              </Text>
            </View>
          )}
        </View>

        {/* Completed Surveys Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Surveys</Text>
            <Text style={styles.totalText}>{completedSurveys.length} Total</Text>
          </View>

          {completedSurveys.length > 0 ? (
            <View style={styles.surveysContainer}>
              {completedSurveys.map((survey: Survey) => (
                <TouchableOpacity
                  key={survey.id}
                  style={styles.completedSurveyCard}
                  onPress={() => handleCompletedSurveyPress(survey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.completedIconContainer}>
                    <Ionicons name="checkmark-circle" size={28} color="#27AE60" />
                  </View>
                  <View style={styles.surveyInfo}>
                    <Text style={styles.surveyTitle}>{survey.title}</Text>
                    <View style={styles.surveyDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#7F8C8D" />
                      <Text style={styles.surveyDate}>
                        {formatDate(survey.response_date || survey.issue_date)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCompletedContainer}>
              <Ionicons name="document-text-outline" size={48} color="#BDC3C7" />
              <Text style={styles.emptyCompletedText}>No completed surveys yet</Text>
              <Text style={styles.emptyCompletedSubtext}>
                Complete a pending survey to see it here
              </Text>
            </View>
          )}
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_700Bold',
  },
  countBadge: {
    backgroundColor: '#041575',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  totalText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  surveysContainer: {
    gap: 12,
  },
  pendingSurveyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  completedSurveyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 6,
    fontFamily: 'Figtree_400Regular',
  },
  surveyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  surveyDate: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041575',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  emptyStateContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 8,
    fontFamily: 'Figtree_700Bold',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontFamily: 'Figtree_400Regular',
  },
  emptyCompletedContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyCompletedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
    fontFamily: 'Figtree_400Regular',
  },
  emptyCompletedSubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
    textAlign: 'center',
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
