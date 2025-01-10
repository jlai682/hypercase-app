import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const RadioButton = ({ selected, onSelect, label }) => (
  <Pressable onPress={onSelect} style={styles.radioOption}>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
    <ThemedText style={styles.radioLabel}>{label}</ThemedText>
  </Pressable>
);

export default function SurveyScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState({
    frequency: '',
    duration: '',
    impact: '',
  });

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log('Survey answers:', answers);
    router.push('/record');
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.questionCard}>
          <ThemedText style={styles.question}>
            1. How often do you experience voice strain or hoarseness?
          </ThemedText>
          <View style={styles.options}>
            <RadioButton
              selected={answers.frequency === 'never'}
              onSelect={() => setAnswers({ ...answers, frequency: 'never' })}
              label="Never"
            />
            <RadioButton
              selected={answers.frequency === 'sometimes'}
              onSelect={() => setAnswers({ ...answers, frequency: 'sometimes' })}
              label="Sometimes (1-2 times per month)"
            />
            <RadioButton
              selected={answers.frequency === 'often'}
              onSelect={() => setAnswers({ ...answers, frequency: 'often' })}
              label="Often (1-2 times per week)"
            />
            <RadioButton
              selected={answers.frequency === 'daily'}
              onSelect={() => setAnswers({ ...answers, frequency: 'daily' })}
              label="Daily"
            />
          </View>
        </View>

        <View style={styles.questionCard}>
          <ThemedText style={styles.question}>
            2. When you experience voice problems, how long do they typically last?
          </ThemedText>
          <View style={styles.options}>
            <RadioButton
              selected={answers.duration === 'few_hours'}
              onSelect={() => setAnswers({ ...answers, duration: 'few_hours' })}
              label="A few hours"
            />
            <RadioButton
              selected={answers.duration === 'one_day'}
              onSelect={() => setAnswers({ ...answers, duration: 'one_day' })}
              label="One day"
            />
            <RadioButton
              selected={answers.duration === 'several_days'}
              onSelect={() => setAnswers({ ...answers, duration: 'several_days' })}
              label="Several days"
            />
            <RadioButton
              selected={answers.duration === 'week_plus'}
              onSelect={() => setAnswers({ ...answers, duration: 'week_plus' })}
              label="More than a week"
            />
          </View>
        </View>

        <View style={styles.questionCard}>
          <ThemedText style={styles.question}>
            3. How do voice problems impact your daily activities?
          </ThemedText>
          <View style={styles.options}>
            <RadioButton
              selected={answers.impact === 'no_impact'}
              onSelect={() => setAnswers({ ...answers, impact: 'no_impact' })}
              label="No impact"
            />
            <RadioButton
              selected={answers.impact === 'mild'}
              onSelect={() => setAnswers({ ...answers, impact: 'mild' })}
              label="Mild impact"
            />
            <RadioButton
              selected={answers.impact === 'moderate'}
              onSelect={() => setAnswers({ ...answers, impact: 'moderate' })}
              label="Moderate impact"
            />
            <RadioButton
              selected={answers.impact === 'severe'}
              onSelect={() => setAnswers({ ...answers, impact: 'severe' })}
              label="Severe impact"
            />
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed
          ]}
          onPress={handleSubmit}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
          <ThemedText style={styles.submitButtonText}>Submit Survey</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C5282',
    lineHeight: 24,
  },
  options: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#4A90E2',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  radioLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonPressed: {
    backgroundColor: '#2C5282',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});