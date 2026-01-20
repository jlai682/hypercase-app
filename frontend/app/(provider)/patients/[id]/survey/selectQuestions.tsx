import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAllQuestions } from '@/hooks/queries';
import { Option, Question,  } from '@/types';

interface MultipleChoiceQuestionOnlyOptions extends Question {
  options: Option[];
}

function SelectQuestions(): React.JSX.Element {
  const { patient } = useLocalSearchParams<{ patient: string }>();
  const parsedPatient = patient ? JSON.parse(patient) : null;
  const router = useRouter();

  // Tanstack Query hook
  const { data: questionsData, isLoading, error } = useAllQuestions();
  const openQuestions = questionsData?.open_questions || [];
  const multipleChoiceQuestions = questionsData?.multiple_choice_questions || [];

  const [selectedMC, setSelectedMC] = useState<MultipleChoiceQuestionOnlyOptions[]>([]);
  const [selectedOpen, setSelectedOpen] = useState<Question[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const filteredOpenQuestions = openQuestions.filter((q) =>
    q.question_description.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredMCQuestions = multipleChoiceQuestions.filter((q) =>
    q.question_description.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleSelect = (type: 'open' | 'mc', question: Question | MultipleChoiceQuestionOnlyOptions): void => {
    if (type === 'open') {
      setSelectedOpen((prev) =>
        prev.some((q) => q.id === question.id)
          ? prev.filter((q) => q.id !== question.id)
          : [...prev, question as Question]
      );
    } else {
      setSelectedMC((prev) =>
        prev.some((q) => q.id === question.id)
          ? prev.filter((q) => q.id !== question.id)
          : [...prev, question as MultipleChoiceQuestionOnlyOptions]
      );
    }
  };

  const isNextDisabled = selectedMC.length === 0 && selectedOpen.length === 0;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#cae7ff' }}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
          <BackButton />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#041575" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#cae7ff' }}>
      <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Select Questions</Text>

        <TextInput
          style={styles.searchBar}
          placeholder="Search questions..."
          value={searchText}
          onChangeText={setSearchText}
        />

        <Text style={styles.heading}>Open-ended Questions</Text>
        {filteredOpenQuestions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.card,
              selectedOpen.some((q) => q.id === question.id) && styles.selectedCard,
            ]}
            onPress={() => toggleSelect('open', question)}
          >
            <Text style={styles.questionText}>{question.question_description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.heading}>Multiple Choice Questions</Text>
        {filteredMCQuestions.map((question) => (
          <TouchableOpacity
            key={question.id}
            style={[
              styles.card,
              selectedMC.some((q) => q.id === question.id) && styles.selectedCard,
            ]}
            onPress={() => toggleSelect('mc', question)}
          >
            <Text style={styles.questionText}>{question.question_description}</Text>
            {question.options.map((opt) => (
              <Text key={opt.id} style={styles.optionText}>
                • {opt.option}
              </Text>
            ))}
          </TouchableOpacity>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={isNextDisabled}
            style={[styles.surveyButton, isNextDisabled && styles.disabledButton]}
            onPress={() =>
              router.push({
                pathname: `/(provider)/patients/${parsedPatient?.id}/survey/finalizeSurvey`,
                params: {
                  selectedMC: JSON.stringify(selectedMC),
                  selectedOpen: JSON.stringify(selectedOpen),
                  patient: patient,
                },
              } as any)
            }
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error.message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#cae7ff',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#041575',
    textAlign: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#041575',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#007aff',
    borderWidth: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  optionText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 30,
  },
  surveyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(135, 207, 233, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  buttonText: {
    fontSize: 16,
    color: '#041575',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
});

export default function SelectQuestionsWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <SelectQuestions />
    </ProtectedRoute>
  );
}
