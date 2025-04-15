import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import NavBar from '@/components/navigation/NavBar';

const RadioButton = ({ selected, onSelect, label }) => (
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
    <ThemedText style={[
      styles.radioLabel,
      selected && styles.radioLabelSelected
    ]}>{label}</ThemedText>
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
    console.log('Survey answers:', answers);
    router.push('/record');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedText style={styles.header}>Voice Assessment</ThemedText>
        <ThemedView style={styles.content}>
          
          <View style={styles.questionCard}>
            <ThemedText style={styles.question}>
              How often do you experience voice strain or hoarseness?
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
              When you experience voice problems, how long do they typically last?
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
              How do voice problems impact your daily activities?
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
            <ThemedText style={styles.submitButtonText}>Submit Assessment</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
      <NavBar></NavBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ADD8E6', // Light blue background
  },
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 10,
    color: '#041575',
  },
  content: {
    padding: 24,
    paddingTop: 16,
    gap: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF', 
    textAlign: 'center',
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#00205B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 20,
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: '#00205B',
    lineHeight: 24,
    marginBottom: 4,
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
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00205B',
  },
  radioLabel: {
    fontSize: 16,
    color: '#4A5568',
    flex: 1,
  },
  radioLabelSelected: {
    color: '#00205B',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#00205B',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#00205B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonPressed: {
    backgroundColor: '#001845',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});