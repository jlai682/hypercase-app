import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSurveyQuestions, useSubmitSurvey } from '@/hooks/queries';
import {
  Option,
  MultipleChoiceQuestion,
  OpenResponseQuestion,
} from '@/types';

// Component-specific types
interface SelectedOptions {
  [key: number]: Option;
}

interface OpenResponses {
  [key: number]: {
    questionObject: OpenResponseQuestion;
    response: string;
  };
}

interface MultipleChoiceResponse {
  questionObject: MultipleChoiceQuestion;
  response: Option | null;
}

interface RadioButtonProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({ selected, onSelect, label }) => (
  <Pressable
    onPress={onSelect}
    style={({ pressed }) => [
      styles.radioOption,
      pressed && styles.radioOptionPressed
    ]}
  >
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
    <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
      {label}
    </Text>
  </Pressable>
);

function SurveyResponder(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // React Query hooks
  const { data: surveyData, isLoading: loading, error: queryError } = useSurveyQuestions(id);
  const submitMutation = useSubmitSurvey();

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [openResponses, setOpenResponses] = useState<OpenResponses>({});
  const [multipleChoiceResponses, setMultipleChoiceResponses] = useState<MultipleChoiceResponse[]>([]);

  const error = queryError?.message || null;

  // Update multiple choice responses when selected options change
  useEffect(() => {
    if (!surveyData?.multiple_choice_responses) return;

    const responses: MultipleChoiceResponse[] = surveyData.multiple_choice_responses.map(
      (questionObj, index) => ({
        questionObject: questionObj,
        response: selectedOptions[index] || null,
      })
    );

    setMultipleChoiceResponses(responses);
  }, [selectedOptions, surveyData]);

  const handleOptionSelect = (index: number, option: Option): void => {
    setSelectedOptions((prev) => ({
      ...prev,
      [index]: option,
    }));
  };

  const handleOpenResponseChange = (index: number, text: string): void => {
    if (!surveyData?.open_responses) return;

    setOpenResponses((prev) => ({
      ...prev,
      [index]: {
        questionObject: surveyData.open_responses[index],
        response: text,
      },
    }));
  };

  const submitSurvey = (): void => {
    if (!surveyData || !id) return;

    // Validate all questions are answered
    const totalMultipleChoice = surveyData.multiple_choice_responses.length;
    const answeredMultipleChoice = Object.keys(selectedOptions).length;

    const totalOpenResponses = surveyData.open_responses.length;
    const answeredOpenResponses = Object.values(openResponses).filter(
      (response) => response.response && response.response.trim() !== ''
    ).length;

    if (answeredMultipleChoice < totalMultipleChoice || answeredOpenResponses < totalOpenResponses) {
      Alert.alert(
        'Incomplete Survey',
        'Please answer all questions before submitting.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    const responses = {
      multiple_choice_responses: multipleChoiceResponses,
      open_responses: openResponses,
    };

    submitMutation.mutate(
      { surveyId: id, responses },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Survey submitted successfully!', [
            {
              text: 'OK',
              onPress: () => router.push('/(patient)/surveys'),
            },
          ]);
        },
        onError: (err) => {
          console.error('Error submitting survey:', err);
          Alert.alert('Error', 'Failed to submit survey. Please try again.');
        },
      }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackButton route='/(patient)/surveys'/>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#041575" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackButton route='/(patient)/surveys'/>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!surveyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackButton route='/(patient)/surveys'/>
        <View style={styles.emptyContainer}>
          <Text>No survey data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
          <BackButton route='/(patient)/surveys'/>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.surveyTitle}>{surveyData.survey_title}</Text>

            {/* Multiple Choice Questions */}
            <View style={styles.section}>
              {surveyData.multiple_choice_responses.length > 0 ? (
                <FlatList
                  scrollEnabled={false}
                  data={surveyData.multiple_choice_responses}
                  renderItem={({ item, index }) => (
                    <View style={styles.itemContainer}>
                      <Text style={styles.question}>
                        {item.question.question_description}
                      </Text>
                      <View style={styles.options}>
                        {item.options.map((option) => (
                          <RadioButton
                            key={option.id}
                            label={option.option}
                            selected={selectedOptions[index]?.id === option.id}
                            onSelect={() => handleOptionSelect(index, option)}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item, index) => `mc-${index}`}
                />
              ) : (
                <Text>No multiple choice questions</Text>
              )}
            </View>

            {/* Open Response Questions */}
            <View style={styles.section}>
              {surveyData.open_responses.length > 0 ? (
                <FlatList
                  scrollEnabled={false}
                  data={surveyData.open_responses}
                  renderItem={({ item, index }) => (
                    <View style={styles.itemContainer}>
                      <Text style={styles.question}>
                        {item.question.question_description}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Type your response here..."
                        value={openResponses[index]?.response || ''}
                        onChangeText={(text) => handleOpenResponseChange(index, text)}
                      />
                    </View>
                  )}
                  keyExtractor={(item, index) => `open-${index}`}
                />
              ) : (
                <Text>No open response questions</Text>
              )}
            </View>

            <Pressable
              style={[styles.submitButton, submitMutation.isPending && { opacity: 0.6 }]}
              onPress={submitSurvey}
              disabled={submitMutation.isPending}
            >
              <Text style={styles.submitButtonText}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  scrollContainer: {
    padding: 15,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#cae7ff',
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Figtree_400Regular',
  },
  section: {
    marginBottom: 20,
  },
  itemContainer: {
    marginBottom: 15,
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: '#00205B',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'Figtree_400Regular',
  },
  options: {
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFF',
  },
  radioOptionPressed: {
    backgroundColor: '#E6F0FF',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00205B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioSelected: {
    borderColor: '#00205B',
    backgroundColor: '#E6F0FF',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00205B',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Figtree_400Regular',
  },
  radioLabelSelected: {
    color: '#00205B',
    fontWeight: '500',
  },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginTop: 8,
    textAlignVertical: 'top',
    fontFamily: 'Figtree_400Regular',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#00205B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
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
    color: 'red',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function SurveyResponderWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <SurveyResponder />
    </ProtectedRoute>
  );
}
