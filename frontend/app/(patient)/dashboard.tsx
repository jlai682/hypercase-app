import { StyleSheet, View, ScrollView, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePatientProfile, usePatientSurveys, usePatientProvider, useRecordingRequests } from '@/hooks/queries';

import { Survey, RecordingRequest } from '@/types';

function HomeScreen() {
  // Tanstack Query hooks - fetches run in parallel automatically
  const { data: patient, isLoading: loadingPatient } = usePatientProfile();
  const { data: surveys = [], isLoading: loadingSurveys } = usePatientSurveys();
  const { data: provider, isLoading: loadingProvider } = usePatientProvider();
  const { data: recordingRequests = [], isLoading: loadingRequests } = useRecordingRequests();

  const loading = loadingPatient || loadingSurveys || loadingProvider || loadingRequests;

  const pendingSurveys: Survey[] = surveys
    .filter((survey: Survey) => survey.status === 'sent')
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

  const pendingRecordingRequests: RecordingRequest[] = recordingRequests
    .filter((req: RecordingRequest) => req.status === 'sent')
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());

  const hasTasks = pendingSurveys.length > 0 || pendingRecordingRequests.length > 0;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#041575" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Welcome Header */}
            <View style={styles.headerSection}>
              <Text style={styles.welcomeTitle}>Welcome, {patient?.firstName}</Text>
              <Text style={styles.welcomeSubtitle}>How are you feeling today?</Text>
            </View>

            {/* Your Provider Section */}
            {provider && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>YOUR PROVIDER</Text>
                <View style={styles.providerCard}>
                  <View style={styles.providerAvatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                    <View style={styles.providerStatusDot} />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>Dr. {provider.firstName} {provider.lastName}</Text>
                  </View>
                  <View style={styles.messageButton}>
                    <Ionicons name="chatbubble" size={18} color="#fff" />
                  </View>
                </View>
              </View>
            )}

            {/* Today's Tasks Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>INCOMPLETE TASKS</Text>

              {hasTasks ? (
                <View style={styles.tasksCard}>
                  {/* Pending Surveys */}
                  {pendingSurveys.length > 0 && (
                    <>
                      <View style={styles.taskCategoryHeader}>
                        <View style={[styles.taskCategoryIcon, { backgroundColor: '#FEF3E2' }]}>
                          <Ionicons name="clipboard" size={18} color="#E67E22" />
                        </View>
                        <Text style={styles.taskCategoryTitle}>Pending Surveys</Text>
                        <View style={styles.taskCountBadge}>
                          <Text style={styles.taskCountText}>{pendingSurveys.length}</Text>
                        </View>
                      </View>
                      {pendingSurveys.map((survey: Survey, index: number) => (
                        <View
                          key={`survey-${survey.id}`}
                          style={[
                            styles.taskItem,
                            index === pendingSurveys.length - 1 && pendingRecordingRequests.length === 0 && styles.taskItemLast
                          ]}
                        >
                          <View style={styles.taskItemDot} />
                          <View style={styles.taskItemContent}>
                            <Text style={styles.taskItemTitle}>{survey.title}</Text>
                            <Text style={styles.taskItemDate}>Received {formatDate(survey.issue_date)}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {/* Divider between surveys and recordings */}
                  {pendingSurveys.length > 0 && pendingRecordingRequests.length > 0 && (
                    <View style={styles.taskDivider} />
                  )}

                  {/* Pending Recording Requests */}
                  {pendingRecordingRequests.length > 0 && (
                    <>
                      <View style={styles.taskCategoryHeader}>
                        <View style={[styles.taskCategoryIcon, { backgroundColor: '#EEF2FF' }]}>
                          <Ionicons name="mic" size={18} color="#3B82F6" />
                        </View>
                        <Text style={styles.taskCategoryTitle}>Pending Recordings</Text>
                        <View style={[styles.taskCountBadge, { backgroundColor: '#3B82F6' }]}>
                          <Text style={styles.taskCountText}>{pendingRecordingRequests.length}</Text>
                        </View>
                      </View>
                      {pendingRecordingRequests.map((request: RecordingRequest, index: number) => (
                        <View
                          key={`recording-${request.id}`}
                          style={[
                            styles.taskItem,
                            index === pendingRecordingRequests.length - 1 && styles.taskItemLast
                          ]}
                        >
                          <View style={[styles.taskItemDot, { backgroundColor: '#3B82F6' }]} />
                          <View style={styles.taskItemContent}>
                            <Text style={styles.taskItemTitle}>{request.title}</Text>
                            <Text style={styles.taskItemDate}>Requested {formatDate(request.issue_date)}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.noTasksCard}>
                  <Ionicons name="checkmark-circle" size={48} color="#27AE60" />
                  <Text style={styles.noTasksTitle}>All caught up!</Text>
                  <Text style={styles.noTasksText}>You have no pending tasks at the moment.</Text>
                </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  headerSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    letterSpacing: 0.5,
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  providerCard: {
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
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  providerStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#fff',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCategoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  taskCountBadge: {
    backgroundColor: '#E67E22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Figtree_400Regular',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginLeft: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskItemLast: {
    borderBottomWidth: 0,
  },
  taskItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E67E22',
    marginTop: 6,
    marginRight: 12,
  },
  taskItemContent: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
  },
  taskItemDate: {
    fontSize: 13,
    color: '#7F8C8D',
    fontFamily: 'Figtree_400Regular',
  },
  taskDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 16,
  },
  noTasksCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noTasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041575',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Figtree_400Regular',
  },
  noTasksText: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
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
