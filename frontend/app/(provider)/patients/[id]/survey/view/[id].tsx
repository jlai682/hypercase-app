import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Option, Question } from '@/types';
import { useSurveysByPatient, useSurveyQuestions } from '@/hooks/queries';

interface CombinedResponse {
  question: Question;
  options?: Option[];
  selected_options?: string[];
  response?: string;
}

function CompletedSurveyView(): React.JSX.Element {
  const params = useLocalSearchParams();
  const surveyId = params.id as string;
  const patientId = params.patientId as string;

  // Tanstack Query hooks
  const { data: surveys = [] } = useSurveysByPatient(patientId);
  const survey = surveys.find(s => s.id.toString() === surveyId) || null;
  const { data: surveyData, isLoading: loading, error: queryError } = useSurveyQuestions(surveyId);
  const error = queryError?.message || null;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';

    try {
      // Remove microseconds by truncating the date string to only include seconds
      const cleanDateStr = dateString.split('.')[0] + 'Z';
      const date = new Date(cleanDateStr);

      return (
        date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) +
        ' ' +
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
        })
      );
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: CombinedResponse }): React.JSX.Element => (
    <View style={styles.itemContainer}>
      <Text style={styles.question}>{item.question.question_description}</Text>

      {item.options ? (
        <View style={styles.options}>
          {item.options.map((option) => (
            <View style={styles.optionContainer} key={option.id}>
              <Text
                style={[
                  styles.optionText,
                  item.selected_options?.includes(option.option) && styles.selectedOption,
                ]}
              >
                {option.option}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.responseText}>
          {item.response || 'No response provided'}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
          <BackButton />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
          <BackButton />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!surveyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
          <BackButton />
        </View>
        <View style={styles.emptyContainer}>
          <Text>No survey data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Combine multiple choice and open responses into a single array
  const combinedResponses: CombinedResponse[] = [
    ...surveyData.multiple_choice_responses,
    ...surveyData.open_responses,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
        <BackButton />
      </View>

      <FlatList
        data={combinedResponses}
        renderItem={renderItem}
        keyExtractor={(item, index) => `response-${index}`}
        ListHeaderComponent={
          <>
            <Text style={styles.surveyTitle}>{surveyData.survey_title}</Text>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>
                Issue Date: {formatDate(survey?.issue_date)}
              </Text>
              <Text style={styles.dateText}>
                Response Date: {formatDate(survey?.response_date)}
              </Text>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#cae7ff',
    padding: 20,
  },
  surveyTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#00205B',
    marginBottom: 24,
    fontFamily: 'Figtree_400Regular',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
    marginBottom: 5,
    fontFamily: 'Figtree_400Regular',
    paddingHorizontal: 20,
  },
  itemContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 6px 0px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    marginHorizontal: 10,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00205B',
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  options: {
    flexDirection: 'column',
    gap: 12,
  },
  optionContainer: {
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Figtree_400Regular',
  },
  selectedOption: {
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  responseText: {
    fontSize: 16,
    color: '#4a4a4a',
    fontFamily: 'Figtree_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function CompletedSurveyViewWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <CompletedSurveyView />
    </ProtectedRoute>
  );
}
