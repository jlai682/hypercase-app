import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Button,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import BackButton from '@/components/ui/BackButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Patient, Option, Question } from '@/types';
import { useCreateSurvey } from '@/hooks/queries';

interface MultipleChoiceQuestionOnlyOptions extends Question {
  options: Option[];
}

function FinalizeSurvey(): React.JSX.Element {
  const { selectedMC, selectedOpen, patient } = useLocalSearchParams<{
    selectedMC: string;
    selectedOpen: string;
    patient: string;
  }>();

  const parsedPatient: Patient | null = patient ? JSON.parse(patient) : null;
  const parsedOpenQuestions: Question[] = selectedOpen ? JSON.parse(selectedOpen) : [];
  const parsedMCQuestions: MultipleChoiceQuestionOnlyOptions[] = selectedMC ? JSON.parse(selectedMC) : [];

  const [error, setError] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState<string>(() => {
    const today = format(new Date(), 'MMMM d, yyyy');
    return `${today} Survey`;
  });

  const router = useRouter();
  const createSurveyMutation = useCreateSurvey();

  const handleCreateSurvey = (): void => {
    if (!parsedPatient) {
      setError('Patient data is missing');
      return;
    }

    createSurveyMutation.mutate(
      {
        title: surveyTitle,
        patientId: parsedPatient.id,
        openQuestionIds: parsedOpenQuestions.map((q) => q.id),
        mcQuestionIds: parsedMCQuestions.map((q) => q.id),
      },
      {
        onSuccess: () => {
          router.push({
            pathname: `/(provider)/patients/${parsedPatient.id}` as any,
            params: { email: parsedPatient.email },
          });
        },
        onError: (err) => {
          setError(err.message || 'Something went wrong');
        },
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#cae7ff' }}>
      <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Finalize Your Survey</Text>

        <Text style={styles.label}>Survey Title:</Text>
        <TextInput
          style={styles.input}
          value={surveyTitle}
          onChangeText={setSurveyTitle}
        />

        <Text style={styles.heading}>Open-ended Questions</Text>
        {parsedOpenQuestions.map((q) => (
          <View key={`open-${q.id}`} style={styles.card}>
            <Text style={styles.questionText}>{q.question_description}</Text>
          </View>
        ))}

        <Text style={styles.heading}>Multiple Choice Questions</Text>
        {parsedMCQuestions.map((q) => (
          <View key={`mc-${q.id}`} style={styles.card}>
            <Text style={styles.questionText}>{q.question_description}</Text>
            {q.options.map((opt) => (
              <Text key={opt.id} style={styles.optionText}>
                {opt.option}
              </Text>
            ))}
          </View>
        ))}

        <Button
          title={createSurveyMutation.isPending ? 'Creating...' : 'Create Survey'}
          onPress={handleCreateSurvey}
          disabled={createSurveyMutation.isPending}
        />

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#cae7ff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    fontFamily: 'Figtree_400Regular',
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
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_400Regular',
  },
  optionText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
    fontFamily: 'Figtree_400Regular',
  },
  error: {
    color: 'red',
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: 'Figtree_400Regular',
  },
});

export default function FinalizeSurveyWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <FinalizeSurvey />
    </ProtectedRoute>
  );
}
