import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Button,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import config from '../../config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';


export default function SelectQuestions() {
    const { authState } = useAuth();
    const token = authState.token;

    const { patient } = useLocalSearchParams();

    const [openQuestions, setOpenQuestions] = useState([]);
    const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState([]);
    const [error, setError] = useState(null);

    const router = useRouter();

    const [selectedMC, setSelectedMC] = useState([]);
    const [selectedOpen, setSelectedOpen] = useState([]);

    const toggleSelect = (type, question) => {
        const selected = type === 'open' ? selectedOpen : selectedMC;
        const setSelected = type === 'open' ? setSelectedOpen : setSelectedMC;

        setSelected((prev) =>
            prev.some((q) => q.id === question.id)
                ? prev.filter((q) => q.id !== question.id)
                : [...prev, question]
        );
    };

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch(
                    `${config.BACKEND_URL}/api/surveyManagement/get_all_questions/`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();
                if (response.ok) {
                    setOpenQuestions(data.open_questions);
                    setMultipleChoiceQuestions(data.multiple_choice_questions);
                } else {
                    setError(data.error || 'Failed to fetch questions');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                setError('Something went wrong while fetching questions.');
            }
        };

        fetchQuestions();
    }, [token]);

    const isNextDisabled = selectedMC.length === 0 && selectedOpen.length === 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#cae7ff' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.pageTitle}>Select Questions</Text>

                <Text style={styles.heading}>Open-ended Questions</Text>
                {openQuestions.map((question) => (
                    <View
                        key={question.id}
                        style={[
                            styles.card,
                            selectedOpen.some((q) => q.id === question.id) && styles.selectedCard,
                        ]}
                        onTouchEnd={() => toggleSelect('open', question)}
                    >
                        <Text style={styles.questionText}>{question.question_description}</Text>
                    </View>
                ))}

                <Text style={styles.heading}>Multiple Choice Questions</Text>
                {multipleChoiceQuestions.map((question) => (
                    <View
                        key={question.id}
                        style={[
                            styles.card,
                            selectedMC.some((q) => q.id === question.id) && styles.selectedCard,
                        ]}
                        onTouchEnd={() => toggleSelect('mc', question)}
                    >
                        <Text style={styles.questionText}>{question.question_description}</Text>
                        {question.options.map((opt) => (
                            <Text key={opt.id} style={styles.optionText}>
                                • {opt.option}
                            </Text>
                        ))}
                    </View>
                ))}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        disabled={isNextDisabled}
                        style={[styles.surveyButton, isNextDisabled && styles.disabledButton]}
                        onPress={() =>
                            router.push({
                                pathname: '/survey/finalizeSurvey',
                                params: {
                                    selectedMC: JSON.stringify(selectedMC),
                                    selectedOpen: JSON.stringify(selectedOpen),
                                    patient: patient,
                                },
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>

                </View>

                {error && <Text style={styles.error}>{error}</Text>}
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
        shadowColor: '#87CFE9',
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
      


});
